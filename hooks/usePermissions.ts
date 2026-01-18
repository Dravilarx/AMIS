
import { useState, useEffect } from 'react';
import { UserRole, RolePermissions, ActiveModule, UserSession } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument, setDocument } from '../services/firestoreService';

const DEFAULT_PERMISSIONS: RolePermissions = {
  'Superuser': ['dashboard', 'institutions', 'agrawall', 'hr', 'documentation', 'timeoff', 'signatures', 'news', 'messaging', 'management', 'shifts', 'procedures', 'indicators', 'workhub'],
  'Jefatura': ['dashboard', 'institutions', 'agrawall', 'hr', 'documentation', 'timeoff', 'signatures', 'news', 'messaging', 'shifts', 'indicators', 'workhub'],
  'Médico': ['dashboard', 'agrawall', 'procedures', 'timeoff', 'signatures', 'news', 'messaging', 'shifts', 'workhub'],
  'Técnico': ['dashboard', 'procedures', 'timeoff', 'news', 'messaging', 'workhub'],
  'Administrativo': ['dashboard', 'documentation', 'timeoff', 'news', 'messaging', 'institutions', 'shifts', 'workhub'],
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const [userPermissions, setUserPermissions] = useState<Record<string, ActiveModule[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleCol = 'system_permissions';
  const userCol = 'user_permissions';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const roleData = await getDocuments<any>(roleCol);
        if (roleData.length > 0) {
          const permsRecord: any = { ...DEFAULT_PERMISSIONS };
          roleData.forEach((item: any) => {
            // Self-healing: Ensure 'signatures' is present if in default
            let dbModules = Array.isArray(item.modules) ? [...item.modules] : [];
            const defaultModules = DEFAULT_PERMISSIONS[item.role as UserRole] || [];

            // Auto-patch for new features
            if (defaultModules.includes('signatures') && !dbModules.includes('signatures')) {
              dbModules.push('signatures');
            }

            permsRecord[item.role] = dbModules;
          });
          setPermissions(permsRecord as RolePermissions);
        } else {
          console.log('Seeding role permissions...');
          for (const [role, modules] of Object.entries(DEFAULT_PERMISSIONS)) {
            await setDocument(roleCol, role, { role, modules });
          }
        }

        const userData = await getDocuments<any>(userCol);
        const userPermsRecord: Record<string, ActiveModule[]> = {};
        userData.forEach((item: any) => {
          userPermsRecord[item.userId] = item.modules;
        });
        setUserPermissions(userPermsRecord);
        setError(null);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setError('Failed to load permission data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateRolePermissions = async (role: UserRole, modules: ActiveModule[]) => {
    try {
      const newPermissions = { ...permissions, [role]: modules };
      setPermissions(newPermissions);
      await updateDocument(roleCol, role, { modules });
    } catch (err) {
      console.error('Error updating role permissions:', err);
      throw err;
    }
  };

  const updateUserPermissions = async (userId: string, modules: ActiveModule[] | null) => {
    try {
      const newUserPerms = { ...userPermissions };
      if (modules === null) {
        delete newUserPerms[userId];
        setUserPermissions(newUserPerms);
        await deleteDocument(userCol, userId);
      } else {
        newUserPerms[userId] = modules;
        setUserPermissions(newUserPerms);
        await setDocument(userCol, userId, { userId, modules });
      }
    } catch (err) {
      console.error('Error updating user permissions:', err);
      throw err;
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
    error,
    updateRolePermissions,
    updateUserPermissions,
    hasAccess,
    getIndividualPermissions
  };
};
