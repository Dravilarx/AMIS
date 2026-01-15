
import React, { useState, useMemo } from 'react';
import { Search, Layers, Calendar, Zap, Trash2, ShieldAlert, CircleSlash, HeartPulse, Plane, CheckCircle, Eye, Edit2, LayoutGrid, Table } from 'lucide-react';
import { Employee } from '../../../types';

interface Props {
  employees: Employee[];
  isDark: boolean;
  onAnalyze: (emp: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeDirectory: React.FC<Props> = ({ employees, isDark, onAnalyze, onDelete }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter(e => e.role === roleFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    return filtered;
  }, [employees, searchTerm, roleFilter, statusFilter]);

  const roles = [...new Set(employees.map(e => e.role))];
  const statuses = [...new Set(employees.map(e => e.status))];

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'Activo':
        return <span className="bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><CheckCircle className="w-3 h-3" /> Activo</span>;
      case 'Licencia Médica':
        return <span className="bg-amber-500/10 text-amber-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><HeartPulse className="w-3 h-3" /> Licencia</span>;
      case 'Vacaciones':
        return <span className="bg-blue-500/10 text-blue-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><Plane className="w-3 h-3" /> Vacaciones</span>;
      case 'Suspendido':
        return <span className="bg-red-500/10 text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><ShieldAlert className="w-3 h-3" /> Suspendido</span>;
      case 'Renuncia':
        return <span className="bg-slate-500/10 text-slate-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><CircleSlash className="w-3 h-3" /> Renuncia</span>;
      case 'Baja Temporal':
        return <span className="bg-red-950/10 text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><Trash2 className="w-3 h-3" /> Baja Temp.</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className={`p-6 rounded-[32px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-4 py-3 rounded-2xl border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
          >
            <option value="All">Todos los roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-3 rounded-2xl border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
          >
            <option value="All">Todos los estados</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* View Toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-3 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800'}`}
              title="Vista Tabla"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-3 border-l border-slate-300 dark:border-slate-600 ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800'}`}
              title="Vista Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className={`rounded-[32px] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Colaborador</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Rol</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Departamento</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Grupo</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Ingreso</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">KPI</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Estado</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest opacity-40">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {filteredEmployees.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    className={`transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx % 2 === 0 ? '' : isDark ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-inner shrink-0">
                          {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{emp.firstName[0]}{emp.lastName[0]}</span>}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[9px] opacity-40 font-bold">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-blue-600/10 text-blue-600 rounded-lg text-[9px] font-black uppercase">{emp.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold opacity-60">{emp.department}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Layers className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold uppercase">{emp.group || 'Sin Grupo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm font-bold">{new Date(emp.joinDate).getFullYear()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${emp.performance > 90 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {emp.performance}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(emp.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAnalyze(emp)}
                          className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title="Analizar IA"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(emp.id)}
                          className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className="text-sm opacity-40 font-bold">Mostrando {filteredEmployees.length} de {employees.length} colaboradores</span>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className={`p-6 rounded-[32px] border transition-all hover:shadow-xl group ${isDark ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500'}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg uppercase overflow-hidden shadow-inner shrink-0">
                  {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{emp.firstName[0]}{emp.lastName[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black uppercase tracking-tight truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md inline-block mt-1">{emp.role}</p>
                  {emp.subSpecialty && <p className="text-[9px] opacity-60 font-bold uppercase mt-1 italic truncate">{emp.subSpecialty}</p>}
                </div>
                {getStatusBadge(emp.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <p className="text-[8px] font-black uppercase opacity-40 mb-1">Departamento</p>
                  <p className="text-[10px] font-black uppercase truncate">{emp.department}</p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <p className="text-[8px] font-black uppercase opacity-40 mb-1">Grupo</p>
                  <p className="text-[10px] font-black uppercase">{emp.group || '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${emp.performance > 90 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    {emp.performance}%
                  </div>
                  <span className="text-[8px] font-black uppercase opacity-30">KPI</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onAnalyze(emp)} className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Zap className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(emp.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
