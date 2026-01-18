
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  LogOut,
  Search,
  Activity,
  X,
  FolderOpen,
  CalendarDays,
  Stethoscope,
  Mail,
  Building2,
  Award,
  Megaphone,
  FileSignature,
  ShieldAlert,
  UserCircle,
  Lock,
  Settings2,
  Clock,
  BarChart3,
  CalendarClock
} from 'lucide-react';
import AgrawallModule from './modules/AgrawallModule';
import HRModule from './modules/HRModule';
import DocumentationModule from './modules/DocumentationModule';
import TimeOffModule from './modules/TimeOffModule';
import ProceduresModule from './modules/ProceduresModule';
import MessagingModule from './modules/MessagingModule';
import InstitutionsModule from './modules/InstitutionsModule';
import DashboardNews from './modules/DashboardNews';
import NewsModule from './modules/NewsModule';
import SignatureModule from './modules/SignatureModule';
import ManagementModule from './modules/ManagementModule';
import ShiftsModule from './modules/ShiftsModule';
import IndicatorsModule from './modules/IndicatorsModule';
import DoctorAgendaPanel from './modules/DoctorAgendaPanel';
import WorkHubModule from './modules/WorkHubModule';
import { ActiveModule, UserSession, UserRole } from './types';
import { usePermissions } from './hooks/usePermissions';

// Mocked user sessions for each profile
const SESSIONS: Record<UserRole, UserSession> = {
  'Superuser': { id: 'admin-0', name: 'Administrador AMIS', role: 'Superuser', email: 'admin@amis.health' },
  'Jefatura': { id: 'head-1', name: 'Dra. Elena Propper', role: 'Jefatura', email: 'e.propper@amis.health' },
  'Médico': { id: '1', name: 'Dr. Julián Riquelme', role: 'Médico', email: 'j.riquelme@amis.health' },
  'Técnico': { id: 'tech-2', name: 'TM. Pablo Vargas', role: 'Técnico', email: 'p.vargas@amis.health' },
  'Administrativo': { id: 'admin-3', name: 'Secretaria Carla', role: 'Administrativo', email: 'c.perez@amis.health' },
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession>(SESSIONS['Superuser']);
  const { hasAccess, loading: permsLoading } = usePermissions();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('amis_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('amis_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('amis_theme', 'light');
    }
  }, [isDark]);

  const navGroups = useMemo(() => [
    {
      title: "Gestión Estratégica",
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'indicators', label: 'Indicadores', icon: BarChart3 },
        { id: 'institutions', label: 'Instituciones', icon: Building2 },
      ].filter(i => hasAccess(currentUser, i.id as ActiveModule))
    },
    {
      title: "Operaciones Clínicas",
      items: [
        { id: 'agrawall', label: 'Análisis de Casos', icon: ShieldCheck },
        { id: 'shifts', label: 'Planificación Turnos', icon: Clock },
        { id: 'procedures', label: 'Intervencionismo', icon: Stethoscope },
      ].filter(i => hasAccess(currentUser, i.id as ActiveModule))
    },
    {
      title: "Legal & Capital Humano",
      items: [
        { id: 'hr', label: 'Talento Humano', icon: Users },
        { id: 'documentation', label: 'Documentación', icon: FolderOpen },
        { id: 'timeoff', label: 'Ausencias', icon: CalendarDays },
        { id: 'signatures', label: 'Firma Digital', icon: FileSignature },
      ].filter(i => hasAccess(currentUser, i.id as ActiveModule))
    },
    {
      title: "Colaboración",
      items: [
        { id: 'workhub', label: 'WorkHub', icon: CalendarClock },
        { id: 'news', label: 'Comunicados', icon: Megaphone },
        { id: 'messaging', label: 'Mensajería', icon: Mail },
      ].filter(i => hasAccess(currentUser, i.id as ActiveModule))
    },
    {
      title: "Administración Sistema",
      items: [
        { id: 'management', label: 'Gestión Accesos', icon: Lock },
      ].filter(i => currentUser.role === 'Superuser' && hasAccess(currentUser, i.id as ActiveModule))
    }
  ].filter(g => g.items.length > 0), [currentUser, permsLoading, hasAccess]);

  const getActiveLabel = () => {
    for (const group of navGroups) {
      const item = group.items.find(i => i.id === activeModule);
      if (item) return item.label;
    }
    return "Dashboard";
  };

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentUser(SESSIONS[role]);
    setActiveModule('dashboard');
  };

  if (permsLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 transform 
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-0'} 
        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'} border-r`}>

        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 overflow-hidden">
            <div className="bg-blue-600 p-2 rounded-xl flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-black uppercase tracking-tighter transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              AMIS
            </span>
          </div>

          <nav className="flex-grow px-3 space-y-6 mt-6 overflow-y-auto custom-scrollbar pb-10">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 mb-2 opacity-30 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-30' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {group.title}
                </h4>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id as ActiveModule)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group relative
                      ${activeModule === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'}`}
                  >
                    <item.icon className="w-6 h-6 flex-shrink-0" />
                    <span className={`font-bold text-[10px] uppercase tracking-widest transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0'}`}>
                      {item.label}
                    </span>
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700 pointer-events-none">
                        <p className="font-black border-b border-white/10 pb-1 mb-1 opacity-40">{group.title}</p>
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              <span className={`font-bold text-[10px] uppercase tracking-widest transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {isDark ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            </button>
            <button className="w-full flex items-center gap-4 p-3 mt-1 rounded-xl hover:bg-red-500/10 text-red-500 transition-all">
              <LogOut className="w-6 h-6" />
              <span className={`font-bold text-[10px] uppercase tracking-widest transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-10 bg-blue-600 text-white rounded-full p-1 shadow-lg border border-white dark:border-slate-900 z-[60]"
        >
          {isSidebarOpen ? <X className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className={`sticky top-0 z-40 h-20 border-b backdrop-blur-md flex items-center justify-between px-8
          ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-50">
              {getActiveLabel()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className={`hidden xl:flex items-center gap-3 p-1 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[8px] font-black uppercase opacity-40 px-3">Simular Perfil:</span>
              {(Object.keys(SESSIONS) as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tight transition-all
                    ${currentUser.role === role ? 'bg-blue-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                >
                  {role}
                </button>
              ))}
            </div>

            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="w-5 h-5 opacity-60" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
            </button>

            <div className="flex items-center gap-3 border-l pl-6 border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest">{currentUser.name}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <ShieldAlert className="w-2.5 h-2.5 text-blue-600" />
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{currentUser.role}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeModule === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto space-y-12">
              <div className="mb-10">
                <h1 className="text-5xl font-black tracking-tighter uppercase mb-3 leading-none">Comando Central AMIS</h1>
                <div className="flex items-center gap-3">
                  <p className="opacity-50 text-lg font-medium italic">Bienvenido, {currentUser.name}.</p>
                  {currentUser.role !== 'Superuser' && (
                    <span className="px-3 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-blue-500/20">Modo {currentUser.role}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {hasAccess(currentUser, 'indicators') && (
                  <DashboardCard
                    onClick={() => setActiveModule('indicators')}
                    label="Estrategia"
                    val="Indicadores"
                    icon={<BarChart3 className="w-10 h-10" />}
                    color="bg-indigo-600"
                  />
                )}
                {hasAccess(currentUser, 'institutions') && (
                  <DashboardCard
                    onClick={() => setActiveModule('institutions')}
                    label="Clientes"
                    val="Sedes Clínicas"
                    icon={<Building2 className="w-10 h-10" />}
                    color="bg-slate-900"
                  />
                )}
                {hasAccess(currentUser, 'shifts') && (
                  <DashboardCard
                    onClick={() => setActiveModule('shifts')}
                    label="Turnos"
                    val="Planificación"
                    icon={<Clock className="w-10 h-10" />}
                    color="bg-indigo-700"
                  />
                )}
                {hasAccess(currentUser, 'signatures') && (
                  <DashboardCard
                    onClick={() => setActiveModule('signatures')}
                    label="Legal"
                    val="Firma Digital"
                    icon={<FileSignature className="w-10 h-10" />}
                    color="bg-emerald-600"
                  />
                )}
                {hasAccess(currentUser, 'agrawall') && (
                  <DashboardCard
                    onClick={() => setActiveModule('agrawall')}
                    label="Análisis de Casos"
                    val="Auditoría IA"
                    icon={<ShieldCheck className="w-10 h-10" />}
                    color="bg-blue-700"
                  />
                )}
                {hasAccess(currentUser, 'hr') && (
                  <DashboardCard
                    onClick={() => setActiveModule('hr')}
                    label="Talento Humano"
                    val="Staff Activo"
                    icon={<Users className="w-10 h-10" />}
                    color="bg-emerald-600"
                  />
                )}
                {hasAccess(currentUser, 'documentation') && (
                  <DashboardCard
                    onClick={() => setActiveModule('documentation')}
                    label="Documentación"
                    val="Control Docs"
                    icon={<FolderOpen className="w-10 h-10" />}
                    color="bg-amber-600"
                  />
                )}
              </div>

              <div className="pt-6 grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                  <DashboardNews isDark={isDark} onManage={hasAccess(currentUser, 'news') ? () => setActiveModule('news') : undefined} />
                </div>
                <div>
                  <DoctorAgendaPanel isDark={isDark} currentUser={currentUser} onViewAll={() => setActiveModule('procedures')} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl"><Activity className="w-6 h-6" /></div>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Métricas de Red</h4>
                  </div>
                  <div className="space-y-6">
                    <MetricItem label="Precisión Diagnóstica" val="94.2%" color="emerald" />
                    <MetricItem label="Cumplimiento SLA" val="88.7%" color="blue" />
                    <MetricItem label="Retención Staff" val="96.0%" color="indigo" />
                  </div>
                </div>

                <div className={`p-10 rounded-[48px] border lg:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Award className="w-6 h-6" /></div>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Hitos y Reconocimientos</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HitoCard label="Certificación ISO 9001" sub="Completado en Diciembre 2024" icon={<ShieldCheck />} />
                    <HitoCard label="Staff Top 10" sub="Reconocimiento Nacional QA" icon={<Award />} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeModule === 'indicators' && hasAccess(currentUser, 'indicators') && <IndicatorsModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'institutions' && hasAccess(currentUser, 'institutions') && <InstitutionsModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'messaging' && hasAccess(currentUser, 'messaging') && <MessagingModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'news' && hasAccess(currentUser, 'news') && <NewsModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'procedures' && hasAccess(currentUser, 'procedures') && <ProceduresModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'agrawall' && hasAccess(currentUser, 'agrawall') && <AgrawallModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'hr' && hasAccess(currentUser, 'hr') && <HRModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'documentation' && hasAccess(currentUser, 'documentation') && <DocumentationModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'timeoff' && hasAccess(currentUser, 'timeoff') && <TimeOffModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'signatures' && hasAccess(currentUser, 'signatures') && <SignatureModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'management' && hasAccess(currentUser, 'management') && <ManagementModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'shifts' && hasAccess(currentUser, 'shifts') && <ShiftsModule isDark={isDark} currentUser={currentUser} />}
          {activeModule === 'workhub' && hasAccess(currentUser, 'workhub') && <WorkHubModule isDark={isDark} currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

const DashboardCard = ({ onClick, label, val, icon, color }: any) => (
  <div
    onClick={onClick}
    className={`p-8 rounded-[32px] ${color} text-white shadow-xl transition-transform hover:scale-105 cursor-pointer flex flex-col justify-between h-48 group`}
  >
    <div>
      <div className="mb-4 opacity-80 group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <h3 className="text-lg font-black leading-tight uppercase">{val}</h3>
    </div>
    <button onClick={onClick} className="text-[9px] font-bold uppercase border-b border-white/20 pb-0.5 self-start hover:border-white transition-all">Ingresar Módulo</button>
  </div>
);

const MetricItem = ({ label, val, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</p>
      <span className="text-xs font-black">{val}</span>
    </div>
    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full bg-${color}-500 transition-all duration-1000`} style={{ width: val }} />
    </div>
  </div>
);

const HitoCard = ({ label, sub, icon }: any) => (
  <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:scale-[1.02]">
    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-blue-600">{icon}</div>
    <div>
      <h5 className="text-[12px] font-black uppercase tracking-tight">{label}</h5>
      <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">{sub}</p>
    </div>
  </div>
);

export default App;
