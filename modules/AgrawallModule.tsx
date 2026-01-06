
import React, { useState, useMemo } from 'react';
import { analyzeMedicalReport } from '../services/geminiService';
import { useAgrawall } from '../hooks/useAgrawall';
import { AgrawallAnalysis, LoadingStatus, UserSession } from '../types';
import AuditPanel from './agrawall/components/AuditPanel';
import { History, BarChart3, ClipboardList, Trash2, ArrowRight, Download } from 'lucide-react';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const AgrawallModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { history, saveAudit, deleteAudit } = useAgrawall();
  const [reportText, setReportText] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [analysis, setAnalysis] = useState<AgrawallAnalysis | null>(null);
  const [subView, setSubView] = useState<'audit' | 'history' | 'analytics'>('audit');

  const userFilteredHistory = useMemo(() => {
    if (currentUser.role === 'Superuser' || currentUser.role === 'Jefatura') return history;
    // Filtrado seguro: busca cualquier parte del nombre del usuario en el campo del médico informante
    const userSearchTerms = currentUser.name.toLowerCase().split(' ').filter(t => t.length > 2);
    return history.filter(h => {
      const physician = h.metadata.reportingPhysician.toLowerCase();
      return userSearchTerms.some(term => physician.includes(term));
    });
  }, [history, currentUser]);

  const processAudit = async () => {
    if (!reportText && !file) return;
    setStatus('processing');
    try {
      let result;
      if (file) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        result = await analyzeMedicalReport(base64, referenceText, true, file.type);
      } else {
        result = await analyzeMedicalReport(reportText, referenceText);
      }
      setAnalysis(result.analysis);
      await saveAudit(result.analysis);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    }
  };

  const exportToCSV = () => {
    if (userFilteredHistory.length === 0) return;

    const headers = [
      "ID Auditoría", "Fecha Registro", "Nivel Agrawal", "Descripción Nivel", "Categoría",
      "Tipo Error", "Análisis Técnico", "Impacto Clínico", "Recomendación Seguridad",
      "Hallazgos: Identificación", "Hallazgos: Terminología", "Hallazgos: Correlación",
      "Nombre Paciente", "Tipo Examen", "Fecha Informe", "Médico Informante", "Centro Clínico"
    ];

    const rows = userFilteredHistory.map(item => {
      const clean = (text: string | number = '') => `"${String(text).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      return [
        clean(item.id), clean(new Date(item.timestamp).toLocaleString()), clean(item.scaleLevel),
        clean(item.levelName), clean(item.category), clean(item.errorType), clean(item.technicalAnalysis),
        clean(item.clinicalImpactDetails), clean(item.safetyRecommendation), clean(item.findingsEvaluation?.identification || 'N/A'),
        clean(item.findingsEvaluation?.terminology || 'N/A'), clean(item.findingsEvaluation?.correlation || 'N/A'),
        clean(item.metadata.patientName), clean(item.metadata.examType), clean(item.metadata.reportDate),
        clean(item.metadata.reportingPhysician), clean(item.metadata.clinicalCenter)
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `auditorias_amis_agrawal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-cyan-600', 'bg-amber-500', 'bg-orange-600', 'bg-red-700'];
    return colors[level] || 'bg-slate-600';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Radiology QA Engine</h2>
          <p className="opacity-50 text-sm italic font-medium">Escala de Agrawal 2010 • Sesión de {currentUser.name}.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {subView === 'history' && userFilteredHistory.length > 0 && (
            <button 
              onClick={exportToCSV}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 transition-all border shadow-sm ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <Download className="w-4 h-4" /> EXPORTAR CSV
            </button>
          )}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
            <NavButton active={subView === 'audit'} onClick={() => setSubView('audit')} label="AUDITORÍA" icon={<ClipboardList className="w-4 h-4" />} />
            <NavButton active={subView === 'history'} onClick={() => setSubView('history')} label="REGISTROS" icon={<History className="w-4 h-4" />} />
            <NavButton active={subView === 'analytics'} onClick={() => setSubView('analytics')} label="MÉTRICAS" icon={<BarChart3 className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {subView === 'audit' && (
        <AuditPanel 
          isDark={isDark} 
          reportText={reportText} 
          setReportText={setReportText} 
          file={file} 
          setFile={setFile} 
          status={status} 
          analysis={analysis} 
          onAnalyze={processAudit} 
        />
      )}

      {subView === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 animate-in fade-in duration-500">
           {[0,1,2,3,4,5].map(level => {
             const count = userFilteredHistory.filter(h => h.scaleLevel === level).length;
             return (
               <div key={level} className={`p-6 rounded-[32px] border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`w-3 h-3 rounded-full mb-4 ${getLevelColor(level)}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Agrawal L{level}</p>
                  <h3 className="text-3xl font-black">{count}</h3>
               </div>
             );
           })}
        </div>
      )}

      {subView === 'history' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {userFilteredHistory.length === 0 ? (
            <div className="py-20 text-center opacity-20"><History className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-xs">No hay auditorías para su perfil</p></div>
          ) : userFilteredHistory.map(item => (
            <div key={item.id} className={`p-6 rounded-[32px] border flex items-center justify-between group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${getLevelColor(item.scaleLevel)}`}>
                  {item.scaleLevel}
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{item.metadata.patientName || 'Paciente Anónimo'}</h4>
                  <p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">{item.metadata.examType} · {new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deleteAudit(item.id)} className="p-3 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                <button 
                  onClick={() => { setAnalysis(item); setSubView('audit'); }}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          ))}
        </div>
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

export default AgrawallModule;
