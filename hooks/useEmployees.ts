
import { useState, useEffect } from 'react';
import { Employee } from '../types';
import { db } from '../services/db';

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
    email: 'j.riquelme@amis.health',
    phone: '+56 9 1234 5678',
    idNumber: '15.432.123-K',
    nationality: 'Chilena',
    residenceCountry: 'Chile'
  }
];

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const collection = 'employees';

  useEffect(() => {
    const load = async () => {
      let data = await db.getAll<Employee>(collection);
      if (data.length === 0) {
        await db.saveAll(collection, INITIAL_EMPLOYEES);
        data = INITIAL_EMPLOYEES;
      }
      setEmployees(data);
      setLoading(false);
    };
    load();
  }, []);

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'performance' | 'status'>) => {
    const newEmp: Employee = {
      ...employeeData,
      id: crypto.randomUUID(),
      status: 'Activo',
      performance: Math.floor(Math.random() * 15) + 85,
    } as Employee;
    
    await db.add(collection, newEmp);
    setEmployees(prev => [newEmp, ...prev]);
    return newEmp;
  };

  const deleteEmployee = async (id: string) => {
    await db.delete(collection, id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await db.update(collection, id, updates);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return { employees, loading, addEmployee, deleteEmployee, updateEmployee };
};
