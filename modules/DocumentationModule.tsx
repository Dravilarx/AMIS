
import React, { useState, useMemo, useRef } from 'react';
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Users, 
  ArrowRight, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  Check,
  Filter,
  Layers,
  Calendar,
  ShieldCheck,
  History,
  Tag,
  BookOpen,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Hash
} from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { useCompliance } from '../hooks/useCompliance';
import { Employee, DocumentRecord, DocumentProfile, UserSession } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const DocumentationModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { 
    complianceData, 
    profiles, 
    updateDocument, 
    applyBatchDocs, 
    saveProfile, 
    deleteProfile 
  } = useCompliance(employees);
  
  // State
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'complete'>('all');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Constants
  const ALERT_DAYS = 7;

  // Helpers
  const isDelayed = (date: string) => {
    const diff = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
    return diff > ALERT_DAYS;
  };

  // Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            emp.idNumber.includes(searchTerm);
      const compliance = complianceData.find(c => c.employeeId === emp.id);
      if (!compliance) return matchesSearch;

      if (filterType === 'pending') return matchesSearch && compliance.completionPercentage < 100;
      if (filterType === 'complete') return matchesSearch && compliance.completionPercentage === 100;
      return matchesSearch;
    });
  }, [employees, complianceData, searchTerm, filterType]);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);
  const selectedRecord = complianceData.find(c => c.employeeId === selectedEmpId);

  // MASTER LIST GENERATOR: Extract all unique doc names from everywhere
  const masterRequirements = useMemo(() => {
    const fromCompliance = complianceData.flatMap(c => c.documents.map(d => d.name));
    const fromProfiles = profiles.flatMap(p => p.requiredDocs);
    return Array.from(new Set([...fromCompliance, ...fromProfiles])).sort();
  }, [complianceData, profiles]);

  const handleFileUpload = (docId: string) => {
    setActiveDocId(docId);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedEmpId && activeDocId) {
      updateDocument(selectedEmpId, {
        id: activeDocId,
        status: 'Uploaded',
        uploadDate: new Date().toISOString()
      });
      setActiveDocId(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />

      {/* Header & Global Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Bóveda Documental</h2>
          <p className="opacity-40 text-lg font-medium italic">Gestión de requisitos institucionales y expedientes de staff.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowProfilesModal(true)}
            className={`px-8 py-5 border rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}
          >
            <BookOpen className="w-4 h-4" /> Librería de Perfiles
          </button>
          <button 
            onClick={() => setShowBatchModal(true)}
            className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
          >
            <Layers className="w-4 h-4" /> Requisitos por Perfil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocStatCard 
          label="Cumplimiento Red" 
          val={`${Math.round(complianceData.reduce((a,b) => a + b.completionPercentage, 0) / (complianceData.length || 1))}%`} 
          icon={<ShieldCheck className="text-blue-500" />} 
          isDark={isDark} 
        />
        <StatusCardSm label="Alertas Tiempo" val={complianceData.reduce((acc, curr) => acc + curr.documents.filter(d => d.status === 'Pending' && isDelayed(d.createdDate)).length, 0)} icon={<AlertTriangle className="text-red-500" />} />
        <StatusCardSm label="Por Verificar" val={complianceData.reduce((acc, curr) => acc + curr.documents.filter(d => d.status === 'Uploaded').length, 0)} icon={<Clock className="text-amber-500" />} />
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        
        {/* Employee Navigator */}
        <div className={`lg:col-span-5 p-8 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">Directorio de Staff</h3>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {['all', 'pending', 'complete'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}
                  >
                    {t === 'all' ? 'Todos' : t === 'pending' ? 'Alertas' : 'OK'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o RUT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`}
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredEmployees.map(emp => {
                const record = complianceData.find(c => c.employeeId === emp.id);
                const hasAlert = record?.documents.some(d => d.status === 'Pending' && isDelayed(d.createdDate));
                
                return (
                  <div 
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`p-5 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between group
                      ${selectedEmpId === emp.id ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs relative overflow-hidden">
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span>{emp.firstName[0]}{emp.lastName[0]}</span>}
                        {hasAlert && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[9px] opacity-40 font-bold uppercase">{emp.role} • {emp.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-2 mb-1">
                          <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className={`h-full ${record?.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${record?.completionPercentage}%` }} />
                          </div>
                          <span className="text-[10px] font-black">{record?.completionPercentage}%</span>
                       </div>
                       <ArrowRight className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all ${selectedEmpId === emp.id ? 'opacity-100 text-blue-500 translate-x-1' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Requirements Detail Area */}
        <div className="lg:col-span-7">
          {selectedEmployee && selectedRecord ? (
            <div className={`p-10 rounded-[48px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
              
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl">
                      <FolderOpen className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Bóveda de Expediente</h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">{selectedEmployee.firstName} {selectedEmployee.lastName} • RUT {selectedEmployee.idNumber}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowAddDocModal(true)}
                  className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="Nuevo Requisito Individual"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Requisitos Solicitados</p>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{selectedRecord.documents.length} Items</p>
                </div>

                {selectedRecord.documents.length === 0 ? (
                  <div className="py-20 text-center opacity-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest">No hay documentos asignados a este profesional</p>
                  </div>
                ) : (
                  selectedRecord.documents.map(doc => {
                    const delayed = doc.status === 'Pending' && isDelayed(doc.createdDate);
                    return (
                      <div key={doc.id} className={`p-6 rounded-[32px] border transition-all flex items-center justify-between group
                        ${delayed ? 'border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-900/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                        
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getStatusStyle(doc.status)}`}>
                            {doc.status === 'Verified' ? <CheckCircle2 className="w-5 h-5" /> : doc.status === 'Uploaded' ? <UploadCloud className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-black uppercase tracking-tight">{doc.name}</p>
                              {delayed && <span className="px-2 py-0.5 bg-red-500 text-white text-[7px] font-black uppercase rounded-full animate-pulse">Retraso Crítico</span>}
                            </div>
                            <p className="text-[9px] font-bold opacity-40 uppercase mt-1">
                              {doc.status === 'Pending' ? `Requerido el ${new Date(doc.createdDate).toLocaleDateString()}` : `Cargado el ${new Date(doc.uploadDate!).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.status === 'Uploaded' && (
                            <button 
                              onClick={() => updateDocument(selectedEmployee.id, { id: doc.id, status: 'Verified' })}
                              className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all"
                              title="Aprobar Documento"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {(doc.status === 'Pending' || doc.status === 'Uploaded') && (
                            <button 
                              onClick={() => handleFileUpload(doc.id)}
                              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-110 transition-all"
                              title="Cargar Archivo"
                            >
                              <UploadCloud className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl opacity-40">
                             <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center p-24 text-center opacity-20">
              <History className="w-24 h-24 mb-8" />
              <p className="text-xl font-black uppercase tracking-widest leading-relaxed px-10">Seleccione un profesional del staff para gestionar sus documentos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBatchModal && (
        <BatchModal 
          isDark={isDark} 
          profiles={profiles}
          onClose={() => setShowBatchModal(false)} 
          onApply={(role, dept, docList) => {
            applyBatchDocs(role, dept, docList);
            setShowBatchModal(false);
          }} 
        />
      )}

      {showProfilesModal && (
        <ProfileLibraryModal 
          isDark={isDark}
          profiles={profiles}
          masterRequirements={masterRequirements}
          onClose={() => setShowProfilesModal(false)}
          onSave={saveProfile}
          onDelete={deleteProfile}
        />
      )}

      {showAddDocModal && selectedEmployee && (
        <AddDocModal 
          isDark={isDark} 
          onClose={() => setShowAddDocModal(false)} 
          onAdd={(name) => {
            updateDocument(selectedEmployee.id, { 
              name, 
              status: 'Pending', 
              mandatory: true,
              category: 'Administrative'
            });
            setShowAddDocModal(false);
          }} 
        />
      )}
    </div>
  );
};

const StatusCardSm = ({ label, val, icon }: any) => (
  <div className="p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <h3 className="text-3xl font-black">{val}</h3>
    </div>
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>
  </div>
);

const DocStatCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">{icon}</div>
      <MoreVertical className="w-5 h-5 opacity-20" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-5xl font-black tracking-tighter">{val}</h3>
  </div>
);

const BatchModal = ({ isDark, profiles, onClose, onApply }: any) => {
  const [role, setRole] = useState('Médico');
  const [dept, setDept] = useState('');
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  const toggleProfile = (id: string) => {
    setSelectedProfileIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const docNames = new Set<string>();
    selectedProfileIds.forEach(id => {
      const p = profiles.find((prof: any) => prof.id === id);
      p?.requiredDocs.forEach((d: string) => docNames.add(d));
    });
    onApply(role, dept, Array.from(docNames));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-2xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Gestión por Perfiles</h3>
        
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Rol Staff Objetivo</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <option value="Médico">Médico</option>
                <option value="Técnico">Técnico</option>
                <option value="Enfermería">Enfermería</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Dpto. (Opcional)</label>
              <input value={dept} onChange={e => setDept(e.target.value)} placeholder="Ej. Radiología" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Seleccione Repositorios de Requisitos</label>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {profiles.map((p: any) => (
                <div 
                  key={p.id}
                  onClick={() => toggleProfile(p.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between
                    ${selectedProfileIds.includes(p.id) ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-4">
                     <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedProfileIds.includes(p.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                        {selectedProfileIds.includes(p.id) && <Check className="w-4 h-4 text-white" />}
                     </div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-tight">{p.name}</p>
                        <p className="text-[9px] opacity-40 font-bold uppercase">{p.requiredDocs.length} Documentos Requeridos</p>
                     </div>
                  </div>
                  <Tag className={`w-4 h-4 opacity-20 ${selectedProfileIds.includes(p.id) ? 'text-blue-500 opacity-100' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity">Cancelar</button>
          <button 
            disabled={selectedProfileIds.length === 0}
            onClick={handleApply}
            className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 disabled:opacity-30 transition-all active:scale-95"
          >
            Inyectar Perfiles Seleccionados
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileLibraryModal = ({ isDark, profiles, masterRequirements, onClose, onSave, onDelete }: any) => {
  const [editingProfile, setEditingProfile] = useState<DocumentProfile | null>(null);
  const [reqSearch, setReqSearch] = useState('');
  const [newReqInput, setNewReqInput] = useState('');

  const handleCreateNew = () => {
    setEditingProfile({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      requiredDocs: []
    });
  };

  const toggleRequirement = (name: string) => {
    if (!editingProfile) return;
    const current = editingProfile.requiredDocs;
    const next = current.includes(name) 
      ? current.filter(n => n !== name) 
      : [...current, name];
    setEditingProfile({ ...editingProfile, requiredDocs: next });
  };

  const addNewRequirement = () => {
    const val = newReqInput.trim();
    if (val && editingProfile && !editingProfile.requiredDocs.includes(val)) {
      setEditingProfile({
        ...editingProfile,
        requiredDocs: [...editingProfile.requiredDocs, val]
      });
      setNewReqInput('');
    }
  };

  const filteredMaster = masterRequirements.filter((name: string) => 
    name.toLowerCase().includes(reqSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-6xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        
        {editingProfile ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter">Configurar Perfil de Requisitos</h3>
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1 italic">Seleccione los documentos del repositorio global.</p>
                </div>
                <button onClick={() => setEditingProfile(null)} className="p-3 opacity-40 hover:opacity-100 transition-all">
                  <X className="w-6 h-6" />
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Metadata */}
                <div className="lg:col-span-5 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Nombre del Perfil</label>
                      <input 
                        value={editingProfile.name} 
                        onChange={e => setEditingProfile({...editingProfile, name: e.target.value})}
                        placeholder="Ej. Onboarding Quirúrgico"
                        className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Descripción / Propósito</label>
                      <textarea 
                        value={editingProfile.description} 
                        onChange={e => setEditingProfile({...editingProfile, description: e.target.value})}
                        placeholder="Define cuándo se debe aplicar este conjunto de requisitos..."
                        className={`w-full p-5 rounded-2xl border outline-none font-bold h-40 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
                      />
                   </div>
                   
                   <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Requisitos Seleccionados</p>
                         <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black">{editingProfile.requiredDocs.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {editingProfile.requiredDocs.map((doc, i) => (
                           <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase shadow-sm group">
                              {doc} 
                              <X className="w-3 h-3 cursor-pointer text-red-500" onClick={() => toggleRequirement(doc)} />
                           </span>
                         ))}
                         {editingProfile.requiredDocs.length === 0 && <p className="text-[10px] font-bold opacity-30 italic">No hay documentos vinculados aún.</p>}
                      </div>
                   </div>
                </div>

                {/* Right: Repository Selection */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Repositorio Global de Requisitos</label>
                   </div>
                   
                   <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} flex-grow flex flex-col h-[500px]`}>
                      <div className="relative mb-6">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                         <input 
                           type="text" 
                           placeholder="Buscar en repositorio..."
                           value={reqSearch}
                           onChange={e => setReqSearch(e.target.value)}
                           className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                         />
                      </div>

                      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
                         {filteredMaster.map((name: string) => {
                           const isSelected = editingProfile.requiredDocs.includes(name);
                           return (
                             <div 
                               key={name}
                               onClick={() => toggleRequirement(name)}
                               className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group
                                 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-white/20 border-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                      {isSelected && <Check className="w-3.5 h-3.5" />}
                                   </div>
                                   <span className="text-[11px] font-black uppercase tracking-tight">{name}</span>
                                </div>
                                {!isSelected && <Hash className="w-4 h-4 opacity-10 group-hover:opacity-100 transition-opacity" />}
                             </div>
                           );
                         })}
                         {filteredMaster.length === 0 && reqSearch && (
                           <div className="py-10 text-center opacity-30 italic flex flex-col items-center">
                              <Search className="w-10 h-10 mb-4" />
                              <p className="text-[10px] font-black uppercase">No se encontró "{reqSearch}"</p>
                           </div>
                         )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                         <input 
                           type="text" 
                           placeholder="Nuevo requisito..."
                           value={newReqInput}
                           onChange={e => setNewReqInput(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && addNewRequirement()}
                           className={`flex-grow px-5 py-3 rounded-xl border outline-none text-[11px] font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                         />
                         <button 
                           onClick={addNewRequirement}
                           className="px-5 py-3 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                         >
                            Añadir
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setEditingProfile(null)} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity">Cancelar Edición</button>
                <button 
                   onClick={() => { onSave(editingProfile); setEditingProfile(null); }}
                   disabled={!editingProfile.name || editingProfile.requiredDocs.length === 0}
                   className="flex-1 py-5 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 disabled:opacity-30 transition-all active:scale-95"
                >
                  Guardar Cambios en Librería
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Librería de Perfiles Documentales</h3>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Configure conjuntos de requisitos estandarizados para su staff.</p>
              </div>
              <button 
                onClick={handleCreateNew}
                className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
              >
                <PlusCircle className="w-5 h-5" /> Crear Nuevo Perfil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {profiles.map((p: any) => (
                <div key={p.id} className={`p-8 rounded-[40px] border transition-all hover:border-blue-500 group ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => setEditingProfile(p)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-500 hover:scale-110 transition-all"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => onDelete(p.id)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-red-500 hover:scale-110 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2">{p.name}</h4>
                  <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-6 line-clamp-2 italic leading-relaxed">{p.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                     {p.requiredDocs.slice(0, 4).map((d: string, i: number) => (
                       <span key={i} className="px-3 py-1.5 bg-white/50 dark:bg-slate-900/50 rounded-xl text-[8px] font-black uppercase border border-slate-100 dark:border-slate-800">{d}</span>
                     ))}
                     {p.requiredDocs.length > 4 && (
                       <span className="px-3 py-1.5 bg-blue-600/10 text-blue-600 rounded-xl text-[8px] font-black uppercase">+{p.requiredDocs.length - 4} más</span>
                     )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
               <button onClick={onClose} className="px-10 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity">Cerrar Librería de Perfiles</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AddDocModal = ({ isDark, onClose, onAdd }: any) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-md p-10 rounded-[48px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Asignar Documento</h3>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Nombre del Requisito</label>
          <input 
            autoFocus
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ej. Carnet Vacunación Hepatitis B" 
            className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`} 
          />
        </div>
        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40">Cancelar</button>
          <button 
            disabled={!name.trim()}
            onClick={() => onAdd(name)}
            className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 disabled:opacity-30"
          >
            Vincular Requisito
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Verified': return 'bg-emerald-500/10 text-emerald-500';
    case 'Uploaded': return 'bg-blue-500/10 text-blue-500';
    default: return 'bg-slate-500/10 text-slate-500';
  }
};

export default DocumentationModule;
