
import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  UserCog,
  Check,
  X,
  Lock,
  AlertTriangle,
  Save,
  History,
  LayoutDashboard,
  Building2,
  Stethoscope,
  Users,
  FolderOpen,
  CalendarDays,
  FileSignature,
  Megaphone,
  Mail,
  Settings2,
  Search,
  ShieldAlert,
  User,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Activity,
  UserX,
  CheckCircle,
  Edit
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useEmployees } from '../hooks/useEmployees';
import { useInstitutions } from '../hooks/useInstitutions';
import { useProfileValidation } from '../hooks/useProfileValidation';
import { UserRole, ActiveModule, Employee, UserSession, Institution } from '../types';

interface Props {
  isDark: boolean;
  currentUser: UserSession;
}

const ManagementModule: React.FC<Props> = ({ isDark, currentUser }) => {
  const { permissions, userPermissions, updateRolePermissions, updateUserPermissions } = usePermissions();
  const { employees, authorizeIncompleteAccess, revokeIncompleteAccess } = useEmployees();
  const { institutions, getIncompleteInstitutions } = useInstitutions();
  const { validateEmployee, validateInstitution } = useProfileValidation();

  const [viewTab, setViewTab] = useState<'roles' | 'usuarios' | 'incompletos'>('roles');
  const [localRolePermissions, setLocalRolePermissions] = useState(permissions);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState('');

  // Estado para cambios individuales pendientes de guardar (borrador local)
  const [pendingUserModules, setPendingUserModules] = useState<ActiveModule[]>([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [saveType, setSaveType] = useState<'roles' | 'user' | 'reset'>('roles');
  const [securityInput, setSecurityInput] = useState('');
  const [challenge, setChallenge] = useState<{ q: string, a: string }>({ q: '', a: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalRolePermissions(permissions);
  }, [permissions]);

  // Sincronizar permisos pendientes cuando cambia el usuario seleccionado o los permisos globales
  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        const individual = userPermissions[selectedEmpId];
        const roleDefaults = permissions[emp.role as UserRole] || [];
        setPendingUserModules(individual || roleDefaults);
      }
    }
  }, [selectedEmpId, userPermissions, permissions, employees]);

  const roles: UserRole[] = ['Superuser', 'Jefatura', 'Médico', 'Técnico', 'Administrativo'];
  const modules: { id: ActiveModule, label: string, icon: any }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'institutions', label: 'Clientes/Sedes', icon: Building2 },
    { id: 'agrawall', label: 'QA Agrawall', icon: ShieldCheck },
    { id: 'procedures', label: 'Intervención', icon: Stethoscope },
    { id: 'hr', label: 'Gestión Humana', icon: Users },
    { id: 'documentation', label: 'Expedientes', icon: FolderOpen },
    { id: 'timeoff', label: 'Ausencias', icon: CalendarDays },
    { id: 'signatures', label: 'Firma Legal', icon: FileSignature },
    { id: 'news', label: 'Comunicados', icon: Megaphone },
    { id: 'messaging', label: 'Mensajería', icon: Mail },
    { id: 'management', label: 'Privilegios', icon: Lock }
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.idNumber.includes(empSearch)
    );
  }, [employees, empSearch]);

  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === selectedEmpId),
    [employees, selectedEmpId]);

  // Verificar si hay cambios sin guardar respecto a lo que hay en DB
  const hasUnsavedUserChanges = useMemo(() => {
    if (!selectedEmpId) return false;
    const currentInDB = userPermissions[selectedEmpId] || permissions[selectedEmployee?.role as UserRole] || [];
    if (currentInDB.length !== pendingUserModules.length) return true;
    return !currentInDB.every(m => pendingUserModules.includes(m));
  }, [selectedEmpId, userPermissions, pendingUserModules, permissions, selectedEmployee]);

  // Manejo de Permisos por Rol
  const toggleRolePermission = (role: UserRole, moduleId: ActiveModule) => {
    if (role === 'Superuser' && moduleId === 'management') return;
    const current = localRolePermissions[role] || [];
    const next = current.includes(moduleId)
      ? current.filter(m => m !== moduleId)
      : [...current, moduleId];
    setLocalRolePermissions({ ...localRolePermissions, [role]: next });
  };

  // Manejo de Permisos por Usuario (Solo cambio en borrador local)
  const toggleUserPermissionLocal = (moduleId: ActiveModule) => {
    // Fixed: Cast role to UserRole to satisfy comparison with 'Superuser', as Employee role is a subset that technically doesn't include it.
    if ((selectedEmployee?.role as UserRole) === 'Superuser' && moduleId === 'management') return;
    setPendingUserModules(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleStartSave = (type: 'roles' | 'user' | 'reset') => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setChallenge({ q: `¿Cuánto es ${num1} + ${num2}?`, a: (num1 + num2).toString() });
    setSaveType(type);
    setShowConfirm(true);
    setSecurityInput('');
  };

  const handleFinalSave = async () => {
    if (securityInput.trim() !== challenge.a) {
      alert("Desafío de seguridad incorrecto.");
      return;
    }

    try {
      setIsSaving(true);
      if (saveType === 'roles') {
        for (const role of roles) {
          const m = localRolePermissions[role] || []; // Fallback a array vacío si es undefined
          await updateRolePermissions(role, m);
        }
      } else if (saveType === 'user' && selectedEmpId) {
        await updateUserPermissions(selectedEmpId, pendingUserModules || []);
      } else if (saveType === 'reset' && selectedEmpId) {
        await updateUserPermissions(selectedEmpId, null);
      }

      setShowConfirm(false);
      setSecurityInput('');
      alert("Privilegios actualizados correctamente.");
    } catch (error) {
      console.error("Error saving security changes:", error);
      alert("Error crítico al guardar cambios: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Estilo AMIS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Gestión de Accesos</h2>
          </div>
          <p className="opacity-40 text-lg font-medium italic">Configuración maestra de visibilidad y permisos para la red AMIS.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
            <button onClick={() => setViewTab('roles')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === 'roles' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}>Matriz por Rol</button>
            <button onClick={() => setViewTab('usuarios')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === 'usuarios' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'opacity-40'}`}>Usuarios Individuales</button>
            <button onClick={() => setViewTab('incompletos')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewTab === 'incompletos' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'opacity-40'}`}>
              <AlertTriangle className="w-3 h-3" />
              Perfiles Incompletos
            </button>
          </div>
          {viewTab === 'roles' && (
            <button
              onClick={() => handleStartSave('roles')}
              className="px-8 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30"
            >
              <Save className="w-5 h-5" /> Guardar Matriz
            </button>
          )}
        </div>
      </div>

      {viewTab === 'roles' && (
        <div className="grid grid-cols-1 gap-8">
          <div className={`p-10 rounded-[48px] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black uppercase tracking-tighter">Matriz de Privilegios Corporativos</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" /> Los cambios afectan a todos los usuarios del rol
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest opacity-30">Perfil del Sistema</th>
                    {modules.map(mod => (
                      <th key={mod.id} className="pb-6 px-4 text-center group">
                        <div className="flex flex-col items-center gap-2">
                          <mod.icon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[8px] font-black uppercase tracking-tighter vertical-text opacity-40">{mod.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {roles.map(role => (
                    <tr key={role} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] text-white ${role === 'Superuser' ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                            {role[0]}
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{role}</span>
                        </div>
                      </td>
                      {modules.map(mod => {
                        const isActive = localRolePermissions[role]?.includes(mod.id);
                        const isLocked = role === 'Superuser' && mod.id === 'management';
                        return (
                          <td key={mod.id} className="py-6 px-4 text-center">
                            <button
                              disabled={isLocked}
                              onClick={() => toggleRolePermission(role, mod.id)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all mx-auto
                                ${isActive
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700'}
                                ${isLocked ? 'opacity-50 cursor-not-allowed border-2 border-indigo-500/20' : 'hover:scale-110'}
                              `}
                            >
                              {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewTab === 'usuarios' && (
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Navegador de Staff */}
          <div className={`lg:col-span-4 p-8 rounded-[48px] border overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 px-2">Directorio de Staff</h3>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'}`}
              />
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredEmployees.map(emp => {
                const isOverridden = !!userPermissions[emp.id];
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`p-5 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between group
                      ${selectedEmpId === emp.id ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-blue-500/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs relative">
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-2xl" /> : <span className="opacity-40">{emp.firstName[0]}{emp.lastName[0]}</span>}
                        {isOverridden && <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full text-white shadow-lg"><UserCog className="w-2.5 h-2.5" /></div>}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[9px] opacity-40 font-bold uppercase">{emp.role} • {emp.department}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${selectedEmpId === emp.id ? 'opacity-100 text-indigo-500 translate-x-1' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel de Configuración Individual */}
          <div className="lg:col-span-8">
            {selectedEmployee ? (
              <div className={`p-10 rounded-[48px] border animate-in zoom-in-95 duration-300 h-full flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600/10 text-indigo-600 rounded-2xl">
                      <UserCog className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Privilegios Individuales</h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">{selectedEmployee.firstName} {selectedEmployee.lastName} • {selectedEmployee.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasUnsavedUserChanges && (
                      <button
                        onClick={() => handleStartSave('user')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Guardar Cambios
                      </button>
                    )}
                    {userPermissions[selectedEmployee.id] && (
                      <button
                        onClick={() => handleStartSave('reset')}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset a Rol
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map(mod => {
                      const isSelected = pendingUserModules.includes(mod.id);
                      const isInherited = !userPermissions[selectedEmployee.id];
                      // Fixed: Cast role to UserRole to satisfy comparison with 'Superuser', as Employee role is a subset that technically doesn't include it.
                      const isLocked = (selectedEmployee.role as UserRole) === 'Superuser' && mod.id === 'management';

                      return (
                        <div
                          key={mod.id}
                          onClick={() => !isLocked && toggleUserPermissionLocal(mod.id)}
                          className={`p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden group
                              ${isSelected
                              ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5'
                              : 'border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'}
                              ${isLocked ? 'cursor-not-allowed opacity-30 grayscale' : ''}
                            `}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                              <mod.icon className="w-5 h-5" />
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-700'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <h5 className="text-xs font-black uppercase tracking-widest mb-1">{mod.label}</h5>
                          <div className="flex items-center gap-2">
                            {isInherited ? (
                              <span className="text-[8px] font-black uppercase text-indigo-600 flex items-center gap-1"><Users className="w-2.5 h-2.5" /> Heredado por Rol</span>
                            ) : (
                              <span className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1"><UserCheck className="w-2.5 h-2.5" /> Excepción Individual</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`p-8 rounded-[40px] border flex gap-6 items-start ${isDark ? 'bg-indigo-900/10 border-indigo-900/20' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl"><ShieldAlert className="w-6 h-6" /></div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-indigo-600">Consideraciones de Seguridad</h4>
                      <p className="text-xs font-medium opacity-70 leading-relaxed">Al activar o desactivar un módulo para un usuario específico, se crea un registro de excepción en la base de datos. Cualquier cambio futuro en la **Matriz de Roles** general no afectará a este usuario a menos que decida restablecer su perfil.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center p-24 text-center opacity-20">
                <UserCog className="w-24 h-24 mb-8" />
                <h3 className="text-2xl font-black uppercase tracking-widest mb-4">Personalización de Acceso</h3>
                <p className="text-sm font-black uppercase tracking-widest opacity-60 max-w-sm mx-auto">Seleccione un miembro del staff para otorgar o restringir accesos por encima de su jerarquía corporativa básica.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de Perfiles Incompletos */}
      {viewTab === 'incompletos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Empleados Incompletos */}
          <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Empleados con Datos Faltantes</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">RUT, Email, Nombre o Apellido incompletos</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {employees.filter(emp => {
                const validation = validateEmployee(emp);
                return !validation.isComplete;
              }).length === 0 ? (
                <div className="p-10 text-center opacity-30">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p className="text-sm font-black uppercase tracking-widest">Todos los empleados tienen datos completos</p>
                </div>
              ) : (
                employees.filter(emp => {
                  const validation = validateEmployee(emp);
                  return !validation.isComplete;
                }).map(emp => {
                  const validation = validateEmployee(emp);
                  return (
                    <div key={emp.id} className={`p-6 rounded-[32px] border transition-all ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm">{emp.firstName || '???'} {emp.lastName || '???'}</p>
                            <p className="text-[10px] font-bold opacity-40">{emp.role} • {emp.department || 'Sin departamento'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {validation.authorizedIncomplete ? (
                            <button
                              onClick={() => revokeIncompleteAccess(emp.id)}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                              Autorizado ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => authorizeIncompleteAccess(emp.id)}
                              className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all"
                            >
                              Autorizar Acceso
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {validation.missingFields.map(field => (
                          <span key={field} className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase">
                            Falta: {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Instituciones Incompletas */}
          <div className={`p-10 rounded-[48px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Instituciones con Datos Faltantes</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nombre o Ciudad incompletos</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {getIncompleteInstitutions().length === 0 ? (
                <div className="p-10 text-center opacity-30">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p className="text-sm font-black uppercase tracking-widest">Todas las instituciones tienen datos completos</p>
                </div>
              ) : (
                getIncompleteInstitutions().map(inst => {
                  const validation = validateInstitution(inst);
                  return (
                    <div key={inst.id} className={`p-6 rounded-[32px] border transition-all ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm">{inst.name || '(Sin nombre)'}</p>
                            <p className="text-[10px] font-bold opacity-40">{inst.category} • {inst.city || '(Sin ciudad)'}</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2">
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {validation.missingFields.map(field => (
                          <span key={field} className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase">
                            Falta: {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Informativo */}
          <div className={`lg:col-span-2 p-8 rounded-[48px] border ${isDark ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-start gap-6">
              <div className="p-4 bg-amber-500 text-white rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-amber-600">Política de Datos Obligatorios</h4>
                <p className="text-sm opacity-70 leading-relaxed">
                  Los usuarios con datos incompletos verán una alerta al ingresar al sistema solicitando que completen su información.
                  Como administrador, puede <strong>autorizar temporalmente</strong> el acceso de usuarios con datos incompletos si es necesario.
                  Esta autorización puede ser revocada en cualquier momento.
                </p>
                <div className="mt-4 flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-xl">
                    <User className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase">Empleados: RUT, Email, Nombre, Apellido</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-xl">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase">Instituciones: Nombre, Ciudad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Desafío Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className={`relative w-full max-w-lg p-12 rounded-[56px] border animate-in zoom-in-95 duration-300 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">
              {saveType === 'reset' ? '¿Restablecer Privilegios?' : '¿Confirmar Cambios de Seguridad?'}
            </h3>
            <p className="text-sm font-medium opacity-50 mb-10 leading-relaxed">
              {saveType === 'roles'
                ? 'Esta acción reconfigurará la visibilidad de todos los usuarios según su rol.'
                : saveType === 'reset'
                  ? `Esta acción eliminará todas las excepciones individuales de ${selectedEmployee?.firstName} y volverá a los valores por defecto de su rol.`
                  : `Esta acción reconfigurará los privilegios específicos de ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}.`}
              Por favor, resuelva el siguiente desafío para continuar:
            </p>

            <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-800 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 text-center">Desafío de Verificación</p>
              <p className="text-2xl font-black mb-6">{challenge.q}</p>
              <input
                autoFocus
                type="text"
                value={securityInput}
                onChange={e => setSecurityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFinalSave()}
                placeholder="Respuesta aquí..."
                className={`w-full p-5 rounded-2xl border outline-none font-black text-center text-xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 focus:border-indigo-600'}`}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-5 font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity">Abortar Operación</button>
              <button
                disabled={!securityInput || isSaving}
                onClick={handleFinalSave}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" /> Procesando...
                  </>
                ) : (
                  'Autorizar & Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementModule;
