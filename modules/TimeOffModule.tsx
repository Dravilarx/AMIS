
import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, Plus, Search, Filter, MoreVertical, 
  Clock, Plane, HeartPulse, Briefcase, CheckCircle2, 
  Trash2, Download, BarChart2, Table as TableIcon, 
  LayoutGrid, Rows, ChevronLeft, ChevronRight, Calendar, X, Check, User
} from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import { useTimeOff } from '../hooks/useTimeOff';
import { Employee, TimeOffEntry, TimeOffType, TimeOffStatus, UserSession } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const TimeOffModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { entries, addEntry, deleteEntry, updateEntry } = useTimeOff();
  
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'registros' | 'calendario'>('registros');
  
  // Profile-based filtering
  const userFilteredEntries = useMemo(() => {
    let base = entries;
    if (currentUser.role === 'Médico' || currentUser.role === 'Técnico') {
       base = entries.filter(e => e.employeeId === currentUser.id);
    }
    return base.filter(entry => {
      const emp = employees.find(e => e.id === entry.employeeId);
      const searchStr = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
      return searchStr.includes(searchTerm.toLowerCase()) || entry.type.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [entries, employees, searchTerm, currentUser]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Presencia & Ausencias</h2>
          <p className="opacity-40 text-lg font-medium italic">Gestión operativa para: {currentUser.name}.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 shadow-2xl shadow-indigo-500/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nueva Solicitud
        </button>
      </div>

      <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
           <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button onClick={() => setViewMode('registros')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'registros' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}>Registros</button>
              <button onClick={() => setViewMode('calendario')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendario' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}>Calendario</button>
           </div>
           <div className="relative max-w-xs w-full">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
             <input 
               type="text" 
               placeholder="Filtrar ausencias..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)} 
               className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border text-xs font-bold transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} 
             />
           </div>
        </div>

        {viewMode === 'registros' ? (
          <div className="space-y-4">
             {userFilteredEntries.length === 0 ? (
               <div className="py-20 text-center opacity-20"><CalendarDays className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-xs">Sin registros que mostrar</p></div>
             ) : userFilteredEntries.map(entry => {
                const emp = employees.find(e => e.id === entry.employeeId);
                return (
                  <div key={entry.id} className={`p-6 rounded-[32px] border flex items-center justify-between group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-black text-xs uppercase overflow-hidden text-indigo-600">
                          {emp?.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span>{emp?.firstName[0]}{emp?.lastName[0]}</span>}
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight">{emp?.firstName} {emp?.lastName}</p>
                          <p className="text-[10px] opacity-40 font-black uppercase tracking-widest flex items-center gap-2">
                            <TypeIcon type={entry.type} /> {entry.type} • {entry.startDate} al {entry.endDate}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={entry.status} />
                      {(currentUser.role === 'Superuser' || currentUser.role === 'Jefatura') && entry.status === 'Pendiente' && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateEntry(entry.id, { status: 'Aprobado' })} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                          <button onClick={() => updateEntry(entry.id, { status: 'Rechazado' })} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                      {(currentUser.role === 'Superuser' || currentUser.id === entry.employeeId) && (
                        <button onClick={() => deleteEntry(entry.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                );
             })}
          </div>
        ) : (
          <CalendarView isDark={isDark} entries={userFilteredEntries} employees={employees} />
        )}
      </div>
      
      {showModal && (
        <TimeOffForm 
          isDark={isDark} 
          employees={employees} 
          currentUser={currentUser}
          onClose={() => setShowModal(false)} 
          onSubmit={async (data: any) => { 
            await addEntry(data); 
            setShowModal(false); 
          }} 
        />
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: TimeOffStatus }) => {
  const styles = { 'Aprobado': 'bg-emerald-500/10 text-emerald-500', 'Pendiente': 'bg-amber-500/10 text-amber-500', 'Rechazado': 'bg-rose-500/10 text-rose-500', 'Finalizado': 'bg-slate-500/10 text-slate-500' };
  return <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

const TypeIcon = ({ type }: { type: TimeOffType }) => {
  switch (type) {
    case 'Vacación': return <Plane className="w-3 h-3" />;
    case 'Licencia Médica': return <HeartPulse className="w-3 h-3" />;
    case 'Ausencia': return <X className="w-3 h-3" />;
    default: return <Briefcase className="w-3 h-3" />;
  }
};

// --- SUB-COMPONENTS ---

const CalendarView = ({ isDark, entries, employees }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Real days
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const getEntriesForDate = (date: Date) => {
    return entries.filter((e: TimeOffEntry) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return current >= start && current <= end;
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xl font-black uppercase tracking-tighter">{monthName}</h4>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 rounded-xl">Hoy</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="text-center text-[10px] font-black uppercase opacity-30 py-4">{d}</div>
        ))}
        {daysInMonth.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="h-32" />;
          const dayEntries = getEntriesForDate(date);
          return (
            <div key={idx} className={`h-32 p-3 border rounded-3xl transition-all ${isDark ? 'bg-slate-900 border-slate-800/50' : 'bg-slate-50/30 border-slate-100'} hover:border-indigo-500/30`}>
              <p className="text-[11px] font-black opacity-30 mb-2">{date.getDate()}</p>
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayEntries.map((e: TimeOffEntry) => {
                  const emp = employees.find((emp: Employee) => emp.id === e.employeeId);
                  return (
                    <div key={e.id} className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg truncate ${e.status === 'Aprobado' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {emp?.lastName || 'Staff'} - {e.type}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeOffForm = ({ isDark, employees, currentUser, onClose, onSubmit }: any) => {
  const [formData, setFormData] = useState({
    employeeId: currentUser.role === 'Superuser' ? '' : currentUser.id,
    type: 'Vacación' as TimeOffType,
    startDate: '',
    endDate: '',
    reason: '',
    status: (currentUser.role === 'Superuser' || currentUser.role === 'Jefatura') ? 'Aprobado' : 'Pendiente'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.startDate || !formData.endDate) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-xl p-10 rounded-[48px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-3xl font-black uppercase tracking-tighter">Nueva Solicitud</h3>
           <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(currentUser.role === 'Superuser' || currentUser.role === 'Jefatura') && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Seleccionar Staff</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <select 
                  value={formData.employeeId} 
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none font-bold text-xs appearance-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                >
                  <option value="">Buscar profesional...</option>
                  {employees.map((e: Employee) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.role})</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Tipo de Ausencia</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                >
                  <option value="Vacación">Vacación</option>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Permiso Administrativo">Permiso Administrativo</option>
                  <option value="Ausencia">Ausencia / Permiso</option>
                  <option value="Capacitación">Capacitación / Congreso</option>
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Estado</label>
                <div className={`p-4 rounded-2xl border font-bold text-[10px] uppercase text-center ${formData.status === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {formData.status}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">F. Inicio</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">F. Término</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
             </div>
          </div>

          <div>
             <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Motivo / Observaciones</label>
             <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Detalle el motivo de la ausencia..." className={`w-full p-5 rounded-3xl border outline-none font-medium text-sm h-32 resize-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          </div>

          <div className="pt-4 flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100">Descartar</button>
             <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95">Confirmar Solicitud</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeOffModule;
