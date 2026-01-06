
import React, { useMemo } from 'react';
import { 
  BarChart3, TrendingUp, ShieldAlert, Target, 
  Users, Building2, Clock, Wallet, 
  Activity, PieChart, ArrowUpRight, ArrowDownRight,
  Stethoscope, ShieldCheck, Download
} from 'lucide-react';
import { useAgrawall } from '../hooks/useAgrawall';
import { useProcedures } from '../hooks/useProcedures';
import { useEmployees } from '../hooks/useEmployees';
import { useInstitutions } from '../hooks/useInstitutions';
import { UserSession } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const IndicatorsModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { history } = useAgrawall();
  const { procedures } = useProcedures();
  const { employees } = useEmployees();
  const { institutions, contracts } = useInstitutions();

  // MÁTRICAS DE QA (AGRAWALL)
  const agrawalStats = useMemo(() => {
    const total = history.length || 1;
    const levels = [0, 1, 2, 3, 4, 5].map(lvl => ({
      level: lvl,
      count: history.filter(h => h.scaleLevel === lvl).length,
      percentage: Math.round((history.filter(h => h.scaleLevel === lvl).length / total) * 100)
    }));
    const avgLevel = (history.reduce((acc, curr) => acc + curr.scaleLevel, 0) / total).toFixed(2);
    return { levels, avgLevel, total: history.length };
  }, [history]);

  // MÉTRICAS DE PRODUCCIÓN
  const prodStats = useMemo(() => {
    const completed = procedures.filter(p => p.status === 'Completado');
    const totalRevenue = completed.reduce((acc, curr) => acc + curr.value, 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    
    // Agrupación por modalidad
    const modalities = ['US', 'TAC', 'RM', 'Rx', 'Mamografía'].map(mod => ({
      name: mod,
      count: procedures.filter(p => p.modality === mod).length
    })).sort((a, b) => b.count - a.count);

    return { totalRevenue, avgTicket, modalities, totalCases: procedures.length };
  }, [procedures]);

  // MÉTRICAS OPERATIVAS
  const opStats = useMemo(() => {
    const staffActive = employees.filter(e => e.status === 'Activo').length;
    const activeContracts = contracts.filter(c => c.status === 'Activo').length;
    const alertContracts = contracts.filter(c => {
        const diff = (new Date(c.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff < 90;
    }).length;

    return { staffActive, activeContracts, alertContracts };
  }, [employees, contracts]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Estratégico */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Métricas de Red</h2>
          </div>
          <p className="opacity-40 text-lg font-medium italic text-balance">Inteligencia de negocios y monitoreo de calidad diagnóstica AMIS SORAN.</p>
        </div>
        <div className="flex gap-4">
           <button className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border flex items-center gap-2 transition-all ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
              <Download className="w-4 h-4" /> Exportar Reporte Ejecutivo
           </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <MainKpi label="Precisión Agrawall" val={`${Math.round((agrawalStats.levels[0].count + agrawalStats.levels[1].count) / (agrawalStats.total || 1) * 100)}%`} sub="Nivel 0 y 1" trend="+2.4%" trendUp={true} icon={<ShieldCheck />} color="blue" isDark={isDark} />
         <MainKpi label="Cumplimiento SLA" val="94.2%" sub="Global Red" trend="+0.8%" trendUp={true} icon={<Clock />} color="emerald" isDark={isDark} />
         <MainKpi label="Ingreso Proyectado" val={`$${(prodStats.totalRevenue / 1000000).toFixed(1)}M`} sub="Facturación Real" trend="-1.2%" trendUp={false} icon={<Wallet />} color="indigo" isDark={isDark} />
         <MainKpi label="Staff Operation" val={opStats.staffActive} sub="Médicos Activos" trend="estable" trendUp={true} icon={<Users />} color="slate" isDark={isDark} />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Columna Izquierda: QA & Quality */}
        <div className="lg:col-span-7 space-y-10">
           <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl"><Activity className="w-6 h-6" /></div>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Distribución Agrawall (Quality Assurance)</h4>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">Nivel Promedio</p>
                    <p className="text-2xl font-black text-blue-600">{agrawalStats.avgLevel}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 {agrawalStats.levels.map((lvl) => (
                   <div key={lvl.level} className="group">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                            Nivel {lvl.level} <span className="opacity-30 font-bold lowercase text-[10px]">({lvl.count} casos)</span>
                         </span>
                         <span className="text-xs font-black">{lvl.percentage}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-1000 ${getLevelColor(lvl.level)}`}
                           style={{ width: `${lvl.percentage}%` }}
                         />
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-10 p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 flex items-start gap-4">
                 <ShieldAlert className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                 <p className="text-xs font-medium leading-relaxed opacity-60 italic">Se observa una concentración saludable en Niveles 0 y 1. Las desviaciones hacia Nivel 3+ están siendo monitoreadas por el comité de ética radiológica.</p>
              </div>
           </div>

           <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl"><PieChart className="w-6 h-6" /></div>
                 <h4 className="text-xl font-black uppercase tracking-tighter">Mix de Producción por Modalidad</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                 {prodStats.modalities.map(mod => (
                   <div key={mod.name} className="p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center hover:scale-105 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">{mod.name}</p>
                      <h5 className="text-2xl font-black">{mod.count}</h5>
                      <div className="w-full h-1 bg-indigo-600/20 rounded-full mt-4 overflow-hidden">
                         <div className="h-full bg-indigo-600" style={{ width: `${(mod.count / (prodStats.totalCases || 1)) * 100}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Columna Derecha: Operaciones & BI */}
        <div className="lg:col-span-5 space-y-10">
           
           {/* Monitor de SLAs */}
           <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-4 mb-10">
                 <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl"><Target className="w-6 h-6" /></div>
                 <h4 className="text-xl font-black uppercase tracking-tighter">Monitoreo de SLAs (Tiempos)</h4>
              </div>
              <div className="space-y-8">
                 <SlaProgress label="Urgencias (2h)" value={98} color="bg-rose-500" />
                 <SlaProgress label="Hospitalizados (12h)" value={85} color="bg-amber-500" />
                 <SlaProgress label="Ambulatorios (24h)" value={92} color="bg-blue-500" />
                 <SlaProgress label="Oncológicos (24h)" value={100} color="bg-emerald-500" />
              </div>
           </div>

           {/* Health Institutional */}
           <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900"><Building2 className="w-6 h-6" /></div>
                 <h4 className="text-xl font-black uppercase tracking-tighter">Cartera de Convenios</h4>
              </div>
              <div className="space-y-4">
                 <HealthItem label="Sedes con Convenio Activo" val={opStats.activeContracts} total={institutions.length} color="blue" />
                 <HealthItem label="Alertas de Renovación" val={opStats.alertContracts} total={opStats.activeContracts} color="amber" />
                 <HealthItem label="Cumplimiento de Pagos" val={96} total={100} color="emerald" suffix="%" />
              </div>
           </div>

           {/* Ranking Médicos (Top Performance) */}
           <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h4 className="text-xl font-black uppercase tracking-tighter mb-8">Staff Top Performance</h4>
              <div className="space-y-6">
                 {employees.filter(e => e.role === 'Médico').slice(0, 3).map((dr, i) => (
                   <div key={dr.id} className="flex items-center justify-between p-4 rounded-[32px] border border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">#{i+1}</div>
                         <div>
                            <p className="text-sm font-black uppercase tracking-tight">Dr. {dr.lastName}</p>
                            <p className="text-[9px] font-bold opacity-40 uppercase">{dr.subSpecialty || 'Especialista'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-500">{dr.performance}%</p>
                         <p className="text-[8px] font-black uppercase opacity-30">KPI Global</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const MainKpi = ({ label, val, sub, trend, trendUp, icon, color, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border transition-all hover:scale-105 group ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
     <div className="flex items-center justify-between mb-8">
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} group-hover:bg-blue-600 group-hover:text-white transition-all`}>
           {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
           {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
           {trend}
        </div>
     </div>
     <h3 className="text-4xl font-black tracking-tighter mb-1">{val}</h3>
     <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
     <p className="text-[9px] font-bold opacity-20 uppercase mt-4 italic">{sub}</p>
  </div>
);

const SlaProgress = ({ label, value, color }: any) => (
  <div className="space-y-2">
     <div className="flex justify-between items-end">
        <span className="text-[11px] font-black uppercase tracking-tight opacity-60">{label}</span>
        <span className="text-sm font-black">{value}%</span>
     </div>
     <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
     </div>
  </div>
);

const HealthItem = ({ label, val, total, color, suffix = "" }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
     <div className="flex items-center gap-3">
        <div className="text-right">
           <span className={`text-sm font-black text-${color}-500`}>{val}{suffix}</span>
           {total !== val && <span className="text-[10px] font-bold opacity-20 ml-1">/ {total}</span>}
        </div>
     </div>
  </div>
);

const getLevelColor = (level: number) => {
  const colors = [
    'bg-emerald-500', // 0
    'bg-blue-500',    // 1
    'bg-cyan-500',    // 2
    'bg-amber-500',   // 3
    'bg-orange-500',  // 4
    'bg-rose-600'     // 5
  ];
  return colors[level] || 'bg-slate-600';
};

export default IndicatorsModule;
