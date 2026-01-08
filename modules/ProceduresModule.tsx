
import { Activity, ArrowRight, BarChart3, Building2, Calendar as CalendarIcon, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock, DollarSign, Edit2, FileText, Filter, Hash, Info, LayoutList, Mail, MessageCircle, MoreVertical, Phone, Plus, Save, Search, Settings, Share2, ShieldCheck, Stethoscope, Tag, Target, Trash2, User, UserCircle2, Wallet, X, Paperclip, UploadCloud, TrendingUp, PieChart, Users } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useProcedures } from '../hooks/useProcedures';
import { ProcedureCatalogItem, ProcedureModality, ProcedureStatus, UserSession, ProcedureEntry } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

type TimeFilter = 'month' | 'six_months' | 'year' | 'all';

const ProceduresModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const {
    procedures,
    catalog,
    addProcedure,
    updateProcedure,
    toggleRequirement,
    deleteProcedure,
    updateCatalogItem,
    addCatalogItem
  } = useProcedures();

  const [showModal, setShowModal] = useState(false);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showSchedulingModalId, setShowSchedulingModalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcedureStatus | 'All'>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('calendar');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const radiologists = useMemo(() => employees.filter(e => e.role === 'Médico'), [employees]);

  // Per-user filtering
  const userFilteredProcedures = useMemo(() => {
    let base = procedures;
    if (currentUser.role === 'Médico' || currentUser.role === 'Técnico') {
      base = procedures.filter(p => p.radiologistId === currentUser.id);
    }

    return base.filter(p => {
      const matchSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientRut.includes(searchTerm);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchDoctor = doctorFilter === 'All' || p.radiologistId === doctorFilter;
      return matchSearch && matchStatus && matchDoctor;
    });
  }, [procedures, searchTerm, statusFilter, doctorFilter, currentUser]);

  // Time-filtered procedures for Stats
  const statsFilteredProcedures = useMemo(() => {
    const now = new Date();
    return userFilteredProcedures.filter(p => {
      const procDate = new Date(p.createdAt);
      if (timeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return procDate >= monthAgo;
      }
      if (timeFilter === 'six_months') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return procDate >= sixMonthsAgo;
      }
      if (timeFilter === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return procDate >= yearAgo;
      }
      return true;
    });
  }, [userFilteredProcedures, timeFilter]);

  const revenue = userFilteredProcedures.reduce((acc, p) => p.status === 'Completado' ? acc + p.value : acc, 0);
  const pendingDocs = userFilteredProcedures.filter(p => p.status === 'Pendiente Docs').length;
  const readyToSchedule = userFilteredProcedures.filter(p => p.status === 'Listo').length;

  const editingProcedure = useMemo(() =>
    editingProcedureId ? procedures.find(p => p.id === editingProcedureId) : null
    , [editingProcedureId, procedures]);

  const schedulingProcedure = useMemo(() =>
    showSchedulingModalId ? procedures.find(p => p.id === showSchedulingModalId) : null
    , [showSchedulingModalId, procedures]);

  const handleEditClick = (id: string) => {
    setEditingProcedureId(id);
    setShowModal(true);
  };

  const handleCloseForm = () => {
    setShowModal(false);
    setEditingProcedureId(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">Intervencionismo Staff</h2>
          <p className="opacity-40 text-lg font-medium italic">Gestión de procedimientos para: {currentUser.name}.</p>
        </div>
        <div className="flex gap-4">
          {(currentUser.role === 'Superuser' || currentUser.role === 'Administrativo') && (
            <button
              onClick={() => setShowCatalogModal(true)}
              className={`px-8 py-5 border rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}
            >
              <Settings className="w-5 h-5" /> Catálogo
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" /> Nuevo Caso
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Mi Facturación" val={`$${revenue.toLocaleString()}`} icon={<Wallet className="text-emerald-500" />} isDark={isDark} />
        <StatCard label="Casos Pendientes" val={pendingDocs} icon={<FileText className="text-amber-500" />} isDark={isDark} />
        <StatCard label="Por Agendar" val={readyToSchedule} icon={<CheckCircle2 className="text-blue-500" />} isDark={isDark} />
        <StatCard label="Total Histórico" val={userFilteredProcedures.length} icon={<Activity className="text-indigo-500" />} isDark={isDark} />
      </div>

      {/* Control Bar */}
      <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col xl:flex-row items-center justify-between gap-8 mb-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Listado</button>
              <button onClick={() => setViewMode('calendar')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Agenda</button>
              {(currentUser.role === 'Superuser' || currentUser.role === 'Jefatura') && (
                <button onClick={() => setViewMode('stats')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'stats' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Análisis</button>
              )}
            </div>

            {viewMode === 'stats' && (
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-in fade-in zoom-in duration-300">
                <button onClick={() => setTimeFilter('month')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeFilter === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-40'}`}>Este Mes</button>
                <button onClick={() => setTimeFilter('six_months')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeFilter === 'six_months' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-40'}`}>6 Meses</button>
                <button onClick={() => setTimeFilter('year')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeFilter === 'year' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-40'}`}>Año</button>
                <button onClick={() => setTimeFilter('all')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${timeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-40'}`}>Todo</button>
              </div>
            )}
          </div>

          {viewMode !== 'stats' && (
            <div className="relative flex-grow max-w-md w-full animate-in fade-in duration-500">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input type="text" placeholder="Buscar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500'}`} />
            </div>
          )}
        </div>

        {viewMode === 'list' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {userFilteredProcedures.map(proc => {
              const rad = radiologists.find(e => e.id === proc.radiologistId);
              return (
                <div key={proc.id} className={`p-8 rounded-[40px] border transition-all group hover:border-blue-500 ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center"><Stethoscope className="w-7 h-7" /></div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">{proc.procedureType || 'Sin Procedimiento'}</h4>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{proc.patientName || 'Paciente S.N.'}</p>
                          {proc.takesAnticoagulants && (
                            <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                              <Info className="w-3 h-3" /> Anticoagulante
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">
                          {proc.patientRut} {proc.patientInsurance ? `• ${proc.patientInsurance}` : ''}
                        </p>
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">
                          {proc.clinicalCenter || 'Sede no asignada'} • {rad ? `Dr. ${rad.lastName}` : 'Sin Médico'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={proc.status} />
                      <button
                        onClick={() => handleEditClick(proc.id)}
                        className="p-2.5 rounded-xl hover:bg-blue-600/10 text-blue-600 transition-all opacity-40 hover:opacity-100"
                        title="Editar Procedimiento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowSchedulingModalId(proc.id)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Gestionar Cita</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'calendar' && (
          <EnhancedCalendar isDark={isDark} procedures={userFilteredProcedures} onEdit={(id: any) => setShowSchedulingModalId(id)} />
        )}

        {viewMode === 'stats' && (
          <ProceduresStats isDark={isDark} filteredProcedures={statsFilteredProcedures} radiologists={radiologists} />
        )}
      </div>

      {showCatalogModal && (
        <CatalogModal
          isDark={isDark}
          catalog={catalog}
          onClose={() => setShowCatalogModal(false)}
          onUpdate={updateCatalogItem}
          onAdd={addCatalogItem}
        />
      )}

      {showModal && (
        <ProcedureForm
          isDark={isDark}
          radiologists={radiologists}
          catalog={catalog}
          initialData={editingProcedure || undefined}
          onClose={handleCloseForm}
          onSubmit={async (data: any) => {
            if (editingProcedureId) {
              await updateProcedure(editingProcedureId, data);
            } else {
              await addProcedure(data);
            }
            handleCloseForm();
          }}
        />
      )}

      {schedulingProcedure && (
        <SchedulingModal
          isDark={isDark}
          procedure={schedulingProcedure}
          onClose={() => setShowSchedulingModalId(null)}
          onSchedule={async (id: string, date: string) => {
            await updateProcedure(id, { scheduledDate: date, status: 'Programado' });
            setShowSchedulingModalId(null);
          }}
          onToggleReq={toggleRequirement}
          onAttach={async (procId: string, reqId: string, fileUrl: string) => {
            const updatedReqs = schedulingProcedure.requirements.map(r =>
              r.id === reqId ? { ...r, fileUrl, isCompleted: true } : r
            );
            await updateProcedure(procId, { requirements: updatedReqs });
          }}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ProceduresStats = ({ isDark, filteredProcedures, radiologists }: any) => {
  const statsData = useMemo(() => {
    const totalExams = filteredProcedures.length;
    const totalValue = filteredProcedures.reduce((acc: number, p: any) => acc + p.value, 0);
    const completedExams = filteredProcedures.filter((p: any) => p.status === 'Completado').length;

    const doctorStatsMap: Record<string, { count: number, value: number }> = {};
    const centerStatsMap: Record<string, { count: number, value: number }> = {};
    const typeStatsMap: Record<string, { count: number }> = {};

    filteredProcedures.forEach((p: any) => {
      // Per Doctor
      const rad = radiologists.find((e: any) => e.id === p.radiologistId);
      const drName = rad ? `Dr. ${rad.lastName}` : 'Sin Asignar';
      if (!doctorStatsMap[drName]) doctorStatsMap[drName] = { count: 0, value: 0 };
      doctorStatsMap[drName].count++;
      doctorStatsMap[drName].value += p.value;

      // Per Center
      const center = p.clinicalCenter || 'Sin Sede';
      if (!centerStatsMap[center]) centerStatsMap[center] = { count: 0, value: 0 };
      centerStatsMap[center].count++;
      centerStatsMap[center].value += p.value;

      // Per Type
      const type = p.procedureType || 'Otros';
      if (!typeStatsMap[type]) typeStatsMap[type] = { count: 0 };
      typeStatsMap[type].count++;
    });

    return {
      totalExams,
      totalValue,
      completedExams,
      avgTicket: totalExams > 0 ? Math.round(totalValue / totalExams) : 0,
      byDoctor: Object.entries(doctorStatsMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.value - a.value),
      byCenter: Object.entries(centerStatsMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.value - a.value),
      byType: Object.entries(typeStatsMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.count - a.count)
    };
  }, [filteredProcedures, radiologists]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsMiniCard label="Volumen Total" val={statsData.totalExams} icon={<TrendingUp className="text-blue-500" />} isDark={isDark} />
        <StatsMiniCard label="Venta Bruta" val={`$${statsData.totalValue.toLocaleString()}`} icon={<DollarSign className="text-emerald-500" />} isDark={isDark} />
        <StatsMiniCard label="Ticket Promedio" val={`$${statsData.avgTicket.toLocaleString()}`} icon={<Target className="text-indigo-500" />} isDark={isDark} />
        <StatsMiniCard label="Efectividad" val={statsData.totalExams > 0 ? `${Math.round((statsData.completedExams / statsData.totalExams) * 100)}%` : '0%'} icon={<CheckCircle2 className="text-blue-600" />} isDark={isDark} />
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* breakdown by doctor */}
        <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <h4 className="text-xl font-black uppercase tracking-tighter">Producción por Staff</h4>
          </div>
          <div className="space-y-8">
            {statsData.byDoctor.length === 0 ? (
              <p className="text-center opacity-20 py-10 font-black uppercase text-xs tracking-widest">Sin datos en el periodo</p>
            ) : statsData.byDoctor.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                  <span className="text-[10px] font-black opacity-40 uppercase">${item.value.toLocaleString()} ({item.count} ex.)</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.value / (statsData.totalValue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* breakdown by center */}
        <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl"><Building2 className="w-6 h-6" /></div>
            <h4 className="text-xl font-black uppercase tracking-tighter">Desempeño por Sedes</h4>
          </div>
          <div className="space-y-8">
            {statsData.byCenter.length === 0 ? (
              <p className="text-center opacity-20 py-10 font-black uppercase text-xs tracking-widest">Sin datos en el periodo</p>
            ) : statsData.byCenter.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                  <span className="text-[10px] font-black opacity-40 uppercase">${item.value.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.value / (statsData.totalValue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className={`p-10 rounded-[48px] border lg:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl"><PieChart className="w-6 h-6" /></div>
            <h4 className="text-xl font-black uppercase tracking-tighter">Mix de Procedimientos</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsData.byType.map((item, idx) => (
              <div key={idx} className="p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-30 mb-1 tracking-widest">{item.name}</p>
                  <h5 className="text-2xl font-black">{item.count}</h5>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsMiniCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-8 rounded-[32px] border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-6">{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-2xl font-black tracking-tighter">{val}</h3>
  </div>
);

const EnhancedCalendar = ({ isDark, procedures, onEdit }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    else if (viewType === 'week') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    else if (viewType === 'month') newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const daysToRender = useMemo(() => {
    if (viewType === 'day') return [currentDate];

    if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
      });
    }

    if (viewType === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfGrid = new Date(startOfMonth);
      startOfGrid.setDate(startOfMonth.getDate() - startOfMonth.getDay());
      return Array.from({ length: 35 }).map((_, i) => {
        const d = new Date(startOfGrid);
        d.setDate(startOfGrid.getDate() + i);
        return d;
      });
    }
    return [];
  }, [currentDate, viewType]);

  const viewLabel = useMemo(() => {
    if (viewType === 'day') return currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    if (viewType === 'week') {
      const start = daysToRender[0];
      const end = daysToRender[6];
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }, [currentDate, viewType, daysToRender]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button onClick={() => setViewType('day')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewType === 'day' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Día</button>
            <button onClick={() => setViewType('week')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewType === 'week' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Semana</button>
            <button onClick={() => setViewType('month')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewType === 'month' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'opacity-40'}`}>Mes</button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-blue-600/10 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all">Hoy</button>
        </div>

        <div className="flex items-center gap-6">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-60 min-w-[180px] text-center">{viewLabel}</h4>
          <div className="flex gap-2">
            <button onClick={() => navigate('prev')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => navigate('next')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Grid Rendering */}
      <div className={`grid gap-6 ${viewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
        {daysToRender.map((day, idx) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const isOtherMonth = day.getMonth() !== currentDate.getMonth() && viewType === 'month';
          const dayProcs = procedures.filter((p: any) => p.scheduledDate && new Date(p.scheduledDate).toDateString() === day.toDateString());

          return (
            <div key={idx} className={`space-y-4 ${viewType === 'month' ? 'min-h-[140px]' : 'min-h-[400px]'} ${isOtherMonth ? 'opacity-20' : ''}`}>
              {viewType !== 'month' && (
                <div className={`p-4 rounded-3xl text-center transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'opacity-70' : 'opacity-30'}`}>{day.toLocaleString('es-ES', { weekday: 'short' })}</p>
                  <p className="text-2xl font-black leading-none mt-1">{day.getDate()}</p>
                </div>
              )}

              {viewType === 'month' && (
                <div className="flex justify-between items-center px-4">
                  <span className={`text-[10px] font-black ${isToday ? 'text-blue-600' : 'opacity-30'}`}>{day.getDate()}</span>
                  {dayProcs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </div>
              )}

              <div className={`flex flex-col gap-2 ${viewType !== 'month' ? 'pt-4 border-t border-slate-100 dark:border-slate-800' : ''}`}>
                {dayProcs.length === 0 && viewType === 'day' && (
                  <div className="py-20 text-center opacity-20 italic">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Sin procedimientos agendados</p>
                  </div>
                )}
                {dayProcs.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => onEdit(p.id)}
                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase cursor-pointer transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group
                      ${isDark ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-500'}`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-blue-600 group-hover:underline truncate">{p.patientName || 'Paciente S.N.'}</span>
                      <span className="text-[8px] opacity-40 whitespace-nowrap">{p.scheduledDate?.split('T')[1]}</span>
                    </div>
                    <p className="text-[8px] opacity-40 truncate">{p.procedureType || 'Sin procedimiento'}</p>
                    {p.takesAnticoagulants && <div className="mt-2 w-2 h-2 rounded-full bg-rose-500 ml-auto"></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mb-6">{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-3xl font-black tracking-tighter">{val}</h3>
  </div>
);

const StatusBadge = ({ status }: { status: ProcedureStatus }) => {
  const styles = { 'Pendiente Docs': 'bg-amber-500/10 text-amber-500', 'Listo': 'bg-blue-500/10 text-blue-600', 'Programado': 'bg-indigo-500/10 text-indigo-600', 'Completado': 'bg-emerald-500/10 text-emerald-500', 'Cancelado': 'bg-rose-500/10 text-rose-500' };
  return <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

// --- MODALS ---

const ProcedureForm = ({ isDark, radiologists, catalog, onClose, onSubmit, initialData }: any) => {
  const [patientName, setPatientName] = useState(initialData?.patientName || '');
  const [patientRut, setPatientRut] = useState(initialData?.patientRut || '');
  const [patientPhone, setPatientPhone] = useState(initialData?.patientPhone || '');
  const [patientEmail, setPatientEmail] = useState(initialData?.patientEmail || '');
  const [patientInsurance, setPatientInsurance] = useState(initialData?.patientInsurance || '');
  const [patientBirthDate, setPatientBirthDate] = useState(initialData?.patientBirthDate || '');
  const [patientAddress, setPatientAddress] = useState(initialData?.patientAddress || '');
  const [takesAnticoagulants, setTakesAnticoagulants] = useState(initialData?.takesAnticoagulants || false);
  const [catItemId, setCatItemId] = useState('');
  const [radiologistId, setRadiologistId] = useState(initialData?.radiologistId || '');
  const [clinicalCenter, setClinicalCenter] = useState(initialData?.clinicalCenter || '');

  // Si estamos editando, intentamos encontrar el item del catálogo por el nombre del procedimiento
  useEffect(() => {
    if (initialData?.procedureType) {
      const item = catalog.find((i: any) => i.name === initialData.procedureType);
      if (item) setCatItemId(item.id);
    }
  }, [initialData, catalog]);

  const selectedItem = catalog.find((i: any) => i.id === catItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseData = {
      patientName,
      patientRut,
      patientPhone,
      patientEmail,
      patientInsurance,
      patientBirthDate,
      patientAddress,
      takesAnticoagulants,
      procedureType: selectedItem?.name || '',
      value: selectedItem?.baseValue || 0,
      modality: selectedItem?.defaultModality || 'US',
      referringPhysician: initialData?.referringPhysician || 'Manual',
      radiologistId,
      clinicalCenter
    };

    onSubmit(baseData);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-2xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter">
            {initialData ? 'Editar Caso' : 'Registrar Nuevo Caso'}
          </h3>
          <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100 transition-all rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Nombre del Paciente</label>
              <input value={patientName} onChange={e => setPatientName(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">RUT / ID</label>
              <input value={patientRut} onChange={e => setPatientRut(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Teléfono</label>
              <input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Correo Electrónico</label>
              <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="paciente@ejemplo.com" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Previsión Salud</label>
              <input value={patientInsurance} onChange={e => setPatientInsurance(e.target.value)} placeholder="Ej. Fonasa, Isapre..." className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Fecha de Nacimiento</label>
              <input type="date" value={patientBirthDate} onChange={e => setPatientBirthDate(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Dirección Particular</label>
              <input value={patientAddress} onChange={e => setPatientAddress(e.target.value)} placeholder="Calle, Número, Ciudad" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700 focus:border-blue-600' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input type="checkbox" checked={takesAnticoagulants} onChange={e => setTakesAnticoagulants(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">¿El paciente toma anticoagulantes?</span>
                {takesAnticoagulants && (
                  <span className="ml-auto text-rose-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" /> Alerta Médica
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Procedimiento del Catálogo</label>
              <select value={catItemId} onChange={e => setCatItemId(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <option value="">Seleccione...</option>
                {catalog.filter((i: any) => i.active).map((item: any) => <option key={item.id} value={item.id}>{item.name} (${item.baseValue.toLocaleString()})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Radiólogo Responsable</label>
                <select value={radiologistId} onChange={e => setRadiologistId(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <option value="">Asignar...</option>
                  {radiologists.map((r: any) => <option key={r.id} value={r.id}>Dr. {r.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Sede Clínica</label>
                <input value={clinicalCenter} onChange={e => setClinicalCenter(e.target.value)} placeholder="Ej. Hospital Regional" className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all">
            {initialData ? 'Guardar Cambios' : 'Crear Entrada en Agenda'}
          </button>
        </form>
      </div>
    </div>
  );
};

const CatalogModal = ({ isDark, catalog, onClose, onUpdate, onAdd }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', baseValue: 0, defaultModality: 'US' as ProcedureModality, requiredDocs: [] as string[] });
  const [docInput, setDocInput] = useState('');

  const resetForm = () => {
    setFormData({ name: '', baseValue: 0, defaultModality: 'US', requiredDocs: [] });
    setIsAdding(false);
    setEditingItemId(null);
    setDocInput('');
  };

  const handleEditInit = (item: ProcedureCatalogItem) => {
    setFormData({
      name: item.name,
      baseValue: item.baseValue,
      defaultModality: item.defaultModality,
      requiredDocs: item.requiredDocs || []
    });
    setEditingItemId(item.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingItemId) {
      onUpdate(editingItemId, formData);
    } else {
      onAdd({ ...formData, active: true });
    }
    resetForm();
  };

  const handleAddDocTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = docInput.trim().replace(',', '');
      if (val && !formData.requiredDocs.includes(val)) {
        setFormData({ ...formData, requiredDocs: [...formData.requiredDocs, val] });
        setDocInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-5xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Catálogo de Procedimientos</h3>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Configuración de valores base, modalidades y documentación requerida.</p>
          </div>
          <button onClick={() => setIsAdding(true)} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {(isAdding || editingItemId) && (
            <div className="p-8 rounded-[40px] border-2 border-dashed border-blue-500/30 bg-blue-500/5 animate-in slide-in-from-top-4 space-y-6">
              <div className="flex items-center gap-6">
                <input autoFocus placeholder="Nombre procedimiento..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="flex-grow bg-transparent outline-none font-black text-xl uppercase tracking-tight" />
                <input type="number" placeholder="Valor $" value={formData.baseValue} onChange={e => setFormData({ ...formData, baseValue: Number(e.target.value) })} className="w-32 bg-transparent outline-none font-black text-lg border-b border-blue-500/20" />
                <select value={formData.defaultModality} onChange={e => setFormData({ ...formData, defaultModality: e.target.value as any })} className="bg-transparent outline-none font-black text-xs uppercase tracking-widest border-b border-blue-500/20">
                  <option value="US">US</option>
                  <option value="TAC">TAC</option>
                  <option value="RM">RM</option>
                  <option value="Rx">Rx</option>
                  <option value="Mamografía">Mamografía</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40">Listado de Documentación Requerida (Pulsa Enter para añadir)</label>
                <div className={`flex flex-wrap gap-2 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {formData.requiredDocs.map((doc, idx) => (
                    <span key={idx} className="bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in-90">
                      {doc} <X className="w-3 h-3 cursor-pointer hover:scale-125" onClick={() => setFormData({ ...formData, requiredDocs: formData.requiredDocs.filter((_, i) => i !== idx) })} />
                    </span>
                  ))}
                  <input
                    type="text"
                    value={docInput}
                    onChange={e => setDocInput(e.target.value)}
                    onKeyDown={handleAddDocTag}
                    placeholder="Añadir requisito..."
                    className="flex-grow bg-transparent outline-none text-xs font-bold p-1 min-w-[150px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={resetForm} className="px-8 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Guardar Definición
                </button>
              </div>
            </div>
          )}

          {catalog.map((item: any) => (
            <div key={item.id} className={`p-8 rounded-[40px] border flex flex-col gap-6 transition-all hover:border-blue-500/30 ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm font-black text-xs text-blue-600 border border-slate-100 dark:border-slate-800">
                    {item.defaultModality}
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{item.name}</h4>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Valor Base: ${item.baseValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onUpdate(item.id, { active: !item.active })}
                    className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${item.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                  >
                    {item.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => handleEditInit(item)}
                    className="p-3 rounded-xl hover:bg-blue-600/10 text-blue-600 transition-all opacity-40 hover:opacity-100"
                    title="Editar Definición de Catálogo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Requirements Preview */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <ClipboardCheck className="w-3.5 h-3.5 opacity-30" />
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-30">Documentos Requeridos por Protocolo</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.requiredDocs?.length > 0 ? item.requiredDocs.map((doc: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl text-[8px] font-black uppercase tracking-tight opacity-60">
                      {doc}
                    </span>
                  )) : (
                    <p className="text-[8px] font-black uppercase opacity-20 italic">Sin documentos específicos definidos</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <button onClick={onClose} className="px-10 py-4 font-black text-[10px] uppercase opacity-40 hover:opacity-100 transition-opacity">Cerrar Catálogo</button>
        </div>
      </div>
    </div>
  );
};

const SchedulingModal = ({ isDark, procedure, onClose, onSchedule, onToggleReq, onAttach }: { isDark: boolean, procedure: ProcedureEntry, onClose: () => void, onSchedule: (id: string, date: string) => void, onToggleReq: (pId: string, rId: string) => void, onAttach: (pId: string, rId: string, url: string) => void }) => {
  const [date, setDate] = useState(procedure.scheduledDate?.split('T')[0] || '');
  const [time, setTime] = useState(procedure.scheduledDate?.split('T')[1] || '09:00');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!date) return;
    onSchedule(procedure.id, `${date}T${time}`);
  };

  const handleFileClick = (reqId: string) => {
    setActiveReqId(reqId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeReqId) {
      // Mock upload
      const mockUrl = URL.createObjectURL(file);
      onAttach(procedure.id, activeReqId, mockUrl);
      setActiveReqId(null);
    }
  };

  const allRequirementsMet = procedure.requirements.every(r => r.isCompleted);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative w-full max-w-2xl p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Gestionar Cita</h3>
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{procedure.patientName || 'Paciente S.N.'} • {procedure.patientRut}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {procedure.patientInsurance && <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Previsión: {procedure.patientInsurance}</p>}
              {procedure.patientBirthDate && <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Nacimiento: {new Date(procedure.patientBirthDate).toLocaleDateString()}</p>}
              {procedure.takesAnticoagulants && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md text-[9px] font-black uppercase tracking-widest">
                  <Info className="w-3 h-3" /> Anticoagulante
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-3 opacity-40 hover:opacity-100"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-8">
          {/* Documentation Checklist Section */}
          <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Checklist Documentación Requerida
            </h4>
            <div className="space-y-3">
              {procedure.requirements.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onToggleReq(procedure.id, req.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${req.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                      {req.isCompleted && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <span className={`text-xs font-bold uppercase ${req.isCompleted ? 'opacity-40 line-through' : ''}`}>{req.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {req.fileUrl && (
                      <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleFileClick(req.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-600/10 rounded-lg"
                      title="Adjuntar Documento"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </div>
            {!allRequirementsMet && (
              <p className="mt-4 text-[9px] font-black uppercase text-amber-500 italic">Requisitos pendientes de revisión.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Seleccione Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ml-2">Hora Sugerida</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`w-full p-5 rounded-2xl border outline-none font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={!date}
              onClick={handleConfirm}
              className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-30 transition-all hover:scale-[1.02] active:scale-95"
            >
              Confirmar en Agenda
            </button>
            {!allRequirementsMet && (
              <p className="text-center text-[9px] font-black uppercase opacity-30 mt-4 tracking-widest">Procedimiento agendado con documentación parcial</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProceduresModule;
