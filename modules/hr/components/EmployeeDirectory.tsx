
import React from 'react';
import { Search, Layers, Calendar, Zap, Trash2, ShieldAlert, CircleSlash, HeartPulse, Plane, CheckCircle } from 'lucide-react';
import { Employee } from '../../../types';

interface Props {
  employees: Employee[];
  isDark: boolean;
  onAnalyze: (emp: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeDirectory: React.FC<Props> = ({ employees, isDark, onAnalyze, onDelete }) => {
  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'Activo':
        return <span className="bg-emerald-500/10 text-emerald-500 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"><CheckCircle className="w-2.5 h-2.5" /> Activo</span>;
      case 'Licencia Médica':
        return <span className="bg-amber-500/10 text-amber-500 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"><HeartPulse className="w-2.5 h-2.5" /> Licencia</span>;
      case 'Vacaciones':
        return <span className="bg-blue-500/10 text-blue-500 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"><Plane className="w-2.5 h-2.5" /> Vacaciones</span>;
      case 'Suspendido':
        return <span className="bg-red-500/10 text-red-500 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"><ShieldAlert className="w-2.5 h-2.5" /> Suspendido</span>;
      case 'Renuncia':
        return <span className="bg-slate-500/10 text-slate-500 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"><CircleSlash className="w-2.5 h-2.5" /> Renuncia</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className={`p-10 rounded-[40px] border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <h3 className="text-xl font-black uppercase tracking-tighter">Directorio Maestro Staff</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text" 
            placeholder="Filtrar staff..." 
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs outline-none w-full sm:w-64" 
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest opacity-30 border-b border-slate-100 dark:border-slate-800">
              <th className="pb-4 px-4">Staff / Estado</th>
              <th className="pb-4 px-4">Org</th>
              <th className="pb-4 px-4">KPI</th>
              <th className="pb-4 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map(emp => (
              <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-6 px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-inner shrink-0">
                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <span className="opacity-40">{emp.firstName[0]}{emp.lastName[0]}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                        {getStatusBadge(emp.status)}
                      </div>
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md inline-block mt-0.5">{emp.role}</p>
                      {emp.subSpecialty && <p className="text-[9px] opacity-60 font-bold uppercase mt-1 italic">{emp.subSpecialty}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tight">{emp.department}</p>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <Layers className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase">{emp.group || 'Sin Grupo'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-bold uppercase">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(emp.joinDate).getFullYear()}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-grow h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${emp.performance > 90 ? 'bg-emerald-500' : 'bg-blue-600'} rounded-full transition-all`} style={{ width: `${emp.performance}%` }} />
                      </div>
                      <span className="text-[10px] font-black">{emp.performance}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {emp.tags?.map((t, i) => (
                        <span key={i} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 opacity-50">{t}</span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAnalyze(emp)} title="Analizar IA" className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"><Zap className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(emp.id)} title="Eliminar Registro" className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDirectory;
