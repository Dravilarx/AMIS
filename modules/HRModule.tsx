
import { Activity, Award, Star, UserPlus, Zap, Users, BarChart3, FolderCheck, Plus, X, Clock, UploadCloud, CheckCircle2, Layers, Hash } from 'lucide-react';
import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useDocumentProfiles } from '../hooks/useDocumentProfiles';
import { useDocumentRepository } from '../hooks/useDocumentRepository';
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
  const { profiles: allProfiles, assignProfile: assignRCDProfile } = useDocumentRepository();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'directorio' | 'analytics' | 'documentos'>('directorio');
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
            <button
              onClick={() => setActiveTab('documentos')}
              className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest border-l border-slate-300 dark:border-slate-600 flex items-center gap-2 ${activeTab === 'documentos' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <FolderCheck className="w-4 h-4" /> Documentos
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

      {/* DOCUMENTOS TAB - Employee Document Profiles */}
      {activeTab === 'documentos' && (
        <EmployeeDocumentsView
          employees={employees}
          isDark={isDark}
          allProfiles={allProfiles}
          currentUser={currentUser}
          onAssignProfile={assignRCDProfile}
        />
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

// Employee Documents View - RCD Integration
const EmployeeDocumentsView: React.FC<{
  employees: Employee[];
  isDark: boolean;
  allProfiles: any[];
  currentUser: UserSession;
  onAssignProfile: (profileId: string, entityType: string, entityId: string, assignedBy: string) => Promise<void>;
}> = ({ employees, isDark, allProfiles, currentUser, onAssignProfile }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

  // Use document profiles hook for selected employee
  const {
    assignedProfiles,
    hasAssignedProfiles,
    overallCompliance,
    isLoading
  } = useDocumentProfiles('employee', selectedEmpId || '');

  // Get profiles applicable to employees that haven't been assigned yet
  const unassignedProfiles = allProfiles.filter(
    p => p.applicableToEntities?.includes('employee') &&
      !assignedProfiles.some(ap => ap.profile.id === p.id)
  );

  const handleAssign = async (profileId: string) => {
    if (selectedEmpId) {
      await onAssignProfile(profileId, 'employee', selectedEmpId, currentUser.id);
      setShowAssignModal(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Employee List */}
      <div className={`p-6 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <h3 className="text-sm font-black uppercase tracking-tight mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> Seleccionar Empleado
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmpId(emp.id)}
              className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedEmpId === emp.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : isDark ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold uppercase overflow-hidden">
                  {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{emp.firstName[0]}{emp.lastName[0]}</span>}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                  <p className="text-[9px] opacity-40 font-bold">{emp.role} • {emp.department}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Employee Profile Details */}
      <div className={`lg:col-span-2 p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        {!selectedEmployee ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <FolderCheck className="w-16 h-16 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Seleccione un empleado</p>
            <p className="text-[10px] opacity-60 mt-2">para gestionar sus perfiles documentales</p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold uppercase overflow-hidden">
                  {selectedEmployee.photo ? <img src={selectedEmployee.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</span>}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">{selectedEmployee.role} • {selectedEmployee.department}</p>
                  {hasAssignedProfiles && (
                    <p className="text-[9px] font-bold opacity-40 mt-1">
                      Cumplimiento: <span className={`font-black ${overallCompliance >= 80 ? 'text-emerald-600' : overallCompliance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{overallCompliance}%</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={unassignedProfiles.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm disabled:opacity-30"
              >
                <Plus className="w-4 h-4" /> Asignar Perfil
              </button>
            </div>

            {/* Assigned Profiles */}
            {!hasAssignedProfiles ? (
              <div className="py-16 text-center opacity-30 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                <Layers className="w-12 h-12 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest mb-2">Sin Perfiles Asignados</p>
                <p className="text-[10px] opacity-60">Asigne perfiles documentales del RCD</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedProfiles.map(({ profile, assignment, completionPercentage, pendingCount, uploadedCount, verifiedCount }) => (
                  <div
                    key={assignment.id}
                    className={`p-5 rounded-[24px] border transition-all ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${completionPercentage === 100 ? 'bg-emerald-600/10 text-emerald-600' : 'bg-blue-600/10 text-blue-600'}`}>
                          {completionPercentage === 100 ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        </div>
                        <div>
                          <h5 className="text-xs font-black uppercase tracking-tight">{profile.name}</h5>
                          <p className="text-[8px] opacity-40 font-bold">{profile.documentIds?.length || 0} docs</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${completionPercentage === 100 ? 'bg-emerald-600/10 text-emerald-600' :
                          completionPercentage >= 50 ? 'bg-amber-600/10 text-amber-600' :
                            'bg-red-600/10 text-red-600'
                        }`}>
                        {completionPercentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full transition-all ${completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 text-[8px] font-bold uppercase">
                      <span className="flex items-center gap-1 text-slate-400"><Clock className="w-2.5 h-2.5" /> {pendingCount}</span>
                      <span className="flex items-center gap-1 text-blue-600"><UploadCloud className="w-2.5 h-2.5" /> {uploadedCount}</span>
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-2.5 h-2.5" /> {verifiedCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Profile Modal */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowAssignModal(false)} />
          <div className={`relative w-full max-w-xl p-8 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase tracking-tight">Asignar Perfil a {selectedEmployee.firstName}</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 opacity-40 hover:opacity-100"><X className="w-5 h-5" /></button>
            </div>

            {unassignedProfiles.length === 0 ? (
              <div className="py-12 text-center opacity-40">
                <p className="text-sm font-bold">Todos los perfiles ya están asignados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {unassignedProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => handleAssign(profile.id)}
                    className={`w-full p-5 rounded-[20px] border text-left transition-all hover:border-blue-500 hover:bg-blue-500/5 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl"><Hash className="w-4 h-4" /></div>
                      <div>
                        <h5 className="text-sm font-black uppercase tracking-tight">{profile.name}</h5>
                        <p className="text-[9px] opacity-40">{profile.documentIds?.length || 0} documentos requeridos</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRModule;

