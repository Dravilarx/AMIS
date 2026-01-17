
import { useState, useEffect } from 'react';
import { Employee } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    firstName: 'Julián',
    lastName: 'Riquelme',
    role: 'Médico',
    department: 'Radiología',
    subSpecialty: 'Neurorradiología',
    group: 'Staff Senior',
    hiringEntity: 'AMIS SORAN SPA',
    tags: ['Especialista', 'Docente', 'Investigador'],
    status: 'Activo',
    performance: 94,
    birthDate: '1985-04-12',
    joinDate: '2018-05-12',
    university: 'Pontificia Universidad Católica',
    superintendenciaId: '12345-6',
    email: 'j.riquelme@amis.health',
    phone: '+56 9 1234 5678',
    idNumber: '15.432.123-K',
    nationality: 'Chilena',
    residenceCountry: 'Chile',
    residenceCity: 'Santiago',
    laborRelation: 'Contrato',
    contractType: 'Indefinido',
    username: 'j.riquelme',
    signatureType: 'Firma Avanzada'
  }
];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collection = 'employees';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let data = await getDocuments<Employee>(collection);
        if (data.length === 0) {
          console.log('No employees found, seeding...');
          for (const emp of INITIAL_EMPLOYEES) {
            await addDocument(collection, emp);
          }
          data = await getDocuments<Employee>(collection);
        }
        setEmployees(data);
        setError(null);
      } catch (err) {
        console.error('Error loading employees:', err);
        setError('Failed to load employee data');
        setEmployees(INITIAL_EMPLOYEES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'performance' | 'status'>) => {
    try {
      const newEmp = {
        ...employeeData,
        status: 'Activo' as const,
        performance: Math.floor(Math.random() * 15) + 85,
      };

      const id = await addDocument(collection, newEmp);
      const entryWithId = { ...newEmp, id } as Employee;
      setEmployees(prev => [entryWithId, ...prev]);
      return entryWithId;
    } catch (err) {
      console.error('Error adding employee:', err);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateDocument<Employee>(collection, id, updates);
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  };

  /**
   * Get employees with incomplete mandatory fields (RUT, email, name)
   */
  const getIncompleteProfiles = (): Employee[] => {
    return employees.filter(emp => {
      const hasMissingFields = !emp.idNumber?.trim() ||
        !emp.email?.trim() ||
        !emp.firstName?.trim() ||
        !emp.lastName?.trim();
      return hasMissingFields && !emp.adminAuthorizedIncomplete;
    });
  };

  /**
   * Authorize a user with incomplete profile to access the system
   */
  const authorizeIncompleteAccess = async (id: string) => {
    try {
      await updateEmployee(id, { adminAuthorizedIncomplete: true });
    } catch (err) {
      console.error('Error authorizing incomplete access:', err);
      throw err;
    }
  };

  /**
   * Remove authorization for incomplete access
   */
  const revokeIncompleteAccess = async (id: string) => {
    try {
      await updateEmployee(id, { adminAuthorizedIncomplete: false });
    } catch (err) {
      console.error('Error revoking incomplete access:', err);
      throw err;
    }
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    getIncompleteProfiles,
    authorizeIncompleteAccess,
    revokeIncompleteAccess
  };
};
