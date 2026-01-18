import React, { useState } from 'react';
import { useCases } from '../hooks/useCases';
import { useInstitutions } from '../hooks/useInstitutions';
import { UserSession } from '../types';
import CasesDashboard from './cases/components/CasesDashboard';
import CasesList from './cases/components/CasesList';
import CaseForm from './cases/components/CaseForm';
import CaseDetail from './cases/components/CaseDetail';
import { Plus, LayoutDashboard, List, BarChart3, AlertCircle } from 'lucide-react';
import { AgrawallAnalysis } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const CasesModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { cases, createCase, updateStatus, updateCase } = useCases();
  const { institutions } = useInstitutions();

  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const handleCreateSubmit = async (data: any, file: File | null) => {
    // In real app, upload file first then get URL
    const attachment = file ? {
      id: Math.random().toString(36),
      name: file.name,
      type: 'informe_pdf' as const,
      url: 'mock_url_pending_storage_impl',
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id
    } : undefined;

    await createCase({
      ...data,
      attachments: attachment ? [attachment] : []
    });
  };

  const handleStatusChange = async (status: any, notes?: string) => {
    if (!selectedCaseId) return;
    setStatusLoading(true);
    await updateStatus(selectedCaseId, status, currentUser.id, notes);
    setStatusLoading(false);
  };

  const handleLinkAgrawall = async (analysis: AgrawallAnalysis) => {
    if (!selectedCaseId) return;
    await updateCase(selectedCaseId, {
      linkedAgrawallId: analysis.id || 'newly-created',
      agrawallLevel: analysis.scaleLevel
    });
  };

  if (selectedCaseId && selectedCase) {
    return (
      <CaseDetail
        isDark={isDark}
        caseItem={selectedCase}
        onBack={() => setSelectedCaseId(null)}
        onStatusChange={handleStatusChange}
        onLinkAgrawall={handleLinkAgrawall}
        statusLoading={statusLoading}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-blue-600" />
            Gestión de Casos
          </h2>
          <p className="opacity-50 text-sm italic font-medium">Análisis de Discrepancias y Reclamos Radiológicos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} label="KPIs" icon={<LayoutDashboard className="w-4 h-4" />} />
            <NavButton active={view === 'list'} onClick={() => setView('list')} label="Listado" icon={<List className="w-4 h-4" />} />
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nuevo Caso
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[600px]">
        {view === 'dashboard' ? (
          <CasesDashboard isDark={isDark} cases={cases} />
        ) : (
          <CasesList
            isDark={isDark}
            cases={cases}
            onViewCase={(id) => setSelectedCaseId(id)}
          />
        )}
      </div>

      {isFormOpen && (
        <CaseForm
          isDark={isDark}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateSubmit}
          institutions={institutions}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, label, icon }: any) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 transition-all
    ${active ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40 hover:opacity-100'}`}
  >
    {icon} {label}
  </button>
);

export default CasesModule;
