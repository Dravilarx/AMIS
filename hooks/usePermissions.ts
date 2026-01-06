
import { useState, useEffect } from 'react';
import { UserRole, RolePermissions, ActiveModule, UserSession } from '../types';
import { db } from '../services/db';

const DEFAULT_PERMISSIONS: RolePermissions = {
  'Superuser': ['dashboard', 'institutions', 'agrawall', 'hr', 'documentation', 'timeoff', 'signatures', 'news', 'messaging', 'management', 'shifts', 'procedures', 'indicators'],
  'Jefatura': ['dashboard', 'institutions', 'agrawall', 'hr', 'documentation', 'timeoff', 'signatures', 'news', 'messaging', 'shifts', 'indicators'],
  'Médico': ['dashboard', 'agrawall', 'procedures', 'timeoff', 'signatures', 'news', 'messaging', 'shifts'],
  'Técnico': ['dashboard', 'procedures', 'timeoff', 'news', 'messaging'],
  'Administrativo': ['dashboard', 'documentation', 'timeoff', 'news', 'messaging', 'institutions', 'shifts'],
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const [userPermissions, setUserPermissions] = useState<Record<string, ActiveModule[]>>({});
  const [loading, setLoading] = useState(true);
  
  const roleCollection = 'system_permissions';
  const userCollection = 'user_permissions';

  useEffect(() => {
    const load = async () => {
      const roleData = await db.getAll<any>(roleCollection);
      if (roleData.length > 0) {
        const permsRecord: any = {};
        roleData.forEach((item: any) => {
          permsRecord[item.role] = item.modules;
        });
        setPermissions(permsRecord as RolePermissions);
      } else {
        const initialData = Object.entries(DEFAULT_PERMISSIONS).map(([role, modules]) => ({
          id: role,
          role,
          modules
        }));
        await db.saveAll(roleCollection, initialData);
      }

      const userData = await db.getAll<any>(userCollection);
      const userPermsRecord: Record<string, ActiveModule[]> = {};
      userData.forEach((item: any) => {
        userPermsRecord[item.userId] = item.modules;
      });
      setUserPermissions(userPermsRecord);

      setLoading(false);
    };
    load();
  }, []);

  const updateRolePermissions = async (role: UserRole, modules: ActiveModule[]) => {
    const newPermissions = { ...permissions, [role]: modules };
    setPermissions(newPermissions);
    await db.update<{ id: string; role: string; modules: ActiveModule[] }>(roleCollection, role, { modules });
  };

  const updateUserPermissions = async (userId: string, modules: ActiveModule[] | null) => {
    const newUserPerms = { ...userPermissions };
    if (modules === null) {
      delete newUserPerms[userId];
      setUserPermissions(newUserPerms);
      await db.delete(userCollection, userId);
    } else {
      newUserPerms[userId] = modules;
      setUserPermissions(newUserPerms);
      await db.add(userCollection, { id: userId, userId, modules });
    }
  };

  const hasAccess = (user: UserSession, moduleId: ActiveModule): boolean => {
    if (user.role === 'Superuser') return true;
    const individual = userPermissions[user.id];
    if (individual) return individual.includes(moduleId);
    return permissions[user.role]?.includes(moduleId) || false;
  };

  const getIndividualPermissions = (userId: string) => userPermissions[userId] || null;

  return { 
    permissions, 
    userPermissions,
    loading, 
    updateRolePermissions, 
    updateUserPermissions,
    hasAccess,
    getIndividualPermissions
  };
};
