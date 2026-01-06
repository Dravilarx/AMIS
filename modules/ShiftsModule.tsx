import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { 
  Clock, Bot, User, ShieldAlert, 
  Map as MapIcon, MessageSquare, 
  Search, Calendar, CheckCircle2, 
  Settings2, Save, Moon, Sun, 
  CalendarCheck, Building2, AlertTriangle, 
  X, UserMinus, Plus, UserCog, Building, Check,
  Filter, Trash2, ArrowUpDown, MapPin, Layers,
  Tag, ChevronRight, Hash
} from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { useInstitutions } from '../hooks/useInstitutions';
import { UserSession } from '../types';

// Estructura de las Reglas de Oro con soporte para Grupos
interface GoldenRules {
  businessStart: string;
  businessEnd: string;
  businessDays: number[];
  minShiftHours: number;
  maxShiftHours: number;
  minStaffPerGroup: number;
  restrictions: Record<string, string[]>; // doctorId -> array of institutionIds
  institutionGroups: Record<string, string[]>; // groupName -> array of institutionIds
}

const DEFAULT_RULES: GoldenRules = {
  businessStart: '08:00',
  businessEnd: '20:00',
  businessDays: [1, 2, 3, 4, 5],
  minShiftHours: 3,
  maxShiftHours: 6,
  minStaffPerGroup: 2,
  restrictions: {},
  institutionGroups: {}
};

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const ShiftsModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { institutions } = useInstitutions();
  const doctors = useMemo(() => employees.filter(e => e.role === 'Médico'), [employees]);

  const [viewMode, setViewMode] = useState<'chat' | 'timeline' | 'config'>('timeline');
  const [rules, setRules] = useState<GoldenRules>(() => {
    const saved = localStorage.getItem('amis_golden_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  // Estado para gestión de grupos
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Modal para gestionar restricciones de un médico específico
  const [managingRestrictionsId, setManagingRestrictionsId] = useState<string | null>(null);
  const [instSearchTerm, setInstSearchTerm] = useState('');

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Hola. Motor 24/7 listo. ¿A qué médico desea asignar hoy?' }
  ]);
  
  const [step, setStep] = useState<'none' | 'doctor' | 'institution' | 'date' | 'time' | 'group' | 'confirm'>('doctor');
  const [draft, setDraft] = useState({
    doctorId: '',
    doctorName: '',
    institutionId: '',
    institutionName: '',
    date: '',
    startTime: rules.businessStart,
    endTime: '12:00',
    group: '1'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const generateSystemPrompt = (currentRules: GoldenRules) => {
    const activeDays = currentRules.businessDays.map(d => dayNames[d]).join(', ');
    
    const restrictionList = Object.entries(currentRules.restrictions)
      .map(([docId, instIds]) => {
        const doc = doctors.find(d => d.id === docId);
        const insts = instIds.map(id => institutions.find(i => i.id === id)?.name).join(', ');
        return doc ? `- Dr. ${doc.lastName} TIENE PROHIBIDO trabajar en: [${insts}]` : '';
      })
      .filter(Boolean)
      .join('\n');

    return `
    Eres el "Motor de Gestión Rotativa 24/7" de AMIS.
    
    DEFINICIÓN DE HORARIOS:
    1. HORARIO HÁBIL: Días [${activeDays}] entre las ${currentRules.businessStart} y las ${currentRules.businessEnd}.
    2. DURACIÓN: Mínimo ${currentRules.minShiftHours}h y máximo ${currentRules.maxShiftHours}h.

    RESTRICCIONES CRÍTICAS (LISTA NEGRA):
    ${restrictionList || 'No hay restricciones activas.'}

    TU TAREA:
    Si el usuario selecciona una Institución que está prohibida para ese médico, DEBES RECHAZAR la operación explicando que existe una incompatibilidad registrada en las Reglas de Oro.
    `;
  };

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: generateSystemPrompt(rules) },
    });
  }, [rules, doctors, institutions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelection = async (type: string, value: any, label?: string) => {
    const userMsg = label || value.toString();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const newDraft = { ...draft };
    if (type === 'doctor') { newDraft.doctorId = value; newDraft.doctorName = label || ''; setStep('institution'); }
    else if (type === 'institution') { newDraft.institutionId = value; newDraft.institutionName = label || ''; setStep('date'); }
    else if (type === 'date') { newDraft.date = value; setStep('time'); }
    else if (type === 'time') { newDraft.startTime = value.start; newDraft.endTime = value.end; setStep('group'); }
    else if (type === 'group') { newDraft.group = value; setStep('confirm'); }
    setDraft(newDraft);

    try {
      const response: GenerateContentResponse = await chatRef.current!.sendMessage({ 
        message: `Usuario seleccionó ${type}: ${userMsg}. Valida contra restricciones.` 
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Entendido.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Conflicto detectado en la asignación.' }]);
    } finally {
      setIsTyping(false);
      setSearchTerm('');
    }
  };

  const toggleRestriction = (docId: string, instId: string) => {
    const currentRest = rules.restrictions[docId] || [];
    const newRest = currentRest.includes(instId)
      ? currentRest.filter(id => id !== instId)
      : [...currentRest, instId];
    
    setRules({
      ...rules,
      restrictions: { ...rules.restrictions, [docId]: newRest }
    });
  };

  // Aplica o quita restricciones a todas las instituciones de un grupo
  const toggleGroupRestriction = (docId: string, groupName: string) => {
    const groupInstIds = rules.institutionGroups[groupName] || [];
    const currentRest = rules.restrictions[docId] || [];
    
    const allInGroupAreRestricted = groupInstIds.every(id => currentRest.includes(id));
    
    let newRest;
    if (allInGroupAreRestricted) {
      // Si todos están restringidos, los quitamos
      newRest = currentRest.filter(id => !groupInstIds.includes(id));
    } else {
      // Si no, añadimos los que faltan
      newRest = Array.from(new Set([...currentRest, ...groupInstIds]));
    }

    setRules({
      ...rules,
      restrictions: { ...rules.restrictions, [docId]: newRest }
    });
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    setRules({
      ...rules,
      institutionGroups: { ...rules.institutionGroups, [newGroupName]: [] }
    });
    setNewGroupName('');
  };

  const toggleInstInGroup = (groupName: string, instId: string) => {
    const current = rules.institutionGroups[groupName] || [];
    const next = current.includes(instId) 
      ? current.filter(id => id !== instId) 
      : [...current, instId];
    
    setRules({
      ...rules,
      institutionGroups: { ...rules.institutionGroups, [groupName]: next }
    });
  };

  const filteredDoctors = doctors.filter(d => 
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDoctorForRestriction = doctors.find(d => d.id === managingRestrictionsId);
  const filteredInstitutions = institutions.filter(i => 
    i.name.toLowerCase().includes(instSearchTerm.toLowerCase()) || 
    i.abbreviation.toLowerCase().includes(instSearchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
      
      <div className="flex justify-between items-center mb-8 px-2">
         <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[24px] shadow-inner">
            <button onClick={() => setViewMode('timeline')} className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'opacity-40 hover:opacity-100'}`}>
              <MapIcon className="w-4 h-4" /> Timeline
            </button>
            <button onClick={() => setViewMode('chat')} className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'chat' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'opacity-40 hover:opacity-100'}`}>
              <MessageSquare className="w-4 h-4" /> Consola IA
            </button>
            <button onClick={() => setViewMode('config')} className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'config' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl' : 'opacity-40 hover:opacity-100'}`}>
              <Settings2 className="w-4 h-4" /> Reglas de Oro
            </button>
         </div>
      </div>

      <div className="flex-grow grid lg:grid-cols-12 gap-8 overflow-hidden">
        
        {/* Lado Izquierdo: Resumen Operativo */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-6">
                 <ShieldAlert className="w-5 h-5 text-indigo-600" />
                 <h3 className="text-lg font-black uppercase tracking-tighter">Motor Activo</h3>
              </div>
              <div className="space-y-4">
                 <RuleItem label="Horario Hábil" val={`${rules.businessStart}-${rules.businessEnd}`} isDark={isDark} />
                 <RuleItem label="Grupos Instit." val={Object.keys(rules.institutionGroups).length.toString()} isDark={isDark} />
                 <RuleItem label="Vetos Activos" val={Object.keys(rules.restrictions).length.toString()} isDark={isDark} />
              </div>
           </div>

           {viewMode === 'chat' && (
             <div className={`p-8 rounded-[40px] border flex-grow animate-in slide-in-from-left-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-6">Borrador</h3>
                <div className="space-y-4">
                   <DraftItem label="Médico" val={draft.doctorName || '---'} active={!!draft.doctorName} />
                   <DraftItem label="Sede" val={draft.institutionName || '---'} active={!!draft.institutionName} />
                   <DraftItem label="Fecha" val={draft.date || '---'} active={!!draft.date} />
                   <DraftItem label="Bloque" val={draft.date ? `${draft.startTime} - ${draft.endTime}` : '---'} active={step === 'group' || step === 'confirm'} />
                </div>
             </div>
           )}
        </div>

        {/* Lado Derecho: Contenido Variable */}
        <div className={`lg:col-span-9 flex flex-col rounded-[48px] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          
          {viewMode === 'config' ? (
            <div className="p-12 overflow-y-auto custom-scrollbar space-y-12 animate-in zoom-in-95">
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Configuración de Reglas de Oro</h3>
                  <p className="opacity-40 text-sm font-medium italic">Parámetros globales, grupos y restricciones.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <ConfigSection title="Días Hábiles" icon={<CalendarCheck className="w-5 h-5"/>}>
                     <div className="flex flex-wrap gap-2">
                        {dayNames.map((name, i) => (
                          <button key={i} onClick={() => {
                            const newDays = rules.businessDays.includes(i) ? rules.businessDays.filter(d => d !== i) : [...rules.businessDays, i].sort();
                            setRules({...rules, businessDays: newDays});
                          }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${rules.businessDays.includes(i) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-100 dark:border-slate-800 opacity-40'}`}>
                            {name}
                          </button>
                        ))}
                     </div>
                  </ConfigSection>

                  <ConfigSection title="Límites Horarios" icon={<Clock className="w-5 h-5"/>}>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Inicio Hábil" type="time" value={rules.businessStart} onChange={(v: string) => setRules({...rules, businessStart: v})} isDark={isDark} />
                        <InputGroup label="Fin Hábil" type="time" value={rules.businessEnd} onChange={(v: string) => setRules({...rules, businessEnd: v})} isDark={isDark} />
                     </div>
                  </ConfigSection>
               </div>

               {/* NUEVA SECCIÓN: GESTIÓN DE GRUPOS DE INSTITUCIONES */}
               <ConfigSection title="Gestión de Grupos de Instituciones" icon={<Layers className="w-5 h-5 text-blue-500"/>}>
                  <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                     <div className="flex gap-4 mb-8">
                        <input 
                          type="text" 
                          placeholder="Nombre del grupo (ej: 1, A, Red Sur)..." 
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                          className={`flex-grow p-4 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                        />
                        <button 
                          onClick={addGroup}
                          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                        >
                           Crear Grupo
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.keys(rules.institutionGroups).map(gName => (
                          <div key={gName} className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-600 text-white rounded-xl"><Hash className="w-4 h-4" /></div>
                                   <span className="text-sm font-black uppercase tracking-tight">Grupo {gName}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const next = { ...rules.institutionGroups };
                                    delete next[gName];
                                    setRules({ ...rules, institutionGroups: next });
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {institutions.map(inst => {
                                  const isInGroup = rules.institutionGroups[gName]?.includes(inst.id);
                                  return (
                                    <button 
                                      key={inst.id}
                                      onClick={() => toggleInstInGroup(gName, inst.id)}
                                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between group transition-all
                                        ${isInGroup ? 'bg-blue-600/5 border-blue-600/30' : 'border-slate-100 dark:border-slate-800 opacity-40 hover:opacity-100'}`}
                                    >
                                       <span className="text-[10px] font-bold uppercase">{inst.name}</span>
                                       {isInGroup ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </ConfigSection>

               {/* SECCIÓN REDISEÑADA: INCOMPATIBILIDADES */}
               <ConfigSection title="Incompatibilidades Médico-Sede (Lista Negra)" icon={<AlertTriangle className="w-5 h-5 text-amber-500"/>}>
                  <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                     <p className="text-[10px] font-bold uppercase opacity-40 mb-8 italic">Gestione el acceso masivo por grupos o individualmente.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {doctors.map(doc => {
                          const restrictedCount = rules.restrictions[doc.id]?.length || 0;
                          return (
                            <div key={doc.id} className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-indigo-500 transition-all">
                               <div className="flex items-center gap-4 mb-6">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-black text-xs">
                                     {doc.firstName[0]}{doc.lastName[0]}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black uppercase tracking-tight">Dr. {doc.lastName}</p>
                                     <p className="text-[8px] opacity-40 font-black uppercase tracking-widest">{doc.subSpecialty || 'Médico'}</p>
                                  </div>
                               </div>
                               
                               <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-6">
                                  <span className="text-[9px] font-black uppercase opacity-40">Restricciones:</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${restrictedCount > 0 ? 'bg-rose-500 text-white' : 'opacity-20'}`}>
                                    {restrictedCount} Sedes
                                  </span>
                               </div>

                               <button 
                                onClick={() => setManagingRestrictionsId(doc.id)}
                                className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                               >
                                 Gestionar Red de Sedes
                               </button>
                            </div>
                          );
                        })}
                     </div>
                  </div>
               </ConfigSection>

               <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => { localStorage.setItem('amis_golden_rules', JSON.stringify(rules)); alert("Motor Reconfigurado Correctamente."); setViewMode('chat'); }}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Save className="w-5 h-5" /> Guardar y Aplicar al Motor IA
                  </button>
               </div>
            </div>
          ) : viewMode === 'chat' ? (
            <div className="flex flex-col h-full">
               <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/30 dark:bg-slate-950/20">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                       <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${m.role === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}`}>
                          {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                       </div>
                       <div className={`max-w-[80%] p-6 rounded-[32px] text-sm leading-relaxed ${m.role === 'assistant' ? (isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm') : 'bg-indigo-600 text-white'}`}>
                          <p className="font-medium whitespace-pre-wrap">{m.content}</p>
                       </div>
                    </div>
                  ))}
                  {isTyping && <div className="flex gap-4 animate-pulse"><Bot className="w-5 h-5 opacity-20" /><div className="w-20 h-4 bg-slate-300 dark:bg-slate-700 rounded-full"></div></div>}
                  <div ref={chatEndRef} />
               </div>

               <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  {step === 'doctor' && (
                    <div className="space-y-4">
                       <input autoFocus type="text" placeholder="Médico a asignar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} />
                       <div className="flex flex-wrap gap-2">
                          {filteredDoctors.slice(0, 5).map(doc => (
                            <button key={doc.id} onClick={() => handleSelection('doctor', doc.id, `${doc.firstName} ${doc.lastName}`)} className="px-4 py-2 bg-indigo-600/10 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                              {doc.firstName} {doc.lastName}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {step === 'institution' && (
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase opacity-40 ml-2">¿Para qué sede?</p>
                       <div className="flex flex-wrap gap-2">
                          {institutions.slice(0, 8).map(inst => (
                            <button key={inst.id} onClick={() => handleSelection('institution', inst.id, inst.name)} className="px-6 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
                              <Building2 className="w-4 h-4" /> {inst.abbreviation}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {step === 'date' && (
                    <div className="flex flex-col items-center gap-4">
                       <input type="date" onChange={e => handleSelection('date', e.target.value)} className={`p-4 rounded-2xl border outline-none font-black ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} />
                    </div>
                  )}

                  {step === 'time' && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Inicio" type="time" value={draft.startTime} onChange={(v: string) => setDraft({...draft, startTime: v})} isDark={isDark} />
                          <InputGroup label="Término" type="time" value={draft.endTime} onChange={(v: string) => setDraft({...draft, endTime: v})} isDark={isDark} />
                       </div>
                       <button onClick={() => handleSelection('time', {start: draft.startTime, end: draft.endTime}, `${draft.startTime} a ${draft.endTime}`)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Validar Bloque</button>
                    </div>
                  )}

                  {step === 'confirm' && (
                    <div className="text-center">
                       <button onClick={() => { setMessages(prev => [...prev, {role: 'assistant', content: 'Asignación grabada exitosamente.'}]); setStep('none'); }} className="px-12 py-5 bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Finalizar Registro</button>
                       <button onClick={() => setStep('doctor')} className="block mx-auto mt-4 text-[9px] font-black uppercase opacity-40 hover:underline">Reiniciar</button>
                    </div>
                  )}

                  {step === 'none' && (
                    <button onClick={() => setStep('doctor')} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Nueva Asignación</button>
                  )}
               </div>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
               <div className="flex-grow flex flex-col items-center justify-center opacity-20 p-20 text-center">
                  <MapIcon className="w-24 h-24 mb-6" />
                  <h3 className="text-2xl font-black uppercase tracking-widest">Vista de Cobertura</h3>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL MAESTRO: GESTIÓN DE RESTRICCIONES CON SOPORTE PARA GRUPOS */}
      {managingRestrictionsId && selectedDoctorForRestriction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
           <div className={`relative w-full max-w-4xl p-10 rounded-[56px] border animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'}`}>
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-rose-500/10 text-rose-500 rounded-3xl">
                       <UserMinus className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black uppercase tracking-tighter">Incompatibilidades de Red</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gestión para: Dr. {selectedDoctorForRestriction.lastName}</p>
                    </div>
                 </div>
                 <button onClick={() => setManagingRestrictionsId(null)} className="p-3 opacity-40 hover:opacity-100"><X className="w-6 h-6" /></button>
              </div>

              {/* SELECTOR DE GRUPOS PARA ACCIONES MASIVAS */}
              {Object.keys(rules.institutionGroups).length > 0 && (
                <div className="mb-8 p-6 rounded-3xl bg-indigo-600/5 border border-indigo-600/20 animate-in fade-in">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2"><Layers className="w-3 h-3" /> Aplicar Bloqueo por Grupo</p>
                   <div className="flex flex-wrap gap-3">
                      {Object.keys(rules.institutionGroups).map(gName => {
                        const groupInstIds = rules.institutionGroups[gName];
                        const currentRest = rules.restrictions[selectedDoctorForRestriction.id] || [];
                        const allRestricted = groupInstIds.every(id => currentRest.includes(id));
                        return (
                          <button 
                            key={gName}
                            onClick={() => toggleGroupRestriction(selectedDoctorForRestriction.id, gName)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2
                              ${allRestricted ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 opacity-40 hover:opacity-100'}`}
                          >
                             {allRestricted ? <ShieldAlert className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                             Grupo {gName}
                          </button>
                        );
                      })}
                   </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 mb-8">
                 <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                    <input 
                      type="text" 
                      placeholder="Buscar entre las 100+ sedes..." 
                      value={instSearchTerm}
                      onChange={e => setInstSearchTerm(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none font-bold transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                    />
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setRules({...rules, restrictions: {...rules.restrictions, [selectedDoctorForRestriction.id]: institutions.map(i => i.id)}})}
                      className="px-6 py-4 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Bloquear Todas
                    </button>
                    <button 
                      onClick={() => setRules({...rules, restrictions: {...rules.restrictions, [selectedDoctorForRestriction.id]: []}})}
                      className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Permitir Todas
                    </button>
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-10">
                 {filteredInstitutions.length === 0 ? (
                   <div className="py-20 text-center opacity-20 italic font-black uppercase text-xs tracking-widest">No se encontraron sedes coincidentes</div>
                 ) : filteredInstitutions.map(inst => {
                    const isRestricted = rules.restrictions[selectedDoctorForRestriction.id]?.includes(inst.id);
                    // Buscar si pertenece a algún grupo
                    const groupsForInst = Object.entries(rules.institutionGroups)
                      .filter(([_, ids]) => (ids as string[]).includes(inst.id))
                      .map(([name]) => name);

                    return (
                      <div 
                        key={inst.id} 
                        onClick={() => toggleRestriction(selectedDoctorForRestriction.id, inst.id)}
                        className={`p-5 rounded-[32px] border cursor-pointer transition-all flex items-center justify-between group
                          ${isRestricted 
                            ? 'bg-rose-500/5 border-rose-500/30' 
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-indigo-500'}`}
                      >
                         <div className="flex items-center gap-5">
                            <div className={`w-12 h-10 rounded-xl flex items-center justify-center font-black text-[9px] shadow-sm tracking-tighter ${isRestricted ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
                               {inst.abbreviation}
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-black uppercase tracking-tight leading-none">{inst.name}</p>
                                  {groupsForInst.map(g => (
                                    <span key={g} className="text-[7px] font-black uppercase bg-blue-600/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20">G{g}</span>
                                  ))}
                               </div>
                               <div className="flex items-center gap-3 opacity-40">
                                  <span className="text-[9px] font-bold uppercase flex items-center gap-1"><Building className="w-3 h-3" /> {inst.category}</span>
                                  <span className="text-[9px] font-bold uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> {inst.city}</span>
                               </div>
                            </div>
                         </div>
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isRestricted ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-300'}`}>
                            {isRestricted ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                         </div>
                      </div>
                    );
                 })}
              </div>

              <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                 <button 
                  onClick={() => setManagingRestrictionsId(null)}
                  className="px-16 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   Confirmar Red del Médico
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ConfigSection = ({ title, icon, children }: any) => (
  <div className="space-y-6">
     <div className="flex items-center gap-3 opacity-40">
        {icon}
        <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
     </div>
     {children}
  </div>
);

const InputGroup = ({ label, value, onChange, type, isDark }: any) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black uppercase opacity-30 ml-1">{label}</label>
     <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className={`w-full p-4 rounded-xl border outline-none font-black text-xs ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`}
     />
  </div>
);

const RuleItem = ({ label, val, isDark }: any) => (
  <div className={`p-4 rounded-2xl border flex justify-between items-center ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
     <span className="text-[11px] font-black uppercase tracking-tight">{val}</span>
  </div>
);

const DraftItem = ({ label, val, active }: any) => (
  <div className={`flex justify-between items-center transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}>
     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
     <span className="text-[11px] font-black uppercase tracking-tight text-indigo-600 text-right">{val}</span>
  </div>
);

export default ShiftsModule;