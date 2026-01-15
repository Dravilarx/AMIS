
import { Activity, Award, Star, UserPlus, Zap, Users, BarChart3 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'directorio' | 'analytics'>('directorio');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const runAiAnalysis = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveTab('analytics'); // Switch to analytics tab
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter uppercase">Talent Management</h2>
          <p className="opacity-40 text-lg font-medium italic">Gestión integral de staff clínico y perfiles de alta precisión.</p>
        </div>
        <div className="flex gap-3">
          {/* Tab Toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-[20px] overflow-hidden">
            <button
              onClick={() => setActiveTab('directorio')}
              className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'directorio' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Users className="w-4 h-4" /> Directorio
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest border-l border-slate-300 dark:border-slate-600 flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus className="w-5 h-5" /> Nuevo
          </button>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeForm
          isDark={isDark}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => { await addEmployee(data); setIsModalOpen(false); }}
        />
      )}

      {/* Compact Stats */}
      <StatPanel employees={employees} isDark={isDark} />

      {/* DIRECTORIO TAB - Full Width */}
      {activeTab === 'directorio' && (
        <EmployeeDirectory
          employees={employees}
          isDark={isDark}
          onAnalyze={runAiAnalysis}
          onDelete={handleDelete}
        />
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* IA Talent Insight */}
          <div className={`p-10 rounded-[40px] border relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" /> IA Talent Insight
            </h3>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                <Activity className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Gemini Analizando...</p>
                {selectedEmployee && (
                  <p className="text-sm font-bold mt-4">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                )}
              </div>
            ) : aiAnalysis ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {selectedEmployee && (
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg uppercase overflow-hidden">
                      {selectedEmployee.photo ? <img src={selectedEmployee.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</span>}
                    </div>
                    <div>
                      <p className="text-lg font-black uppercase tracking-tight">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">{selectedEmployee.role} • {selectedEmployee.department}</p>
                    </div>
                  </div>
                )}
                <div className="bg-blue-600 text-white p-6 rounded-3xl mb-6 shadow-xl shadow-blue-500/20 relative">
                  <div className="absolute -top-3 -left-3 p-3 bg-white dark:bg-slate-900 rounded-2xl text-blue-600 shadow-lg">
                    <Star className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 ml-6">Evaluación Prospectiva</h4>
                  <p className="text-sm font-bold italic leading-relaxed">{aiAnalysis}</p>
                </div>
                <button
                  onClick={() => { setAiAnalysis(null); setSelectedEmployee(null); }}
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
                <p className="text-[10px] font-black uppercase tracking-widest px-10">Seleccione un profesional desde el Directorio para análisis IA predictivo.</p>
                <button
                  onClick={() => setActiveTab('directorio')}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Ir al Directorio
                </button>
              </div>
            )}
          </div>

          {/* Compliance Clínico */}
          <div className={`p-10 rounded-[40px] border relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" /> Compliance Clínico
            </h4>
            <div className="space-y-6">
              <ComplianceItem label="ACLS" val="12" color="red" isDark={isDark} />
              <ComplianceItem label="Derechos Paciente" val="100%" color="emerald" isDark={isDark} />
              <ComplianceItem label="Protección Radiológica" val="45%" color="blue" isDark={isDark} />
              <ComplianceItem label="Certificación ISO" val="78%" color="purple" isDark={isDark} />
              <ComplianceItem label="Capacitación Continua" val="92%" color="amber" isDark={isDark} />
            </div>

            <div className={`mt-8 p-6 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Resumen</p>
              <p className="text-sm font-bold">
                <span className="text-emerald-500">{employees.filter(e => e.status === 'Activo').length}</span> colaboradores activos de <span className="text-blue-600">{employees.length}</span> totales
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ComplianceItem = ({ label, val, color, isDark }: any) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center">
      <p className="text-sm font-black uppercase opacity-60">{label}</p>
      <span className="text-sm font-black">{val}</span>
    </div>
    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
      <div className={`h-full bg-${color}-500 transition-all duration-1000 rounded-full`} style={{ width: val.includes('%') ? val : '30%' }} />
    </div>
  </div>
);

export default HRModule;
