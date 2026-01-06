
import { Activity, Award, Star, UserPlus, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { analyzeHRProfile } from '../services/geminiService';
import { Employee, UserSession } from '../types';
import EmployeeDirectory from './hr/components/EmployeeDirectory';
import EmployeeForm from './hr/components/EmployeeForm';
import StatPanel from './hr/components/StatPanel';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const HRModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees, addEmployee, deleteEmployee } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAiAnalysis = async (emp: Employee) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeHRProfile(JSON.stringify(emp));
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Error en el análisis de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Desea eliminar este registro del staff?')) {
      deleteEmployee(id);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Talent Management</h2>
          <p className="opacity-50 text-lg font-medium italic">Gestión integral de staff clínico y perfiles de alta precisión.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus className="w-5 h-5" /> Nuevo
        </button>
      </div>

      {isModalOpen && (
        <EmployeeForm 
          isDark={isDark} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={async (data) => { await addEmployee(data); setIsModalOpen(false); }} 
        />
      )}

      <StatPanel employees={employees} isDark={isDark} />

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <EmployeeDirectory 
            employees={employees} 
            isDark={isDark} 
            onAnalyze={runAiAnalysis} 
            onDelete={handleDelete} 
          />
        </div>

        <div className="space-y-6">
          <div className={`p-10 rounded-[40px] border relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" /> IA Talent Insight
            </h3>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                <Activity className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Gemini Analizando...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-blue-600 text-white p-6 rounded-3xl mb-6 shadow-xl shadow-blue-500/20 relative">
                  <div className="absolute -top-3 -left-3 p-3 bg-white dark:bg-slate-900 rounded-2xl text-blue-600 shadow-lg">
                    <Star className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 ml-6">Evaluación Prospectiva</h4>
                  <p className="text-sm font-bold italic leading-relaxed">{aiAnalysis}</p>
                </div>
                <button 
                  onClick={() => setAiAnalysis(null)} 
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border-t border-slate-100 dark:border-slate-800 mt-4"
                >
                  Cerrar Análisis
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                <div className="p-8 rounded-full border-4 border-dashed border-slate-400 mb-6">
                  <Activity className="w-12 h-12" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest px-10">Seleccione un profesional para análisis IA predictivo.</p>
              </div>
            )}
          </div>
          
          <div className={`p-8 rounded-[40px] border relative overflow-hidden ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
            <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-600">
              <Award className="w-5 h-5" /> Compliance Clínico
            </h4>
            <div className="space-y-5">
              <ComplianceItem label="ACLS" val="12" color="red" />
              <ComplianceItem label="Derechos Paciente" val="100%" color="emerald" />
              <ComplianceItem label="Protección Radiológica" val="45%" color="blue" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComplianceItem = ({ label, val, color }: any) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <p className="text-[10px] font-black uppercase opacity-60">{label}</p>
      <span className="text-[9px] font-black">{val}</span>
    </div>
    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 transition-all duration-1000`} style={{ width: val.includes('%') ? val : '30%' }} />
    </div>
  </div>
);

export default HRModule;
