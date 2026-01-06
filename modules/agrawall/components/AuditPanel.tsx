
import React from 'react';
import { Upload, FileSearch } from 'lucide-react';
import { AgrawallAnalysis, LoadingStatus } from '../../../types';

interface Props {
  isDark: boolean;
  reportText: string;
  setReportText: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  status: LoadingStatus;
  analysis: AgrawallAnalysis | null;
  onAnalyze: () => void;
}

const AuditPanel: React.FC<Props> = ({ isDark, reportText, setReportText, file, setFile, status, analysis, onAnalyze }) => {
  const getLevelColor = (level: number) => {
    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-cyan-600', 'bg-amber-500', 'bg-orange-600', 'bg-red-700'];
    return colors[level] || 'bg-slate-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-8 rounded-[40px] border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <textarea 
          value={reportText} 
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Pegue el informe médico aquí..."
          className="w-full h-80 bg-transparent outline-none text-sm leading-relaxed resize-none"
        />
        <div className="mt-8 flex gap-4">
          <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500 transition-all">
            <Upload className="w-5 h-5 opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap px-2">
              {file ? file.name : 'Subir PDF/Imagen'}
            </span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button 
            onClick={onAnalyze}
            disabled={status === 'processing'}
            className="px-10 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            Analizar
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {status === 'processing' ? (
          <div className="h-full flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">Gemini Razonando...</p>
          </div>
        ) : analysis ? (
          <div className={`p-8 rounded-[40px] border relative overflow-hidden animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`${getLevelColor(analysis.scaleLevel)} absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-white text-[10px] font-black uppercase`}>
              Nivel {analysis.scaleLevel}
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase">{analysis.levelName}</h3>
            <p className="text-sm opacity-50 mb-8 font-bold uppercase tracking-tight">{analysis.category}</p>
            <div className="space-y-6">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Análisis Técnico</p>
                <p className="text-sm font-medium leading-relaxed">{analysis.technicalAnalysis}</p>
              </div>
              <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Recomendación IA</p>
                <p className="text-sm font-bold italic">"{analysis.safetyRecommendation}"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] flex flex-col items-center justify-center opacity-20 p-20">
            <FileSearch className="w-20 h-20 mb-6" />
            <p className="text-[10px] font-black uppercase tracking-widest">Esperando Documento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPanel;
