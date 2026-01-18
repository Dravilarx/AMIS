import React, { useState, useMemo } from 'react';
import { CaseRequest, CaseStatus } from '../../../types';
import {
    Search,
    Filter,
    Eye,
    Calendar,
    Building2,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';

interface Props {
    isDark: boolean;
    cases: CaseRequest[];
    onViewCase: (caseId: string) => void;
}

const CasesList: React.FC<Props> = ({ isDark, cases, onViewCase }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<CaseStatus | 'All'>('All');
    const [institutionFilter, setInstitutionFilter] = useState('');

    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchSearch =
                c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchStatus = statusFilter === 'All' || c.status === statusFilter;

            const matchInst = !institutionFilter || c.institutionName.includes(institutionFilter);

            return matchSearch && matchStatus && matchInst;
        });
    }, [cases, searchTerm, statusFilter, institutionFilter]);

    const uniqueInstitutions = useMemo(() =>
        Array.from(new Set(cases.map(c => c.institutionName))),
        [cases]);

    const getStatusBadge = (status: CaseStatus) => {
        switch (status) {
            case 'Nuevo': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'En Proceso': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'Pendiente Información': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'Revisión IA': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
            case 'Resuelto': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters Toolbar */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input
                        type="text"
                        placeholder="Buscar por paciente, RUT o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 transition-colors text-sm font-medium"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                    >
                        <option value="All">Todos los Estados</option>
                        <option value="Nuevo">Nuevo</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Revisión IA">Revisión IA</option>
                        <option value="Resuelto">Resuelto</option>
                    </select>

                    <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                    >
                        <option value="">Todas Instituciones</option>
                        {uniqueInstitutions.map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Table View */}
            <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                <th className="p-6">Paciente / ID</th>
                                <th className="p-6">Institución</th>
                                <th className="p-6">Tipo Solicitud</th>
                                <th className="p-6">Fecha</th>
                                <th className="p-6 text-center">Nivel Agrawal</th>
                                <th className="p-6 text-center">Estado</th>
                                <th className="p-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {filteredCases.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center opacity-40">
                                        <div className="flex flex-col items-center gap-4">
                                            <Filter className="w-12 h-12" />
                                            <p className="font-black uppercase tracking-widest text-xs">No se encontraron casos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCases.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => onViewCase(item.id)}
                                        className={`group transition-colors cursor-pointer border-b last:border-0 ${isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}
                                    >
                                        <td className="p-6">
                                            <div className="font-bold">{item.patientName}</div>
                                            <div className="text-xs opacity-50 font-mono mt-1">{item.patientId}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 opacity-40" />
                                                <span className="font-bold text-xs uppercase tracking-tight">{item.institutionName}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide">
                                                {item.requestType}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-bold">{new Date(item.requestDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center">
                                                {item.agrawallLevel !== undefined ? (
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black shadow-sm ${['bg-emerald-500', 'bg-blue-500', 'bg-cyan-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'][item.agrawallLevel] || 'bg-slate-500'
                                                        }`}>
                                                        {item.agrawallLevel}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] opacity-20 font-black uppercase tracking-widest">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                                                <ChevronRight className="w-5 h-5 opacity-60" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CasesList;
