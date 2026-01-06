
import React, { useState } from 'react';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  UploadCloud, 
  ShieldAlert, 
  Users, 
  ArrowRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { useCompliance } from '../hooks/useCompliance';
import { Employee, EmployeeCompliance, DocumentRecord, UserSession } from '../types';

// Added currentUser to props to ensure consistency with other modules
interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const ComplianceModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { complianceData, updateDocument, applyBatchDocs } = useCompliance(employees);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Alerts' | 'Complete'>('All');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Derived stats
  const totalEmployees = employees.length;
  const criticalAlerts = complianceData.filter(c => c.completionPercentage < 50).length;
  const pendingVerification = complianceData.reduce((acc, curr) => 
    acc + curr.documents.filter(d => d.status === 'Uploaded').length, 0);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);
  const selectedCompliance = complianceData.find(c => c.employeeId === selectedEmpId);

  const filteredCompliance = complianceData.filter(c => {
    if (filter === 'Alerts') return c.completionPercentage < 100;
    if (filter === 'Complete') return c.completionPercentage === 100;
    return true;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Compliance & Monitoring</h2>
          <p className="opacity-50 text-lg font-medium italic">Gestión documental y control de requisitos institucionales.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowBatchModal(true)}
            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Carga Masiva Requisitos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard 
          label="Alertas Críticas" 
          val={criticalAlerts} 
          icon={<ShieldAlert className="text-red-500" />} 
          isDark={isDark} 
          sub="Documentación < 50%" 
        />
        <StatusCard 
          label="Por Verificar" 
          val={pendingVerification} 
          icon={<Clock className="text-blue-500" />} 
          isDark={isDark} 
          sub="Archivos en bandeja de revisión" 
        />
        <StatusCard 
          label="Cumplimiento Global" 
          val={`${Math.round(complianceData.reduce((a,b) => a + b.completionPercentage, 0) / (complianceData.length || 1))}%`} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          isDark={isDark} 
          sub="Promedio de red AMIS" 
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left List */}
        <div className={`lg:col-span-7 p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter">Estado por Profesional</h3>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['All', 'Alerts', 'Complete'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}
                >
                  {f === 'All' ? 'Todos' : f === 'Alerts' ? 'Alertas' : 'OK'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCompliance.map(record => {
              const emp = employees.find(e => e.id === record.employeeId);
              if (!emp) return null;
              return (
                <div 
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group
                    ${selectedEmpId === emp.id ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-2xl" /> : <span>{emp.firstName[0]}{emp.lastName[0]}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[9px] opacity-40 font-bold uppercase">{emp.role} · {emp.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${record.completionPercentage === 100 ? 'bg-emerald-500' : record.completionPercentage < 50 ? 'bg-red-500' : 'bg-blue-600'}`} 
                            style={{ width: `${record.completionPercentage}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-black">{record.completionPercentage}%</span>
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Docs Mandatorios</p>
                    </div>
                    <ArrowRight className={`w-5 h-5 opacity-0 group-hover:opacity-40 transition-all ${selectedEmpId === emp.id ? 'opacity-100 text-blue-500 translate-x-1' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-5 space-y-6">
          {selectedEmployee && selectedCompliance ? (
            <div className={`p-8 rounded-[40px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">Expediente Digital</h3>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedCompliance.completionPercentage === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {selectedCompliance.completionPercentage === 100 ? 'Auditado' : 'En Proceso'}
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    <p className="text-[9px] opacity-40 font-bold uppercase">ID: {selectedEmployee.idNumber}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Documentación Requerida</p>
                  {selectedCompliance.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getStatusColor(doc.status)}`}>
                          {doc.status === 'Verified' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase">{doc.name}</p>
                          <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">{doc.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => updateDocument(selectedEmployee.id, { id: doc.id, status: 'Verified' })}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <UploadCloud className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 hover:border-blue-500 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Añadir Documento Manual
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] flex flex-col items-center justify-center opacity-20 p-20 text-center">
              <Users className="w-20 h-20 mb-6" />
              <p className="text-[10px] font-black uppercase tracking-widest">Seleccione un perfil para ver el expediente</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Requirement Modal */}
      {showBatchModal && (
        <BatchModal 
          isDark={isDark} 
          onClose={() => setShowBatchModal(false)} 
          onApply={applyBatchDocs} 
        />
      )}
    </div>
  );
};

const StatusCard = ({ label, val, icon, isDark, sub }: any) => (
  <div className={`p-8 rounded-[32px] border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-blue-600">{icon}</div>
      <MoreVertical className="w-5 h-5 opacity-20" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-4xl font-black tracking-tight">{val}</h3>
    <p className="text-[9px] mt-2 opacity-50 font-bold italic">{sub}</p>
  </div>
);

const BatchModal = ({ isDark, onClose, onApply }: any) => {
  const [role, setRole] = useState('Médico');
  const [dept, setDept] = useState('');
  const [docs, setDocs] = useState('');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-lg p-10 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Requisitos por Perfil</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Rol Destino</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={`w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <option value="Médico">Médico</option>
              <option value="Técnico">Técnico</option>
              <option value="Enfermería">Enfermería</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Departamento</label>
            <input value={dept} onChange={e => setDept(e.target.value)} placeholder="Ej. Radiología" className={`w-full p-4 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Documentos (Separados por coma)</label>
            <textarea value={docs} onChange={e => setDocs(e.target.value)} placeholder="Ej. Título, ACLS, Registro SIS" className={`w-full p-4 rounded-xl border outline-none h-32 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
          </div>
        </div>
        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-[10px] uppercase opacity-40">Cancelar</button>
          <button 
            onClick={() => { onApply(role, dept, docs.split(',').map(s => s.trim())); onClose(); }}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20"
          >
            Aplicar Lote
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Verified': return 'bg-emerald-500/10 text-emerald-500';
    case 'Uploaded': return 'bg-blue-500/10 text-blue-500';
    case 'Expired': return 'bg-red-500/10 text-red-500';
    default: return 'bg-slate-500/10 text-slate-500';
  }
};

export default ComplianceModule;
