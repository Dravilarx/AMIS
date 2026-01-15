import {
  AlertTriangle, ArrowDown, ArrowUp, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Download, Edit2, Eye, FileText, Filter, Info, Mail, Phone, Plus,
  Printer, Search, Trash2, Upload, User, X, Check, Clock, Building2,
  AlertCircle, FileSpreadsheet, Save, Stethoscope, MapPin, Activity,
  BarChart3, Users, DollarSign, TrendingUp, Bell, FileUp, CheckCircle2, Sparkles,
  MessageCircle, Copy, Send
} from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useEmployees } from '../hooks/useEmployees';
import { useProcedures } from '../hooks/useProcedures';
import { useInstructions } from '../hooks/useInstructions';
import { ProcedureStatus, UserSession, ProcedureEntry, Employee, ProcedureInstructions } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

type SortField = 'patientName' | 'patientRut' | 'procedureType' | 'scheduledDate' | 'status' | 'clinicalCenter';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'calendar' | 'stats' | 'instructions';

const ProceduresModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { employees } = useEmployees();
  const { procedures, catalog, addProcedure, updateProcedure, deleteProcedure, toggleRequirement } = useProcedures();
  const { instructions, getInstructionForProcedure, addInstruction, updateInstruction, deleteInstruction } = useInstructions();

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
  const [editingInstruction, setEditingInstruction] = useState<ProcedureInstructions | null>(null);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

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
              className={`px-3 py-2 text-sm font-medium border-r border-slate-300 dark:border-slate-600 ${viewMode === 'stats' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Estadísticas
            </button>
            <button
              onClick={() => setViewMode('instructions')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg ${viewMode === 'instructions' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Indicaciones</span>
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

      {/* Instructions Management View */}
      {viewMode === 'instructions' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Header */}
          <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Repositorio de Indicaciones</h3>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Gestiona las instrucciones pre-procedimiento para pacientes</p>
                </div>
              </div>
              <button
                onClick={() => { setEditingInstruction(null); setShowInstructionModal(true); }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Nueva Indicación
              </button>
            </div>

            {/* Instructions List */}
            <div className="grid gap-4">
              {instructions.length === 0 ? (
                <div className="py-16 text-center opacity-30">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No hay indicaciones configuradas</p>
                  <p className="text-xs mt-2">Presione "Nueva Indicación" para comenzar</p>
                </div>
              ) : (
                instructions.map((inst) => (
                  <div
                    key={inst.id}
                    className={`p-6 rounded-[32px] border transition-all hover:shadow-xl group ${isDark ? 'bg-slate-800/50 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-100 hover:border-emerald-500'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h4 className="text-sm font-black uppercase tracking-tight">{inst.procedureType}</h4>
                          {inst.clinicalCenter ? (
                            <span className="px-2 py-1 bg-purple-600/10 text-purple-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {inst.clinicalCenter}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-500/10 text-slate-500 rounded-lg text-[8px] font-black uppercase">Genérico</span>
                          )}
                          {inst.modality && (
                            <span className="px-2 py-1 bg-blue-600/10 text-blue-600 rounded-lg text-[8px] font-black uppercase">{inst.modality}</span>
                          )}
                          {inst.anticoagulantWarning && (
                            <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Anticoag.
                            </span>
                          )}
                          {inst.fastingHours && (
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[8px] font-black uppercase">
                              Ayuno {inst.fastingHours}h
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium opacity-60 line-clamp-2">{inst.shortInstructions}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingInstruction(inst); setShowInstructionModal(true); }}
                          className="p-3 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => { if (confirm('¿Eliminar esta indicación?')) await deleteInstruction(inst.id); }}
                          className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
          instructions={getInstructionForProcedure(selectedProcedure.procedureType, selectedProcedure.clinicalCenter)}
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

      {/* Instruction Form Modal */}
      {showInstructionModal && (
        <InstructionFormModal
          isDark={isDark}
          instruction={editingInstruction}
          catalog={catalog}
          centers={centers}
          onClose={() => {
            setShowInstructionModal(false);
            setEditingInstruction(null);
          }}
          onSubmit={async (data) => {
            if (editingInstruction) {
              await updateInstruction(editingInstruction.id, data);
            } else {
              await addInstruction(data);
            }
            setShowInstructionModal(false);
            setEditingInstruction(null);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Procedimientos" value={stats.total} icon={<Activity className="w-6 h-6" />} color="blue" />
        <KPICard label="Pendientes Docs" value={stats.pending} icon={<FileText className="w-6 h-6" />} color="amber" />
        <KPICard label="Completados" value={stats.completed} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
        <KPICard label="Facturación Estimada" value={`$${stats.totalValue.toLocaleString('es-CL')}`} icon={<DollarSign className="w-6 h-6" />} color="indigo" />
      </div>

      {/* Charts & Distribution */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Status Distribution */}
        <div className={`lg:col-span-12 p-10 rounded-[48px] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Distribución Operativa</h3>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Carga de trabajo por estado y médico</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Estado de Pacientes</h4>
              <div className="space-y-6">
                {Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
                  <div key={status} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <StatusBadge status={status as ProcedureStatus} />
                      <span className="text-xs font-black opacity-100">{count} <span className="opacity-30">({((count / stats.total) * 100).toFixed(0)}%)</span></span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-blue-600 h-full shadow-lg shadow-blue-500/30 transition-all duration-1000 ease-out group-hover:brightness-110"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">Top Médicos (Productividad)</h4>
              <div className="space-y-5">
                {Object.entries(stats.byDoctor).slice(0, 5).map(([name, data]: [string, any]) => (
                  <div key={name} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-tight truncate w-32">{name}</span>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-600/10 px-3 py-1 rounded-full border border-indigo-600/20">${data.value.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="bg-indigo-600 h-full shadow-lg shadow-indigo-500/30 transition-all duration-1000 ease-out"
                        style={{ width: `${(data.count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Centers */}
        <div className={`lg:col-span-12 p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Cobertura por Sede</h3>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Presencia clínica y volumen por centro</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(stats.byCenter).map(([center, count]: [string, any]) => (
              <div key={center} className="group p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800 text-center transition-all hover:scale-105 hover:shadow-xl">
                <div className="text-3xl font-black text-blue-600 mb-1">{count}</div>
                <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 group-hover:text-blue-500 transition-colors">{center}</div>
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
    blue: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    amber: 'bg-amber-600/10 text-amber-600 border-amber-600/20',
    green: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20',
    indigo: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm transition-all hover:shadow-2xl hover:scale-105 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:rotate-12 ${colors[color]}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-black tracking-tighter">{value}</p>
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
  instructions?: ProcedureInstructions;
}> = ({ procedure, doctor, onClose, onToggleRequirement, isDark, instructions }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to normalize phone number for WhatsApp (remove spaces, dashes, + prefix)
  const normalizePhone = (phone: string): string => {
    return phone.replace(/[\s\-\+\(\)]/g, '').replace(/^0/, '56');
  };

  // Helper to personalize instructions with patient data
  const personalizeInstructions = (text: string): string => {
    return text
      .replace(/{NOMBRE_PACIENTE}/g, procedure.patientName)
      .replace(/{FECHA_PROCEDIMIENTO}/g, procedure.scheduledDate ? new Date(procedure.scheduledDate).toLocaleDateString('es-CL') : 'Por confirmar')
      .replace(/{PROCEDIMIENTO}/g, procedure.procedureType);
  };

  const handleSendEmail = () => {
    if (!instructions) return;
    const subject = `Indicaciones para su ${procedure.procedureType} - AMIS`;
    const body = personalizeInstructions(instructions.fullInstructions);
    window.open(`mailto:${procedure.patientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSendWhatsApp = () => {
    if (!instructions) return;
    const phone = normalizePhone(procedure.patientPhone);
    const message = personalizeInstructions(instructions.shortInstructions);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyInstructions = async () => {
    if (!instructions) return;
    try {
      await navigator.clipboard.writeText(personalizeInstructions(instructions.fullInstructions));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const analyzeRisk = async () => {
    setIsAnalyzing(true);
    try {
      const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `Analiza el riesgo clínico del siguiente procedimiento:
        PACIENTE: ${procedure.patientName}
        PROCEDIMIENTO: ${procedure.procedureType}
        MODALIDAD: ${procedure.modality}
        ANTICOAGULANTES: ${procedure.takesAnticoagulants ? 'SÍ' : 'NO'}
        DOCUMENTOS COMPLETADOS: ${procedure.requirements?.filter(r => r.isCompleted).map(r => r.name).join(', ') || 'Ninguno'}
        DOCUMENTOS PENDIENTES: ${procedure.requirements?.filter(r => !r.isCompleted).map(r => r.name).join(', ') || 'Ninguno'}
        
        Tu tarea es:
        1. Evaluar si es SEGURO proceder con la información actual.
        2. Si toma anticoagulantes, dar advertencias específicas.
        3. Validar si los documentos faltantes son CRÍTICOS para este tipo de intervención.
        4. Dar una recomendación final concisa (Máximo 3 párrafos).
        Usa un tono profesional médico de AMIS.`;

      const result = await model.generateContent(prompt);
      setAiAnalysis(result.response.text());
    } catch (err) {
      console.error('Error in AI Analysis:', err);
      setAiAnalysis("Error al conectar con el Motor de Inteligencia Clínica.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300 print:hidden" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-3xl h-full overflow-y-auto ${isDark ? 'bg-slate-950 border-l border-slate-800' : 'bg-white shadow-2xl'} shadow-2xl relative`}>
        <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Expediente Clínico</h3>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Ref: {procedure.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-10 space-y-10">
          {/* AI Analysis Section */}
          <div className={`p-8 rounded-[48px] border transition-all ${isDark ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">Motor de Riesgo IA</h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Análisis clínico asistido por Gemini</p>
                </div>
              </div>
              <button
                onClick={analyzeRisk}
                disabled={isAnalyzing}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20
                  ${isAnalyzing ? 'bg-slate-200 opacity-50' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95'}`}
              >
                {isAnalyzing ? <Clock className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {isAnalyzing ? 'Analizando...' : 'Consultar Riesgo IA'}
              </button>
            </div>

            {aiAnalysis ? (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <div className="p-6 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-indigo-500/10 text-xs leading-relaxed font-medium">
                    {aiAnalysis.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[11px] font-bold opacity-30 uppercase tracking-widest">Presione el botón para iniciar la evaluación pre-operatoria</p>
              </div>
            )}
          </div>

          {/* Patient Instructions Section */}
          {instructions ? (
            <div className={`p-8 rounded-[48px] border transition-all ${isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tighter">Indicaciones al Paciente</h4>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">{instructions.procedureType}</p>
                  </div>
                </div>
              </div>

              {/* Instructions Preview */}
              <div className="mb-6 p-6 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-emerald-500/10">
                <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-3">Vista Previa (Versión Corta)</p>
                <p className="text-xs leading-relaxed font-medium">{personalizeInstructions(instructions.shortInstructions)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 min-w-[140px] px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Mail className="w-4 h-4" /> Enviar por Email
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 min-w-[140px] px-6 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  onClick={handleCopyInstructions}
                  className={`flex-1 min-w-[140px] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border
                    ${copied
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '¡Copiado!' : 'Copiar Texto'}
                </button>
              </div>

              {instructions.anticoagulantWarning && procedure.takesAnticoagulants && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center gap-4">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Las indicaciones incluyen advertencia sobre anticoagulantes</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-8 rounded-[48px] border transition-all ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">Indicaciones al Paciente</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">No hay indicaciones configuradas para: {procedure.procedureType}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Patient Info */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[40px] p-8 shadow-inner">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><User className="w-4 h-4" /> Datos del Paciente</h4>
              <div className="space-y-4">
                <div className="group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Nombre Completo</p>
                  <p className="text-sm font-black uppercase">{procedure.patientName}</p>
                </div>
                <div className="group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">RUT Identificación</p>
                  <p className="text-sm font-mono font-black">{procedure.patientRut}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Contacto</p>
                    <p className="text-xs font-black flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 opacity-40" />{procedure.patientPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Correo</p>
                    <p className="text-xs font-black truncate flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 opacity-40" />{procedure.patientEmail}</p>
                  </div>
                </div>
                {procedure.takesAnticoagulants && (
                  <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center gap-4 animate-pulse">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Alerta de Riesgo</p>
                      <p className="text-[11px] font-black">PACIENTE TOMA ANTICOAGULANTES</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Procedure Info */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[40px] p-8 shadow-inner">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Detalle Intervención</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operación</p>
                    <p className="text-sm font-black uppercase">{procedure.procedureType}</p>
                  </div>
                  <StatusBadge status={procedure.status} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Modalidad</p>
                    <p className="text-xs font-black uppercase tracking-tighter">{procedure.modality}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha Programada</p>
                    <p className="text-xs font-black uppercase">{procedure.scheduledDate ? new Date(procedure.scheduledDate).toLocaleDateString('es-CL') : 'PENDIENTE'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Equipo Médico Asignado</p>
                  <p className="text-[11px] font-black uppercase tracking-tight">{doctor ? `Dr. ${doctor.lastName}, ${doctor.firstName}` : 'SIN ASIGNAR'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sede Clínica</p>
                  <p className="text-[11px] font-black uppercase tracking-tight">{procedure.clinicalCenter || 'SIN SEDE ASIGNADA'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Checklist */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[48px] p-10 shadow-inner">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tighter">Protocolo de Documentación</h4>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Cumplimiento: {procedure.requirements?.filter(r => r.isCompleted).length || 0} de {procedure.requirements?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {(!procedure.requirements || procedure.requirements.length === 0) ? (
                <div className="py-12 text-center opacity-20">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin documentos requeridos</p>
                </div>
              ) : (
                procedure.requirements.map((req) => (
                  <div key={req.id} className={`flex items-center justify-between p-5 rounded-[24px] border transition-all ${req.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg'}`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => onToggleRequirement(req.id)}
                        className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${req.isCompleted ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30 rotate-0' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 rotate-45 hover:rotate-0'}`}
                      >
                        {req.isCompleted ? <Check className="w-6 h-6" /> : <Plus className="w-5 h-5 text-slate-300" />}
                      </button>
                      <div>
                        <span className={`text-[11px] font-black uppercase tracking-tight ${req.isCompleted ? 'text-slate-400' : ''}`}>{req.name}</span>
                        <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${req.isCompleted ? 'text-emerald-500' : 'text-slate-500 opacity-40'}`}>
                          {req.isCompleted ? 'Verificado' : 'Pendiente Carga'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.fileUrl ? (
                        <a href={req.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                          <Eye className="w-5 h-5" />
                        </a>
                      ) : (
                        <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group">
                          <Upload className="w-5 h-5 group-hover:scale-110" />
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

// Instruction Form Modal
const InstructionFormModal: React.FC<{
  isDark: boolean;
  instruction: ProcedureInstructions | null;
  catalog: any[];
  centers: string[];
  onClose: () => void;
  onSubmit: (data: Omit<ProcedureInstructions, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}> = ({ isDark, instruction, catalog, centers, onClose, onSubmit }) => {
  const [procedureType, setProcedureType] = useState(instruction?.procedureType || '');
  const [clinicalCenter, setClinicalCenter] = useState(instruction?.clinicalCenter || '');
  const [modality, setModality] = useState(instruction?.modality || '');
  const [fullInstructions, setFullInstructions] = useState(instruction?.fullInstructions || '');
  const [shortInstructions, setShortInstructions] = useState(instruction?.shortInstructions || '');
  const [anticoagulantWarning, setAnticoagulantWarning] = useState(instruction?.anticoagulantWarning || false);
  const [fastingHours, setFastingHours] = useState(instruction?.fastingHours?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureType.trim() || !fullInstructions.trim() || !shortInstructions.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }
    setIsSubmitting(true);
    try {
      const hours = fastingHours ? parseInt(fastingHours) : undefined;

      await onSubmit({
        procedureType: procedureType.trim(),
        clinicalCenter: clinicalCenter.trim() || undefined,
        modality: modality as any || undefined,
        fullInstructions: fullInstructions.trim(),
        shortInstructions: shortInstructions.trim(),
        anticoagulantWarning,
        fastingHours: (hours !== null && !isNaN(hours as number)) ? hours : undefined
      });
      onClose();
    } catch (err) {
      console.error('Error saving instruction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al guardar la indicación: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[48px] ${isDark ? 'bg-slate-950 border border-slate-800' : 'bg-white shadow-2xl'}`}>
        <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-10 py-8 flex items-center justify-between z-10 rounded-t-[48px]">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">{instruction ? 'Editar Indicación' : 'Nueva Indicación'}</h3>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Instrucciones pre-procedimiento para pacientes</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Procedure Type */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Tipo de Procedimiento *</label>
              <input
                type="text"
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
                placeholder="Ej: Biopsia Hepática"
                list="procedure-types"
                className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors`}
                required
              />
              <datalist id="procedure-types">
                {catalog.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Centro Clínico <span className="opacity-40">(Vacío = Genérico)</span></label>
              <input
                type="text"
                value={clinicalCenter}
                onChange={(e) => setClinicalCenter(e.target.value)}
                placeholder="Ej: Hospital Regional o dejar vacío para todos"
                list="centers-instructions"
                className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors`}
              />
              <datalist id="centers-instructions">
                {centers.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          {/* Modality & Fasting */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Modalidad</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors`}
              >
                <option value="">Sin especificar</option>
                <option value="US">Ecografía (US)</option>
                <option value="TAC">Tomografía (TAC)</option>
                <option value="RM">Resonancia (RM)</option>
                <option value="RX">Radiografía (RX)</option>
                <option value="Fluoro">Fluoroscopía</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Horas de Ayuno</label>
              <input
                type="number"
                value={fastingHours}
                onChange={(e) => setFastingHours(e.target.value)}
                placeholder="Ej: 8"
                min="0"
                max="24"
                className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors`}
              />
            </div>
          </div>

          {/* Anticoagulant Warning */}
          <div className={`p-6 rounded-3xl border flex items-center gap-4 cursor-pointer transition-all ${anticoagulantWarning ? 'bg-rose-500/10 border-rose-500/30' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`} onClick={() => setAnticoagulantWarning(!anticoagulantWarning)}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${anticoagulantWarning ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
              {anticoagulantWarning ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 opacity-40" />}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Advertencia de Anticoagulantes</p>
              <p className="text-[10px] font-medium opacity-50">Marcar si este procedimiento requiere suspensión de anticoagulantes</p>
            </div>
          </div>

          {/* Full Instructions */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Indicaciones Completas (Email) *</label>
            <textarea
              value={fullInstructions}
              onChange={(e) => setFullInstructions(e.target.value)}
              placeholder="Escriba las indicaciones detalladas que se enviarán por correo electrónico..."
              rows={8}
              className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors resize-none`}
              required
            />
            <p className="text-[9px] font-bold opacity-30 mt-2">Puede usar {'{NOMBRE_PACIENTE}'}, {'{FECHA_PROCEDIMIENTO}'}, {'{PROCEDIMIENTO}'} como placeholders.</p>
          </div>

          {/* Short Instructions */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Indicaciones Cortas (WhatsApp) * <span className="opacity-40">({shortInstructions.length}/280 caracteres)</span></label>
            <textarea
              value={shortInstructions}
              onChange={(e) => setShortInstructions(e.target.value.slice(0, 280))}
              placeholder="Versión resumida para WhatsApp (máx 280 caracteres)..."
              rows={3}
              maxLength={280}
              className={`w-full px-6 py-4 rounded-2xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'} outline-none transition-colors resize-none`}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {instruction ? 'Guardar Cambios' : 'Crear Indicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProceduresModule;
