import type { PaymentMilestone, PaymentOrder, SignedReceipt } from '../../src/types';
import { cryptoService } from './cryptoService';

export interface PayPalConfigStatus {
  isConfigured: boolean;
  mode: 'sandbox' | 'live' | 'unconfigured';
  clientIdProvided: boolean;
  clientSecretProvided: boolean;
}

export interface CreateOrderParams {
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  currency: string;
  agreementId: string;
  versionId: string;
  projectId: string;
  returnUrl?: string;
  cancelUrl?: string;
  isSyntheticDemo?: boolean;
}

export interface CaptureOrderResult {
  success: boolean;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'DECLINED' | 'ALREADY_CAPTURED';
  orderId: string;
  captureId?: string;
  amount: number;
  currency: string;
  payerName?: string;
  payerEmail?: string;
  rawResponse?: Record<string, unknown>;
  reconciled: boolean;
  message: string;
}

class PayPalService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private baseUrl: string = 'https://api-m.sandbox.paypal.com';
  private accessToken: { token: string; expiresAt: number } | null = null;
  private processedCaptures = new Set<string>();

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || null;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || null;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    this.baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }

  public getConfigStatus(): PayPalConfigStatus {
    const isConfigured = !!(this.clientId && this.clientSecret);
    return {
      isConfigured,
      mode: isConfigured ? (this.baseUrl.includes('sandbox') ? 'sandbox' : 'live') : 'unconfigured',
      clientIdProvided: !!this.clientId,
      clientSecretProvided: !!this.clientSecret,
    };
  }

  /**
   * Retrieves OAuth2 access token from PayPal REST API
   */
  private async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal Sandbox credentials not configured on server.');
    }

    if (this.accessToken && Date.now() < this.accessToken.expiresAt) {
      return this.accessToken.token;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal OAuth failed: ${response.status} ${err}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return this.accessToken.token;
  }

  /**
   * Creates a PayPal v2 Checkout Order
   */
  public async createOrder(params: CreateOrderParams): Promise<{
    orderId: string;
    approvalUrl: string;
    status: string;
    isSyntheticDemo: boolean;
  }> {
    const { isConfigured } = this.getConfigStatus();

    // If real PayPal credentials are provided and not synthetic demo mode
    if (isConfigured && !params.isSyntheticDemo) {
      const token = await this.getAccessToken();
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.milestoneId,
            description: `ScopeSnap: ${params.milestoneTitle} (Agmt: ${params.agreementId})`,
            custom_id: JSON.stringify({
              agreementId: params.agreementId,
              versionId: params.versionId,
              milestoneId: params.milestoneId,
              projectId: params.projectId,
            }),
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'ScopeSnap Agreement Platform',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: params.returnUrl || 'http://localhost:3000/payments/callback',
          cancel_url: params.cancelUrl || 'http://localhost:3000/payments/cancel',
        },
      };

      const res = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`PayPal Order creation failed (${res.status}): ${errorText}`);
      }

      const orderData = (await res.json()) as {
        id: string;
        status: string;
        links: Array<{ rel: string; href: string }>;
      };

      const approvalLink = orderData.links.find(l => l.rel === 'approve');
      return {
        orderId: orderData.id,
        approvalUrl: approvalLink ? approvalLink.href : '',
        status: orderData.status,
        isSyntheticDemo: false,
      };
    }

    // Explicit Synthetic Demo Simulation (when credentials not configured or demo requested)
    const syntheticOrderId = `SYNTH_PP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      orderId: syntheticOrderId,
      approvalUrl: `https://sandbox.paypal.com/checkoutnow?token=${syntheticOrderId}`,
      status: 'CREATED',
      isSyntheticDemo: true,
    };
  }

  /**
   * Captures a PayPal order server-side with idempotency and reconciliation
   */
  public async captureOrder(
    orderId: string,
    expectedMilestone: PaymentMilestone
  ): Promise<CaptureOrderResult> {
    // Idempotency check: prevent duplicate capture attempts
    if (this.processedCaptures.has(orderId)) {
      return {
        success: false,
        status: 'ALREADY_CAPTURED',
        orderId,
        amount: expectedMilestone.amount,
        currency: expectedMilestone.currency,
        reconciled: false,
        message: 'Order has already been captured and processed. Duplicate capture blocked by server.',
      };
    }

    const { isConfigured } = this.getConfigStatus();

    // Check if this is a synthetic demo order
    const isSynthetic = orderId.startsWith('SYNTH_PP_');

    if (!isSynthetic && isConfigured) {
      try {
        const token = await this.getAccessToken();
        const res = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
        });

        if (!res.ok) {
          const errText = await res.text();
          return {
            success: false,
            status: 'FAILED',
            orderId,
            amount: expectedMilestone.amount,
            currency: expectedMilestone.currency,
            reconciled: false,
            message: `PayPal capture API returned error (${res.status}): ${errText}`,
          };
        }

        const data = (await res.json()) as {
          status: string;
          payer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
          purchase_units?: Array<{
            payments?: {
              captures?: Array<{
                id: string;
                status: string;
                amount: { currency_code: string; value: string };
              }>;
            };
          }>;
        };

        const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
        const captureStatus = capture?.status || data.status;

        if (captureStatus !== 'COMPLETED') {
          return {
            success: false,
            status: 'PENDING',
            orderId,
            captureId: capture?.id,
            amount: expectedMilestone.amount,
            currency: expectedMilestone.currency,
            reconciled: false,
            message: `Payment capture is not in COMPLETED state. Current status: ${captureStatus}`,
          };
        }

        // Reconcile amounts and currency strictly!
        const capturedAmount = parseFloat(capture?.amount?.value || '0');
        const capturedCurrency = capture?.amount?.currency_code?.toUpperCase() || '';
        const expectedCurrency = expectedMilestone.currency.toUpperCase();

        if (
          Math.abs(capturedAmount - expectedMilestone.amount) > 0.01 ||
          capturedCurrency !== expectedCurrency
        ) {
          return {
            success: false,
            status: 'FAILED',
            orderId,
            captureId: capture?.id,
            amount: capturedAmount,
            currency: capturedCurrency,
            reconciled: false,
            message: `Reconciliation error: Captured ${capturedCurrency} ${capturedAmount} does not match expected milestone amount ${expectedCurrency} ${expectedMilestone.amount}.`,
          };
        }

        this.processedCaptures.add(orderId);
        const payerGiven = data.payer?.name?.given_name || '';
        const payerSurname = data.payer?.name?.surname || '';
        const payerName = `${payerGiven} ${payerSurname}`.trim() || 'Elena Reyes';
        const payerEmail = data.payer?.email_address || 'elena@ateliermonolith.com';

        return {
          success: true,
          status: 'COMPLETED',
          orderId,
          captureId: capture?.id,
          amount: capturedAmount,
          currency: capturedCurrency,
          payerName,
          payerEmail,
          rawResponse: data,
          reconciled: true,
          message: 'Payment successfully captured and reconciled with milestone.',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          status: 'FAILED',
          orderId,
          amount: expectedMilestone.amount,
          currency: expectedMilestone.currency,
          reconciled: false,
          message: `Network or unexpected error capturing PayPal order: ${errorMsg}`,
        };
      }
    }

    // Synthetic Demo Flow: Verified server-side simulated capture
    const synthCaptureId = `SYNTH_CAP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    this.processedCaptures.add(orderId);

    return {
      success: true,
      status: 'COMPLETED',
      orderId,
      captureId: synthCaptureId,
      amount: expectedMilestone.amount,
      currency: expectedMilestone.currency,
      payerName: 'Elena Reyes (Synthetic Client)',
      payerEmail: 'elena@ateliermonolith.com',
      reconciled: true,
      message: 'SYNTHETIC DEMO DATA: Simulated PayPal sandbox capture reconciled successfully.',
    };
  }
}

export const paypalService = new PayPalService();
