import React from 'react';
import { CaseRequest } from '../../types';
import {
    BarChart3,
    Clock,
    AlertCircle,
    CheckCircle2,
    FileText
} from 'lucide-react';

interface Props {
    isDark: boolean;
    cases: CaseRequest[];
}

const CasesDashboard: React.FC<Props> = ({ isDark, cases }) => {
    // KPIs
    const totalCases = cases.length;
    const newCases = cases.filter(c => c.status === 'Nuevo').length;
    const inProcess = cases.filter(c =>
        c.status === 'En Proceso' ||
        c.status === 'Pendiente Información' ||
        c.status === 'Revisión IA'
    ).length;
    const closed = cases.filter(c =>
        c.status === 'Resuelto' ||
        c.status.startsWith('Cerrado')
    ).length;

    const getLevelColor = (level: number) => {
        const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-cyan-600', 'bg-amber-500', 'bg-orange-600', 'bg-red-700'];
        return colors[level] || 'bg-slate-600';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    isDark={isDark}
                    label="Total Casos"
                    value={totalCases}
                    icon={<FileText className="w-6 h-6" />}
                    color="bg-slate-600"
                />
                <KPICard
                    isDark={isDark}
                    label="Nuevos (Pendientes)"
                    value={newCases}
                    icon={<AlertCircle className="w-6 h-6" />}
                    color="bg-blue-600"
                />
                <KPICard
                    isDark={isDark}
                    label="En Gestión"
                    value={inProcess}
                    icon={<Clock className="w-6 h-6" />}
                    color="bg-amber-600"
                />
                <KPICard
                    isDark={isDark}
                    label="Resueltos"
                    value={closed}
                    icon={<CheckCircle2 className="w-6 h-6" />}
                    color="bg-emerald-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Agrawall Distribution */}
                <div className={`lg:col-span-2 p-8 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-600 rounded-xl text-white">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Distribución Agrawall</h3>
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Niveles de Discrepancia/Error</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[0, 1, 2, 3, 4, 5].map(level => {
                            const count = cases.filter(c => c.agrawallLevel === level).length;
                            return (
                                <div key={level} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className={`w-10 h-10 rounded-xl ${getLevelColor(level)} flex items-center justify-center text-white font-black text-lg`}>
                                        {level}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black">{count}</h4>
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Nivel {level}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">Estado Actual</h3>
                    <div className="space-y-4">
                        <StatusRow label="Nuevos" count={newCases} total={totalCases} color="bg-blue-500" />
                        <StatusRow label="En Proceso" count={inProcess} total={totalCases} color="bg-amber-500" />
                        <StatusRow label="Cerrados" count={closed} total={totalCases} color="bg-emerald-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ isDark, label, value, icon, color }: any) => (
    <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} flex items-center justify-between group hover:scale-[1.02] transition-transform`}>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
            <h3 className="text-4xl font-black tracking-tighter">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
            {icon}
        </div>
    </div>
);

const StatusRow = ({ label, count, total, color }: any) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</span>
                <span className="text-xs font-black">{count}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

export default CasesDashboard;
