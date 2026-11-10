# ScopeSnap — AI-Powered Freelancer Agreement & Payment Clarity Platform

> **"Turn conversations into clear agreements. Connect payments to confirmed milestones. Preserve verifiable evidence when the scope changes."**

ScopeSnap converts informal client conversations into structured, evidence-backed agreements. It connects agreed payment milestones to PayPal Orders v2, generates tamper-evident Ed25519 digitally signed receipts, and detects unagreed scope alterations before work proceeds.

---

## 1. Product Boundaries (What ScopeSnap Is NOT)

- **NOT an escrow service or bank.**
- **NOT a law firm or legal-advice provider.**
- **NOT a guarantee against disputes or fraud.**
- Provides factual, verifiable clarity: verbatim transcript evidence, deterministic SHA-256 agreement fingerprints, two-party version confirmation, and independent public cryptographic receipt verification.

---

## 2. Official Synthetic Demo Scenario

The application is pre-seeded with the official synthetic demo scenario:
- **Client**: Elena Reyes (Organization: *Atelier Monolith*)
- **Freelancer**: Alex Morgan
- **Project**: Logo Design Project
- **Agreed Terms**:
  1. Deliver three distinct initial logo concepts.
  2. Include up to two revision rounds.
  3. Final deliverables: Transparent PNG files and Adobe Illustrator AI master files.
  4. Total project price: USD 100.
  5. Initial advance payment: USD 50 before kickoff.
  6. Remaining payment: USD 50 due upon final approved files.
  7. Concept deadline: 7 calendar days from receipt of initial deposit.
- **Important**: All demo records are visibly labeled **`SYNTHETIC DEMO DATA`**.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Space Grotesk / Inter / IBM Plex Mono typography.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Cryptographic Engine**:
  - **SHA-256**: Deterministic canonical agreement serialization & fingerprinting.
  - **Ed25519**: Server-side digital signatures on payment receipts with public verification.
- **AI Processing**: Google Gemini API via `@google/genai` (`gemini-2.5-flash`), with transparent deterministic fallback engine when API key is unconfigured.
- **Payments**: PayPal REST API (Orders v2 Sandbox) with server-side capture reconciliation & idempotency.
- **Database & Security**: Firestore data architecture & `firestore.rules` least-privilege security model.

---

## 4. Architecture & Key Workflows

```
Conversational Messages (Slack, Email, Chat)
                │
                ▼
  [AI Intake & Evidence Engine]
  - Verbatim quotation matching
  - EXACT_MATCH / NEEDS_REVIEW / NOT_FOUND
                │
                ▼
  [Deterministic Agreement Canonicalization]
  - Sorted field structure & normalized numbers
  - SHA-256 Canonical Fingerprint (IBM Plex Mono)
                │
                ▼
  [Two-Party Version Confirmation]
  - Secure time-limited client review token
  - Version locked & immutable upon mutual sign-off
                │
                ▼
  [PayPal Orders v2 Milestone Settlement]
  - Server-side order capture & amount reconciliation
  - Idempotent duplicate prevention
                │
                ▼
  [Ed25519 Digital Receipt]
  - Server private key signing -> SHA-256 payload hash
  - Independent public verification portal
                │
                ▼
  [Scope Change Sentinel]
  - Evaluates new client communications
  - Proposes Addenda -> creates Version 2 without destroying v1
```

---

## 5. Local Development & Testing

### Installation
```bash
npm install
```

### Running the Full-Stack Dev Server
```bash
npm run dev
# Starts Express server + Vite middlewares on http://localhost:3000
```

### Running Pure Unit Tests
```bash
npx --yes tsx --test tests/**/*.test.ts
```

### Running TypeScript Check & Build
```bash
npm run lint
npm run build
```

---

## 6. Environment Variables

Create a `.env` file from `.env.example`:
```env
GEMINI_API_KEY=""        # Optional: For live Gemini 2.5 Flash extraction
PAYPAL_CLIENT_ID=""      # Optional: PayPal Sandbox REST App Client ID
PAYPAL_CLIENT_SECRET=""  # Optional: PayPal Sandbox REST App Secret
PAYPAL_MODE="sandbox"
APP_URL="http://localhost:3000"
```

*Note: If external credentials are not set, ScopeSnap automatically operates in verified Synthetic Demo Mode with clear status badges, allowing all features to be tested end-to-end.*
