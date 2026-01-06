
import React from 'react';
import { Users, TrendingUp, Award, Briefcase } from 'lucide-react';
import { Employee } from '../../../types';

interface Props {
  employees: Employee[];
  isDark: boolean;
}

const StatPanel: React.FC<Props> = ({ employees, isDark }) => {
  const avgPerf = employees.length ? (employees.reduce((acc, curr) => acc + curr.performance, 0) / employees.length).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard label="Staff Total" val={employees.length} icon={<Users />} isDark={isDark} />
      <StatCard label="Eficiencia AVG" val={`${avgPerf}%`} icon={<TrendingUp />} isDark={isDark} />
      <StatCard label="Certificados" val="88%" icon={<Award />} isDark={isDark} />
      <StatCard label="Vacantes" val="4" icon={<Briefcase />} isDark={isDark} />
    </div>
  );
};

const StatCard = ({ label, val, icon, isDark }: any) => (
  <div className={`p-8 rounded-[32px] border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="p-3 w-12 h-12 rounded-2xl mb-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600">{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
    <h3 className="text-4xl font-black tracking-tight">{val}</h3>
  </div>
);

export default StatPanel;
