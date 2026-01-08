
import React, { useMemo } from 'react';
import { useProcedures } from '../hooks/useProcedures';
import { UserSession } from '../types';
import { Calendar, Clock, User, ChevronRight, Info } from 'lucide-react';

interface Props {
    isDark: boolean;
    currentUser: UserSession;
    onViewAll: () => void;
}

const DoctorAgendaPanel: React.FC<Props> = ({ isDark, currentUser, onViewAll }) => {
    const { procedures } = useProcedures();

    const myUpcomingProcedures = useMemo(() => {
        const now = new Date();
        return procedures
            .filter(p => p.radiologistId === currentUser.id && p.status === 'Programado' && p.scheduledDate)
            .filter(p => new Date(p.scheduledDate!) >= now)
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
            .slice(0, 5);
    }, [procedures, currentUser.id]);

    if (currentUser.role !== 'Médico' && currentUser.role !== 'Superuser') return null;

    return (
        <div className={`p-10 rounded-[48px] border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tighter leading-none">Mi Agenda Próxima</h4>
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Procedimientos programados para hoy y mañana</p>
                    </div>
                </div>
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group"
                >
                    Ver Todo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="space-y-4">
                {myUpcomingProcedures.length === 0 ? (
                    <div className="py-12 text-center opacity-20 italic">
                        <Clock className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No hay procedimientos programados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                        {myUpcomingProcedures.map((proc) => {
                            const date = new Date(proc.scheduledDate!);
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={proc.id}
                                    className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl border group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-800/40 border-slate-800 hover:border-blue-500' : 'bg-slate-50 border-slate-100 hover:border-blue-500'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-colors ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'}`}>
                                        <span className="text-[10px] font-black uppercase">{date.toLocaleString('es-ES', { weekday: 'short' })}</span>
                                        <span className="text-xl font-black">{date.getDate()}</span>
                                    </div>

                                    <div className="flex-grow min-w-0 text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                            <h5 className="text-sm font-black uppercase tracking-tight truncate">{proc.procedureType}</h5>
                                            {proc.takesAnticoagulants && (
                                                <span className="p-1 bg-rose-500/10 text-rose-500 rounded-md">
                                                    <Info className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start gap-4 opacity-40">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <User className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{proc.patientName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 whitespace-nowrap border-l pl-4 border-slate-400">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                                        <span className={`block text-center px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${isDark ? 'border-slate-700' : 'border-slate-200 shadow-sm bg-white'}`}>
                                            {proc.clinicalCenter}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorAgendaPanel;
