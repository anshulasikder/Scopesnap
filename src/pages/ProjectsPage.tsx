import React, { useEffect, useState } from 'react';
import { FolderPlus, FileText, User, Mail, Calendar, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import type { Project } from '../types';
import { fetchProjects, createProject } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ProjectsPageProps {
  onSelectProject: (projectId: string) => void;
  onNavigateTab: (tab: string, meta?: Record<string, unknown>) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject, onNavigateTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientOrg, setClientOrg] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName) return;
    setLoading(true);
    try {
      await createProject({
        name,
        description,
        clientName,
        clientOrg,
        clientEmail,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setClientName('');
      setClientOrg('');
      setClientEmail('');
      await loadProjects();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#F4F1E8]">
            Project Workspaces
          </h1>
          <p className="text-xs font-mono text-stone-400 mt-1">
            Isolated project spaces with client association and immutable agreement trails
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D9F36A] text-[#151C1B] font-mono font-semibold text-xs hover:bg-[#cbf046] transition cursor-pointer shadow"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
          <div
            key={p.id}
            className="bg-[#18201e] border border-stone-800 rounded-2xl p-6 shadow-md hover:border-stone-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-500">ID: {p.id}</span>
                <StatusBadge status={p.status} isSyntheticDemo={p.isSyntheticDemo} />
              </div>

              <h3 className="font-heading font-bold text-lg text-[#F4F1E8]">
                {p.name}
              </h3>

              <p className="text-stone-300 text-xs leading-relaxed line-clamp-2">
                {p.description || 'No description provided.'}
              </p>

              <div className="p-3 bg-[#121716] rounded-xl border border-stone-800 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-stone-400">
                  <User className="w-3.5 h-3.5 text-[#648D83]" />
                  <span>Client: <strong className="text-stone-200">{p.client.name}</strong></span>
                </div>
                {p.client.organization && (
                  <p className="text-[11px] text-stone-500 pl-5">{p.client.organization}</p>
                )}
                {p.client.email && (
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[11px] text-stone-400 truncate">{p.client.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(p.createdAt).toLocaleDateString()}
              </span>

              <button
                type="button"
                onClick={() => onNavigateTab('agreements', { projectId: p.id })}
                className="inline-flex items-center gap-1 text-xs font-mono text-[#D9F36A] hover:underline cursor-pointer"
              >
                <span>View Agreement</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#18201e] border border-stone-700 rounded-2xl p-6 shadow-2xl space-y-5 text-left">
            <h3 className="font-heading font-bold text-xl text-[#F4F1E8]">Create New Project</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-stone-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Brand Identity Refresh"
                  className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#D9F36A]"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Project Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief summary of requirements..."
                  className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#D9F36A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="e.g. Elena Reyes"
                    className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#D9F36A]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 mb-1">Client Organization</label>
                  <input
                    type="text"
                    value={clientOrg}
                    onChange={e => setClientOrg(e.target.value)}
                    placeholder="e.g. Atelier Monolith"
                    className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#D9F36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 mb-1">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full p-2.5 rounded-lg bg-[#121716] border border-stone-700 text-stone-100 focus:outline-none focus:border-[#D9F36A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#D9F36A] text-[#151C1B] font-semibold hover:bg-[#cbf046] transition cursor-pointer shadow"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
