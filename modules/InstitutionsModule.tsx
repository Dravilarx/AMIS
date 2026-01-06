
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, Plus, Search, MapPin, Calendar, 
  Clock, CheckCircle2, MoreVertical, Trash2, 
  Edit2, FileText, Globe, Layers, Activity,
  AlertCircle, ChevronRight, Briefcase, TrendingUp, X,
  Zap, UploadCloud, ShieldAlert, HeartPulse, History,
  Hash, Download, ExternalLink, ShieldCheck, Tag, Pen
} from 'lucide-react';
import { useInstitutions } from '../hooks/useInstitutions';
import { analyzeContractDocument } from '../services/geminiService';
import { Institution, Contract, ContractSLA, SLAValue, DocumentRecord, InstitutionCategory, UserSession } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

// Helper to generate unique and descriptive abbreviations
export const getSmartAbbreviation = (name: string, category: InstitutionCategory): string => {
  const prefixes: Record<InstitutionCategory, string> = {
    'Hospital': 'H',
    'Clínica': 'CL',
    'Centro Médico': 'CM',
    'Laboratorio': 'LB',
    'Ilustre Municipalidad': 'IM',
    'Servicio de Salud': 'SS',
    'Otro': 'IN'
  };

  const stopWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'para', 'con'];
  const keywordsToFilter = [
    'hospital', 'clinica', 'centro', 'medico', 'laboratorio', 
    'ilustre', 'municipalidad', 'servicio', 'salud'
  ];

  // Limpiar y obtener palabras significativas
  const words = name.split(/[\s-]+/)
    .filter(w => {
      const normalized = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !stopWords.includes(normalized) && 
             w.length > 1 && 
             !keywordsToFilter.includes(normalized);
    });

  let suffix = "";

  if (words.length >= 2) {
    // Si hay 2 o más palabras significativas, tomamos las primeras 2 letras de cada una
    suffix = words.slice(0, 3)
      .map(w => w.substring(0, 2).toUpperCase())
      .join('');
  } else if (words.length === 1) {
    // Si solo hay una palabra significativa, tomamos las primeras 4 letras
    suffix = words[0].substring(0, 4).toUpperCase();
  } else {
    // Fallback: usar el nombre original si no quedan palabras tras filtrar
    suffix = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
  }

  // Asegurar que el sufijo tenga al menos 4 caracteres para cumplir "más de 3 letras"
  if (suffix.length < 4 && words.length > 0) {
     suffix = words[0].substring(0, 4).toUpperCase();
  }

  return `${prefixes[category] || 'IN'}-${suffix}`;
};

const InstitutionsModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { 
    institutions, contracts, addInstitution, addContract, 
    deleteInstitution, deleteContract, updateInstitution, updateContract 
  } = useInstitutions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
  const [showInstModal, setShowInstModal] = useState(false);
  const [showContModal, setShowContModal] = useState(false);
  const [viewMode, setViewMode] = useState<'details' | 'vault'>('details');

  const filteredInstitutions = useMemo(() => {
    return institutions.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [institutions, searchTerm]);

  const selectedInstitution = useMemo(() => 
    institutions.find(i => i.id === selectedInstId), 
  [institutions, selectedInstId]);

  const instContracts = useMemo(() => 
    contracts.filter(c => c.institutionId === selectedInstId), 
  [contracts, selectedInstId]);

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90; // Alert within 3 months
  };

  const expiringCount = contracts.filter(c => isExpiringSoon(c.endDate)).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Bóveda Institucional</h2>
          <p className="opacity-40 text-lg font-medium italic">Gestión de clientes, licitaciones y contratos de teleradiología.</p>
        </div>
        <button 
          onClick={() => setShowInstModal(true)}
          className="px-8 py-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl"
        >
          <Building2 className="w-5 h-5" /> Nueva Institución
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Instituciones Activas" val={institutions.filter(i => i.active).length} icon={<Building2 className="text-blue-500" />} isDark={isDark} />
        <StatCard 
          label="Alertas Renovación" 
          val={expiringCount} 
          icon={<ShieldAlert className={expiringCount > 0 ? "text-red-500 animate-pulse" : "text-slate-400"} />} 
          isDark={isDark} 
          sub="Contratos a vencer en &lt; 90 días"
        />
        <StatCard label="Contratos Vigentes" val={contracts.filter(c => c.status === 'Activo').length} icon={<Briefcase className="text-emerald-500" />} isDark={isDark} />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Institution List */}
        <div className={`lg:col-span-4 p-8 rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter">Clientes</h3>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <Layers className="w-4 h-4 opacity-40" />
            </div>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ciudad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
            />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredInstitutions.map(inst => {
              const count = contracts.filter(c => c.institutionId === inst.id).length;
              const hasAlert = contracts.some(c => c.institutionId === inst.id && isExpiringSoon(c.endDate));
              
              return (
                <div 
                  key={inst.id}
                  onClick={() => { setSelectedInstId(inst.id); setViewMode('details'); }}
                  className={`p-6 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between group
                    ${selectedInstId === inst.id ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-12 rounded-2xl flex items-center justify-center font-black text-white text-[10px] shadow-lg relative tracking-tighter ${inst.active ? 'bg-slate-900' : 'bg-slate-400 opacity-50'}`}>
                      {inst.abbreviation}
                      {hasAlert && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">{inst.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black uppercase text-blue-500 px-1.5 py-0.5 bg-blue-500/10 rounded-md">{inst.category}</span>
                        <p className="text-[9px] opacity-40 font-bold uppercase flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {inst.city}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black text-blue-600 leading-none">{count}</p>
                     <p className="text-[8px] font-black uppercase opacity-30">Docs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contract & Vault Panel */}
        <div className="lg:col-span-8">
           {selectedInstitution ? (
             <div className="space-y-8 animate-in zoom-in-95 duration-500 h-full flex flex-col">
                <div className={`flex-grow p-10 rounded-[48px] border flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-6">
                         <div className="p-5 bg-blue-600 text-white rounded-[24px] shadow-lg shadow-blue-500/20 text-center min-w-[100px]">
                            <p className="text-[12px] font-black tracking-tighter leading-none mb-1">{selectedInstitution.abbreviation}</p>
                            <Building2 className="w-6 h-6 mx-auto" />
                         </div>
                         <div>
                            <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">{selectedInstitution.name}</h3>
                            <div className="flex gap-4">
                               <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">{selectedInstitution.address}, {selectedInstitution.city}</p>
                               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{instContracts.length} Convenios Registrados</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                           <button onClick={() => setViewMode('details')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'details' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Estructura</button>
                           <button onClick={() => setViewMode('vault')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'vault' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Documentos</button>
                        </div>
                        <button 
                          onClick={() => setShowContModal(true)}
                          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Nuevo Convenio
                        </button>
                      </div>
                   </div>

                   {viewMode === 'details' ? (
                     <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {instContracts.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center opacity-20 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px]">
                             <FileText className="w-16 h-16 mb-4" />
                             <p className="text-xs font-black uppercase tracking-widest">Sin contratos vinculados</p>
                          </div>
                        ) : (
                          instContracts.map(cont => {
                            const expiring = isExpiringSoon(cont.endDate);
                            return (
                              <div key={cont.id} className={`p-8 rounded-[40px] border transition-all hover:border-blue-500 group relative ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                 {expiring && (
                                   <div className="absolute -top-3 left-10 px-4 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase rounded-full animate-pulse shadow-lg flex items-center gap-2">
                                      <ShieldAlert className="w-3 h-3" /> Alerta de Renovación (&lt; 90 días)
                                   </div>
                                 )}
                                 
                                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex gap-4 items-center">
                                       <div className={`p-4 rounded-2xl ${cont.type === 'Licitación' ? 'bg-indigo-600/10 text-indigo-600' : 'bg-blue-600/10 text-blue-600'}`}>
                                          <Hash className="w-6 h-6" />
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-3 mb-1">
                                             <h5 className="text-2xl font-black uppercase tracking-tight">{cont.title}</h5>
                                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${cont.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{cont.status}</span>
                                          </div>
                                          <p className="text-[10px] opacity-40 font-black uppercase tracking-widest flex items-center gap-3 flex-wrap">
                                             <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {cont.startDate} AL {cont.endDate}</span>
                                             <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">ID: {cont.bidNumber}</span>
                                          </p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={() => deleteContract(cont.id)} className="p-3 bg-white dark:bg-slate-900 text-red-500 rounded-xl hover:bg-red-500 hover:text-white shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <SLACard label="Urgencias" value={cont.sla.emergencies} icon={<AlertCircle className="text-red-500" />} />
                                    <SLACard label="Hospitalizados" value={cont.sla.inpatients} icon={<Clock className="text-amber-500" />} />
                                    <SLACard label="Ambulatorios" value={cont.sla.outpatient} icon={<CheckCircle2 className="text-emerald-500" />} />
                                    <SLACard label="Oncológicos" value={cont.sla.oncology} icon={<HeartPulse className="text-blue-500" />} />
                                 </div>

                                 {cont.fines && (
                                   <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50/50 border-red-100'}`}>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> Régimen de Penalizaciones & Multas</p>
                                      <p className="text-xs font-medium leading-relaxed opacity-70 italic">{cont.fines}</p>
                                   </div>
                                 )}
                              </div>
                            );
                          })
                        )}
                     </div>
                   ) : (
                     <div className="flex-grow flex flex-col space-y-6">
                        <div className="flex items-center justify-between px-2">
                           <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><FileText className="w-4 h-4" /> Repositorio de Documentos Contractuales</h4>
                           <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <UploadCloud className="w-4 h-4" /> Subir Respaldo
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {instContracts.flatMap(c => c.documents).length === 0 ? (
                             <div className="col-span-full py-32 text-center opacity-20 flex flex-col items-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px]">
                                <UploadCloud className="w-16 h-16 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Sube contratos firmados y licitaciones publicadas</p>
                             </div>
                           ) : (
                             instContracts.flatMap(c => c.documents).map((doc, idx) => (
                               <div key={idx} className={`p-6 rounded-[32px] border flex items-center justify-between transition-all hover:border-blue-500 ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className="flex items-center gap-4">
                                     <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="text-xs font-black uppercase tracking-tight">{doc.name}</p>
                                        <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Legal • Subido: {doc.uploadDate}</p>
                                     </div>
                                  </div>
                                  <div className="flex gap-2">
                                     <button className="p-2.5 bg-white dark:bg-slate-900 rounded-lg hover:text-blue-500 transition-all"><Download className="w-4 h-4" /></button>
                                     <button className="p-2.5 bg-white dark:bg-slate-900 rounded-lg hover:text-blue-500 transition-all"><ExternalLink className="w-4 h-4" /></button>
                                  </div>
                               </div>
                             ))
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center p-24 text-center opacity-20">
                <Globe className="w-24 h-24 mb-8" />
                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Central de Convenios AMIS</h3>
                <p className="text-sm font-black uppercase tracking-widest opacity-60 max-w-sm mx-auto">Seleccione un cliente para gestionar acuerdos, SLAs oncológicos y visualizar alertas de renovación.</p>
             </div>
           )}
        </div>
      </div>

      {/* Institution Modal */}
      {showInstModal && (
        <Modal isDark={isDark} onClose={() => setShowInstModal(false)} title="Nueva Institución">
          <InstitutionForm isDark={isDark} onSubmit={async (data: any) => { await addInstitution(data); setShowInstModal(false); }} />
        </Modal>
      )}

      {/* Contract Modal */}
      {showContModal && selectedInstitution && (
        <Modal isDark={isDark} onClose={() => setShowContModal(false)} title="Nueva Estructura Contractual">
          <ContractForm 
            isDark={isDark} 
            instId={selectedInstitution.id} 
            onSubmit={async (data: any) => { await addContract(data); setShowContModal(false); }} 
          />
        </Modal>
      )}
    </div>
  );
};

// Sub-components

const StatCard = ({ label, val, icon, isDark, sub }: any) => (
  <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">{icon}</div>
      <MoreVertical className="w-5 h-5 opacity-20" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-5xl font-black tracking-tighter">{val}</h3>
    {sub && <p className="text-[9px] font-bold opacity-30 mt-3 uppercase italic leading-tight">{sub}</p>}
  </div>
);

const SLACard = ({ label, value, icon }: { label: string, value: SLAValue, icon: React.ReactNode }) => (
  <div className="p-5 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-black">{value.value}</span>
      <span className="text-[8px] font-black uppercase opacity-30">{value.unit}</span>
    </div>
  </div>
);

const Modal = ({ children, isDark, onClose, title }: any) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
    <div className={`relative w-full max-w-4xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'}`}>
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-3xl font-black uppercase tracking-tighter">{title}</h3>
        <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100 transition-all"><X className="w-6 h-6" /></button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
         {children}
      </div>
    </div>
  </div>
);

const InstitutionForm = ({ onSubmit, isDark }: any) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [isManualAbbr, setIsManualAbbr] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<InstitutionCategory>('Hospital');

  // Actualización automática solo si no se ha editado manualmente
  useEffect(() => {
    if (!isManualAbbr && name) {
      setAbbreviation(getSmartAbbreviation(name, category));
    } else if (!name && !isManualAbbr) {
      setAbbreviation('');
    }
  }, [name, category, isManualAbbr]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Real-time Preview / Manual Sigla Input */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-10 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
           <div className="relative group w-full flex flex-col items-center">
             <input 
              value={abbreviation} 
              onChange={e => { setAbbreviation(e.target.value.toUpperCase()); setIsManualAbbr(true); }}
              placeholder="--"
              className="w-full h-20 bg-blue-600 text-white rounded-[24px] shadow-2xl shadow-blue-500/30 flex items-center justify-center font-black text-xl tracking-tighter mb-4 text-center leading-none px-4 outline-none border-2 border-transparent focus:border-white transition-all"
             />
             <div className="absolute -top-2 -right-2 p-2 bg-white text-blue-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Pen className="w-3 h-3" />
             </div>
           </div>
           
           <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Sigla Generada por el Sistema</p>
           {isManualAbbr && (
             <button 
              onClick={() => { setIsManualAbbr(false); setAbbreviation(getSmartAbbreviation(name, category)); }}
              className="mt-2 text-[8px] font-black uppercase text-blue-500 underline hover:opacity-70"
             >
               Restablecer Automático
             </button>
           )}
           <p className="text-[9px] opacity-20 mt-4 max-w-[150px] text-center font-bold italic leading-tight uppercase">Se construye combinando el tipo de sede con fragmentos de los términos descriptivos para asegurar unicidad.</p>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Nombre Legal de Institución</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Hospital Regional Antofagasta" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-600'}`} />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Tipo de Institución</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value as any)} 
                className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-600'}`}
              >
                 <option value="Hospital">Hospital</option>
                 <option value="Clínica">Clínica</option>
                 <option value="Centro Médico">Centro Médico</option>
                 <option value="Laboratorio">Laboratorio</option>
                 <option value="Ilustre Municipalidad">Ilustre Municipalidad</option>
                 <option value="Servicio de Salud">Servicio de Salud</option>
                 <option value="Otro">Otro / Sede Externa</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Ciudad</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ej. Antofagasta" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-600'}`} />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Dirección Sede Principal</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Principal 123" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-600'}`} />
            </div>
          </div>
        </div>
      </div>

      <button 
        disabled={!name || !city || !abbreviation}
        onClick={() => onSubmit({ name, abbreviation, address, city, category, active: true })}
        className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
      >
        <Building2 className="w-5 h-5" /> Vincular Sede a Bóveda
      </button>
    </div>
  );
};

const ContractForm = ({ onSubmit, isDark, instId }: any) => {
  const [title, setTitle] = useState('');
  const [bidNumber, setBidNumber] = useState('');
  const [type, setType] = useState<'Contrato' | 'Licitación'>('Contrato');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fines, setFines] = useState('');
  const [sla, setSla] = useState<ContractSLA>({
    emergencies: { value: 2, unit: 'horas' },
    inpatients: { value: 12, unit: 'horas' },
    outpatient: { value: 24, unit: 'horas' },
    oncology: { value: 24, unit: 'horas' }
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  const handleAiAnalysis = async () => {
    if (!rawText) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeContractDocument(rawText);
      if (result) {
        setTitle(result.institutionName || '');
        setBidNumber(result.bidNumber || '');
        setStartDate(result.startDate || '');
        setEndDate(result.endDate || '');
        setFines(result.fines || '');
        if (result.sla) setSla(result.sla);
        setShowAiInput(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error analizando documento. Verifique el formato.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* AI Extraction Zone */}
      <div className={`p-8 rounded-[40px] border transition-all ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <Zap className="w-6 h-6 text-blue-600" />
               <h4 className="text-sm font-black uppercase tracking-tight">Carga Inteligente de Convenio</h4>
            </div>
            <button onClick={() => setShowAiInput(!showAiInput)} className="text-[10px] font-black uppercase text-blue-600 underline">
               {showAiInput ? 'Cerrar Panel IA' : 'Analizar Documento (PDF/Texto)'}
            </button>
         </div>
         
         {showAiInput && (
           <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-black uppercase opacity-40 leading-relaxed italic">Pegue el texto de la licitación o contrato. Nuestra IA extraerá automáticamente fechas, números de bid, SLAs y multas asociadas.</p>
              <textarea 
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Pegue aquí el contenido del documento legal..."
                className={`w-full p-6 rounded-2xl border outline-none font-medium h-40 resize-none leading-relaxed text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              />
              <button 
                disabled={isAnalyzing || !rawText}
                onClick={handleAiAnalysis}
                className="w-full py-4 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-40"
              >
                {isAnalyzing ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isAnalyzing ? 'Razonando Contrato...' : 'Sincronizar Datos con Gemini'}
              </button>
           </div>
         )}
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Título del Contrato</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Convenio Marco Urgencias 2025" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>
           <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">N° Licitación / ID Bid</label>
              <input value={bidNumber} onChange={e => setBidNumber(e.target.value)} placeholder="Ej. LIC-4456-X" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
           </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Modalidad</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
               <option value="Contrato">Contrato Privado</option>
               <option value="Licitación">Licitación Pública</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Fecha Inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Fecha Término</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>
        </div>

        <div>
           <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">Multas y Penalizaciones Asociadas</label>
           <textarea 
            value={fines} 
            onChange={e => setFines(e.target.value)} 
            placeholder="Describa el régimen de multas detallado en el convenio..." 
            className={`w-full p-6 rounded-2xl border outline-none font-bold h-32 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} 
           />
        </div>

        <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
           <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-8 flex items-center gap-2"><Clock className="w-4 h-4" /> Configuración SLA Institucional</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SLAInput 
                label="Urgencias" isDark={isDark} value={sla.emergencies} 
                onChange={(v: any) => setSla({...sla, emergencies: v})} 
              />
              <SLAInput 
                label="Hospitalizados" isDark={isDark} value={sla.inpatients} 
                onChange={(v: any) => setSla({...sla, inpatients: v})} 
              />
              <SLAInput 
                label="Ambulatorios" isDark={isDark} value={sla.outpatient} 
                onChange={(v: any) => setSla({...sla, outpatient: v})} 
              />
              <SLAInput 
                label="Oncológicos" isDark={isDark} value={sla.oncology} 
                onChange={(v: any) => setSla({...sla, oncology: v})} 
              />
           </div>
        </div>
      </div>
      
      <button 
        disabled={!title || !startDate || !endDate}
        onClick={() => onSubmit({ institutionId: instId, title, bidNumber, type, startDate, endDate, sla, fines, status: 'Activo' })}
        className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-30"
      >
        Vincular Estructura Contractual
      </button>
    </div>
  );
};

const SLAInput = ({ label, value, onChange, isDark }: any) => (
  <div className="flex items-center justify-between p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
     <div className="flex items-center gap-3">
        <input 
          type="number" 
          value={value.value} 
          onChange={e => onChange({...value, value: Number(e.target.value)})}
          className={`w-20 p-3 rounded-xl border outline-none font-black text-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
        />
        <select 
          value={value.unit} 
          onChange={e => onChange({...value, unit: e.target.value})}
          className={`p-3 rounded-xl border outline-none font-black text-[10px] uppercase ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
        >
           <option value="horas">Horas</option>
           <option value="días">Días</option>
        </select>
     </div>
  </div>
);

export default InstitutionsModule;
