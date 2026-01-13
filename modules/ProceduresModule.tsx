import {
  AlertTriangle, ArrowDown, ArrowUp, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Download, Edit2, Eye, FileText, Filter, Info, Mail, Phone, Plus,
  Printer, Search, Trash2, Upload, User, X, Check, Clock, Building2,
  AlertCircle, FileSpreadsheet, Save, Stethoscope, MapPin, Activity,
  BarChart3, Users, DollarSign, TrendingUp, Bell, FileUp, CheckCircle2
} from 'lucide-react';
import React, { useMemo, useState, useRef } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useProcedures } from '../hooks/useProcedures';
import { ProcedureStatus, UserSession, ProcedureEntry, Employee } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

type SortField = 'patientName' | 'patientRut' | 'procedureType' | 'scheduledDate' | 'status' | 'clinicalCenter';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'calendar' | 'stats';

const ProceduresModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { procedures, catalog, addProcedure, updateProcedure, deleteProcedure, toggleRequirement } = useProcedures();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcedureStatus | 'All'>('All');
  const [doctorFilter, setDoctorFilter] = useState<string>('All');
  const [centerFilter, setCenterFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureEntry | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchStatus, setBatchStatus] = useState<ProcedureStatus | ''>('');

  const radiologists = useMemo(() => employees.filter(e => e.role === 'Médico'), [employees]);
  const centers = useMemo(() => [...new Set(procedures.map(p => p.clinicalCenter).filter(Boolean))], [procedures]);

  // Notifications - procedures needing attention
  const notifications = useMemo(() => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return {
      pendingDocs: procedures.filter(p => p.status === 'Pendiente Docs').length,
      upcoming24h: procedures.filter(p => {
        if (!p.scheduledDate) return false;
        const d = new Date(p.scheduledDate);
        return d >= now && d <= in24h;
      }).length,
      upcoming48h: procedures.filter(p => {
        if (!p.scheduledDate) return false;
        const d = new Date(p.scheduledDate);
        return d > in24h && d <= in48h;
      }).length
    };
  }, [procedures]);

  const totalNotifications = notifications.pendingDocs + notifications.upcoming24h;

  // Filtering & Sorting
  const filteredProcedures = useMemo(() => {
    let filtered = procedures;

    if (currentUser.role === 'Médico' || currentUser.role === 'Técnico') {
      filtered = filtered.filter(p => p.radiologistId === currentUser.id);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.patientName.toLowerCase().includes(term) ||
        p.patientRut.includes(term) ||
        p.procedureType.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') filtered = filtered.filter(p => p.status === statusFilter);
    if (doctorFilter !== 'All') filtered = filtered.filter(p => p.radiologistId === doctorFilter);
    if (centerFilter !== 'All') filtered = filtered.filter(p => p.clinicalCenter === centerFilter);
    if (dateFrom) filtered = filtered.filter(p => p.scheduledDate && p.scheduledDate >= dateFrom);
    if (dateTo) filtered = filtered.filter(p => p.scheduledDate && p.scheduledDate <= dateTo);

    filtered.sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';
      if (sortField === 'scheduledDate') {
        aVal = a.scheduledDate || '9999-12-31';
        bVal = b.scheduledDate || '9999-12-31';
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [procedures, searchTerm, statusFilter, doctorFilter, centerFilter, dateFrom, dateTo, sortField, sortDirection, currentUser]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredProcedures.length;
    const completed = filteredProcedures.filter(p => p.status === 'Completado').length;
    const pending = filteredProcedures.filter(p => p.status === 'Pendiente Docs').length;
    const scheduled = filteredProcedures.filter(p => p.status === 'Programado').length;
    const totalValue = filteredProcedures.reduce((acc, p) => acc + p.value, 0);
    const completedValue = filteredProcedures.filter(p => p.status === 'Completado').reduce((acc, p) => acc + p.value, 0);

    const byStatus: Record<string, number> = {};
    const byDoctor: Record<string, { count: number; value: number }> = {};
    const byCenter: Record<string, number> = {};

    filteredProcedures.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;

      const doc = radiologists.find(r => r.id === p.radiologistId);
      const docName = doc ? `Dr. ${doc.lastName}` : 'Sin asignar';
      if (!byDoctor[docName]) byDoctor[docName] = { count: 0, value: 0 };
      byDoctor[docName].count++;
      byDoctor[docName].value += p.value;

      const center = p.clinicalCenter || 'Sin sede';
      byCenter[center] = (byCenter[center] || 0) + 1;
    });

    return { total, completed, pending, scheduled, totalValue, completedValue, byStatus, byDoctor, byCenter };
  }, [filteredProcedures, radiologists]);

  // Pagination
  const totalPages = Math.ceil(filteredProcedures.length / itemsPerPage);
  const paginatedProcedures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProcedures.slice(start, start + itemsPerPage);
  }, [filteredProcedures, currentPage, itemsPerPage]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedProcedures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProcedures.map(p => p.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchStatusChange = async () => {
    if (!batchStatus) return;
    for (const id of selectedIds) {
      await updateProcedure(id, { status: batchStatus as ProcedureStatus });
    }
    setSelectedIds(new Set());
    setBatchStatus('');
  };

  const handleBatchDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} procedimientos?`)) return;
    for (const id of selectedIds) {
      await deleteProcedure(id);
    }
    setSelectedIds(new Set());
  };

  const exportToCSV = () => {
    const headers = ['RUT', 'Paciente', 'Procedimiento', 'Fecha', 'Médico', 'Sede', 'Estado', 'Valor'];
    const rows = filteredProcedures.map(p => {
      const doctor = radiologists.find(r => r.id === p.radiologistId);
      return [
        p.patientRut,
        p.patientName,
        p.procedureType,
        p.scheduledDate || 'Sin programar',
        doctor ? `Dr. ${doctor.lastName}` : 'Sin asignar',
        p.clinicalCenter || 'Sin sede',
        p.status,
        p.value
      ];
    });
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procedimientos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setDoctorFilter('All');
    setCenterFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const activeFiltersCount = [searchTerm, statusFilter !== 'All', doctorFilter !== 'All', centerFilter !== 'All', dateFrom, dateTo].filter(Boolean).length;

  const getDocCompletionPercent = (proc: ProcedureEntry) => {
    if (!proc.requirements || proc.requirements.length === 0) return 100;
    const completed = proc.requirements.filter(r => r.isCompleted).length;
    return Math.round((completed / proc.requirements.length) * 100);
  };

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Notifications Alert */}
      {totalNotifications > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Atención requerida</p>
              <p className="text-sm text-amber-600 dark:text-amber-300">
                {notifications.pendingDocs > 0 && `${notifications.pendingDocs} pendientes de documentación`}
                {notifications.pendingDocs > 0 && notifications.upcoming24h > 0 && ' • '}
                {notifications.upcoming24h > 0 && `${notifications.upcoming24h} procedimientos en las próximas 24h`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('Pendiente Docs')}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            Ver pendientes
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            INTERVENCIONISMO - Gestión de Procedimientos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredProcedures.length} de {procedures.length} procedimientos
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium border-x border-slate-300 dark:border-slate-600 ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Calendario
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'stats' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Estadísticas
            </button>
          </div>

          <button onClick={exportToCSV} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Reporte de Procedimientos - AMIS</h1>
        <p className="text-sm text-slate-600">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
      </div>

      {/* Search & Filters */}
      {viewMode !== 'stats' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 print:hidden">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por RUT, nombre o procedimiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-300 dark:border-slate-600'}`}
            >
              <Filter className="w-4 h-4" /> Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm">
                <option value="All">Todos los estados</option>
                <option value="Pendiente Docs">Pendiente Docs</option>
                <option value="Listo">Listo</option>
                <option value="Programado">Programado</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm">
                <option value="All">Todos los médicos</option>
                {radiologists.map(r => <option key={r.id} value={r.id}>Dr. {r.lastName}</option>)}
              </select>
              <select value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm">
                <option value="All">Todas las sedes</option>
                {centers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm" />
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2">
                  <X className="w-4 h-4" /> Limpiar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && viewMode === 'table' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between print:hidden">
          <span className="font-medium text-blue-800 dark:text-blue-200">{selectedIds.size} seleccionados</span>
          <div className="flex items-center gap-3">
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value as ProcedureStatus)}
              className="px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
            >
              <option value="">Cambiar estado a...</option>
              <option value="Pendiente Docs">Pendiente Docs</option>
              <option value="Listo">Listo</option>
              <option value="Programado">Programado</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <button
              onClick={handleBatchStatusChange}
              disabled={!batchStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              Aplicar
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-blue-100 rounded-lg">
              <X className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left w-12 print:hidden">
                    <input type="checkbox" checked={selectedIds.size === paginatedProcedures.length && paginatedProcedures.length > 0} onChange={handleSelectAll} className="rounded border-slate-300" />
                  </th>
                  <TableHeader label="RUT" field="patientRut" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <TableHeader label="Paciente" field="patientName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <TableHeader label="Procedimiento" field="procedureType" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <TableHeader label="Fecha" field="scheduledDate" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Médico</th>
                  <TableHeader label="Sede" field="clinicalCenter" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Docs</th>
                  <TableHeader label="Estado" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedProcedures.map((proc, idx) => {
                  const doctor = radiologists.find(r => r.id === proc.radiologistId);
                  const docPercent = getDocCompletionPercent(proc);
                  return (
                    <tr key={proc.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                      <td className="px-4 py-3 print:hidden">
                        <input type="checkbox" checked={selectedIds.has(proc.id)} onChange={() => handleSelectOne(proc.id)} className="rounded border-slate-300" />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{proc.patientRut}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {proc.patientName}
                          {proc.takesAnticoagulants && <AlertTriangle className="w-4 h-4 text-amber-500" title="Anticoagulantes" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{proc.procedureType || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {proc.scheduledDate ? new Date(proc.scheduledDate).toLocaleDateString('es-CL') : 'Sin programar'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{doctor ? `Dr. ${doctor.lastName}` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{proc.clinicalCenter || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${docPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {docPercent}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={proc.status} /></td>
                      <td className="px-4 py-3 print:hidden">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedProcedure(proc)} className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600" title="Ver detalles">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingProcedure(proc)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProcedures.length)} de {filteredProcedures.length}</span>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800">
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarViewComponent
          procedures={filteredProcedures}
          radiologists={radiologists}
          currentDate={calendarDate}
          setCurrentDate={setCalendarDate}
          viewType={calendarView}
          setViewType={setCalendarView}
          onSelectProcedure={setSelectedProcedure}
          isDark={isDark}
        />
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <StatsViewComponent stats={stats} isDark={isDark} radiologists={radiologists} />
      )}

      {/* Detail Panel */}
      {selectedProcedure && (
        <DetailPanel
          procedure={selectedProcedure}
          doctor={radiologists.find(r => r.id === selectedProcedure.radiologistId)}
          onClose={() => setSelectedProcedure(null)}
          onToggleRequirement={async (reqId) => {
            await toggleRequirement(selectedProcedure.id, reqId);
            const updated = procedures.find(p => p.id === selectedProcedure.id);
            if (updated) setSelectedProcedure(updated);
          }}
          isDark={isDark}
        />
      )}

      {/* New/Edit Form Modal */}
      {(showNewModal || editingProcedure) && (
        <ProcedureFormModal
          isDark={isDark}
          procedure={editingProcedure}
          radiologists={radiologists}
          catalog={catalog}
          centers={centers}
          onClose={() => {
            setShowNewModal(false);
            setEditingProcedure(null);
          }}
          onSubmit={async (data) => {
            if (editingProcedure) {
              await updateProcedure(editingProcedure.id, data);
            } else {
              await addProcedure(data);
            }
            setShowNewModal(false);
            setEditingProcedure(null);
          }}
        />
      )}
    </div>
  );
};

// === SUB COMPONENTS ===

const TableHeader: React.FC<{
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}> = ({ label, field, sortField, sortDirection, onSort }) => (
  <th onClick={() => onSort(field)} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
    <div className="flex items-center gap-2">
      {label}
      {sortField === field && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
    </div>
  </th>
);

const StatusBadge: React.FC<{ status: ProcedureStatus }> = ({ status }) => {
  const styles: Record<ProcedureStatus, string> = {
    'Pendiente Docs': 'bg-amber-100 text-amber-700 border-amber-300',
    'Listo': 'bg-green-100 text-green-700 border-green-300',
    'Programado': 'bg-blue-100 text-blue-700 border-blue-300',
    'Completado': 'bg-slate-100 text-slate-700 border-slate-300',
    'Cancelado': 'bg-red-100 text-red-700 border-red-300'
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>{status}</span>;
};

// Calendar Component
const CalendarViewComponent: React.FC<{
  procedures: ProcedureEntry[];
  radiologists: Employee[];
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  viewType: 'month' | 'week' | 'day';
  setViewType: (v: 'month' | 'week' | 'day') => void;
  onSelectProcedure: (p: ProcedureEntry) => void;
  isDark: boolean;
}> = ({ procedures, radiologists, currentDate, setCurrentDate, viewType, setViewType, onSelectProcedure, isDark }) => {
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewType === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const days = useMemo(() => {
    if (viewType === 'day') return [currentDate];
    if (viewType === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startGrid = new Date(start);
    startGrid.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 35 }, (_, i) => { const d = new Date(startGrid); d.setDate(startGrid.getDate() + i); return d; });
  }, [currentDate, viewType]);

  const getProceduresForDay = (day: Date) => procedures.filter(p => p.scheduledDate && new Date(p.scheduledDate).toDateString() === day.toDateString());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setViewType(v)} className={`px-3 py-1 text-sm ${viewType === v ? 'bg-blue-600 text-white' : ''}`}>
                {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Hoy</button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className={`grid gap-1 ${viewType === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
        {viewType !== 'day' && ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
        ))}
        {days.map((day, i) => {
          const procs = getProceduresForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isOtherMonth = viewType === 'month' && day.getMonth() !== currentDate.getMonth();
          return (
            <div key={i} className={`min-h-[100px] p-2 border border-slate-200 dark:border-slate-700 rounded ${isOtherMonth ? 'opacity-30' : ''} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>{day.getDate()}</div>
              <div className="mt-1 space-y-1">
                {procs.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => onSelectProcedure(p)} className="text-xs p-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 truncate cursor-pointer hover:bg-blue-200">
                    {p.patientName.split(' ')[0]}
                  </div>
                ))}
                {procs.length > 3 && <div className="text-xs text-slate-500">+{procs.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Stats Component
const StatsViewComponent: React.FC<{
  stats: any;
  isDark: boolean;
  radiologists: Employee[];
}> = ({ stats, isDark }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Procedimientos" value={stats.total} icon={<Activity className="w-6 h-6" />} color="blue" />
        <KPICard label="Pendientes Docs" value={stats.pending} icon={<FileText className="w-6 h-6" />} color="amber" />
        <KPICard label="Completados" value={stats.completed} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
        <KPICard label="Facturación Total" value={`$${stats.totalValue.toLocaleString('es-CL')}`} icon={<DollarSign className="w-6 h-6" />} color="indigo" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="text-lg font-bold mb-4">Por Estado</h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center gap-3">
                <StatusBadge status={status as ProcedureStatus} />
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="text-lg font-bold mb-4">Por Médico</h3>
          <div className="space-y-3">
            {Object.entries(stats.byDoctor).slice(0, 5).map(([name, data]: [string, any]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm w-32 truncate">{name}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: `${(data.count / stats.total) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-20 text-right">${data.value.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-lg border lg:col-span-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="text-lg font-bold mb-4">Por Sede Clínica</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byCenter).map(([center, count]: [string, any]) => (
              <div key={center} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-slate-500 mt-1">{center}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

// Detail Panel with Documents
const DetailPanel: React.FC<{
  procedure: ProcedureEntry;
  doctor: any;
  onClose: () => void;
  onToggleRequirement: (reqId: string) => void;
  isDark: boolean;
}> = ({ procedure, doctor, onClose, onToggleRequirement, isDark }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end print:hidden" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-2xl h-full overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-white'} shadow-2xl`}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">Detalles del Procedimiento</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Paciente</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500">Nombre</p><p className="font-medium">{procedure.patientName}</p></div>
              <div><p className="text-slate-500">RUT</p><p className="font-mono font-medium">{procedure.patientRut}</p></div>
              <div><p className="text-slate-500">Teléfono</p><p className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{procedure.patientPhone}</p></div>
              <div><p className="text-slate-500">Email</p><p className="font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{procedure.patientEmail}</p></div>
              {procedure.takesAnticoagulants && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded">
                    <AlertTriangle className="w-4 h-4" /><span className="font-medium">Toma anticoagulantes</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Procedure Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Procedimiento</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500">Procedimiento</p><p className="font-medium">{procedure.procedureType}</p></div>
              <div><p className="text-slate-500">Modalidad</p><p className="font-medium">{procedure.modality}</p></div>
              <div><p className="text-slate-500">Fecha</p><p className="font-medium">{procedure.scheduledDate ? new Date(procedure.scheduledDate).toLocaleDateString('es-CL') : 'Sin programar'}</p></div>
              <div><p className="text-slate-500">Estado</p><StatusBadge status={procedure.status} /></div>
              <div><p className="text-slate-500">Médico</p><p className="font-medium">{doctor ? `Dr. ${doctor.lastName}` : 'Sin asignar'}</p></div>
              <div><p className="text-slate-500">Sede</p><p className="font-medium">{procedure.clinicalCenter || 'Sin sede'}</p></div>
              <div><p className="text-slate-500">Valor</p><p className="font-medium">${procedure.value.toLocaleString('es-CL')}</p></div>
            </div>
          </div>

          {/* Documents Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documentación Requerida
              <span className="ml-auto text-xs font-normal">
                {procedure.requirements?.filter(r => r.isCompleted).length || 0} / {procedure.requirements?.length || 0} completados
              </span>
            </h4>
            <div className="space-y-2">
              {(!procedure.requirements || procedure.requirements.length === 0) ? (
                <p className="text-sm text-slate-500 text-center py-4">Sin documentos requeridos</p>
              ) : (
                procedure.requirements.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onToggleRequirement(req.id)} className={`w-6 h-6 rounded border-2 flex items-center justify-center ${req.isCompleted ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300'}`}>
                        {req.isCompleted && <Check className="w-4 h-4" />}
                      </button>
                      <span className={`text-sm ${req.isCompleted ? 'line-through text-slate-400' : ''}`}>{req.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.fileUrl ? (
                        <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                          <Eye className="w-4 h-4" /> Ver
                        </a>
                      ) : (
                        <button className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1">
                          <Upload className="w-4 h-4" /> Subir
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Procedure Form Modal
const ProcedureFormModal: React.FC<{
  isDark: boolean;
  procedure: ProcedureEntry | null;
  radiologists: Employee[];
  catalog: any[];
  centers: string[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ isDark, procedure, radiologists, catalog, centers, onClose, onSubmit }) => {
  const [patientName, setPatientName] = useState(procedure?.patientName || '');
  const [patientRut, setPatientRut] = useState(procedure?.patientRut || '');
  const [patientPhone, setPatientPhone] = useState(procedure?.patientPhone || '');
  const [patientEmail, setPatientEmail] = useState(procedure?.patientEmail || '');
  const [patientInsurance, setPatientInsurance] = useState(procedure?.patientInsurance || '');
  const [takesAnticoagulants, setTakesAnticoagulants] = useState(procedure?.takesAnticoagulants || false);
  const [procedureType, setProcedureType] = useState(procedure?.procedureType || '');
  const [radiologistId, setRadiologistId] = useState(procedure?.radiologistId || '');
  const [clinicalCenter, setClinicalCenter] = useState(procedure?.clinicalCenter || '');
  const [scheduledDate, setScheduledDate] = useState(procedure?.scheduledDate || '');
  const [status, setStatus] = useState<ProcedureStatus>(procedure?.status || 'Pendiente Docs');

  const selectedCatalogItem = catalog.find(c => c.name === procedureType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientName,
      patientRut,
      patientPhone,
      patientEmail,
      patientInsurance,
      takesAnticoagulants,
      procedureType,
      modality: selectedCatalogItem?.defaultModality || 'US',
      value: selectedCatalogItem?.baseValue || 0,
      radiologistId,
      clinicalCenter,
      scheduledDate,
      status,
      referringPhysician: 'Manual',
      requirements: selectedCatalogItem?.requiredDocs?.map((doc: string, i: number) => ({
        id: `req-${i}`,
        name: doc,
        isCompleted: false
      })) || []
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${isDark ? 'bg-slate-900' : 'bg-white'} shadow-2xl`}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">{procedure ? 'Editar Procedimiento' : 'Nuevo Paciente'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre del Paciente *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RUT *</label>
              <input
                type="text"
                required
                value={patientRut}
                onChange={e => setPatientRut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={patientEmail}
                onChange={e => setPatientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Previsión</label>
              <input
                type="text"
                value={patientInsurance}
                onChange={e => setPatientInsurance(e.target.value)}
                placeholder="Fonasa, Isapre..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={takesAnticoagulants}
                  onChange={e => setTakesAnticoagulants(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm">¿Toma anticoagulantes?</span>
                {takesAnticoagulants && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </label>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Procedimiento *</label>
              <select
                required
                value={procedureType}
                onChange={e => setProcedureType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="">Seleccionar...</option>
                {catalog.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.name}>{c.name} (${c.baseValue.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Médico Responsable</label>
              <select
                value={radiologistId}
                onChange={e => setRadiologistId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="">Sin asignar</option>
                {radiologists.map(r => (
                  <option key={r.id} value={r.id}>Dr. {r.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sede Clínica</label>
              <input
                type="text"
                list="centers-list"
                value={clinicalCenter}
                onChange={e => setClinicalCenter(e.target.value)}
                placeholder="Ej. Hospital Regional"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
              <datalist id="centers-list">
                {centers.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Programada</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProcedureStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="Pendiente Docs">Pendiente Docs</option>
                <option value="Listo">Listo</option>
                <option value="Programado">Programado</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {procedure ? 'Guardar Cambios' : 'Crear Procedimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProceduresModule;
