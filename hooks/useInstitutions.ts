
import { useState, useEffect } from 'react';
import { Institution, Contract } from '../types';
import { db } from '../services/db';

const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-1',
    name: 'Hospital Regional del Sur',
    abbreviation: 'H-RESU',
    address: 'Av. Las Condes 1234, Piso 2',
    city: 'Santiago',
    category: 'Hospital',
    active: true
  },
  {
    id: 'inst-2',
    name: 'Clínica Metropolitana Central',
    abbreviation: 'CL-MECE',
    address: 'Calle Mayor 45, Edificio B',
    city: 'Concepción',
    category: 'Clínica',
    active: true
  }
];

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'cont-1',
    institutionId: 'inst-1',
    title: 'Convenio Teleradiología 24/7',
    bidNumber: 'LIC-2023-HOSPSUR',
    type: 'Contrato',
    status: 'Activo',
    startDate: '2023-01-01',
    endDate: '2025-06-01', // Próximo a vencer
    fines: 'Multas de 1 UTM por cada hora de retraso en Urgencias. Máximo 10% del monto mensual.',
    sla: {
      emergencies: { value: 2, unit: 'horas' },
      inpatients: { value: 12, unit: 'horas' },
      outpatient: { value: 24, unit: 'horas' },
      oncology: { value: 12, unit: 'horas' }
    },
    documents: []
  },
  {
    id: 'cont-2',
    institutionId: 'inst-2',
    title: 'Licitación Pública SSMC #445',
    bidNumber: 'ID-445-CMC',
    type: 'Licitación',
    status: 'Activo',
    startDate: '2024-06-01',
    endDate: '2026-06-01',
    fines: 'Sin multas por demora bajo 10 min. Escalamiento progresivo post-SLA.',
    sla: {
      emergencies: { value: 1, unit: 'horas' },
      inpatients: { value: 24, unit: 'horas' },
      outpatient: { value: 48, unit: 'horas' },
      oncology: { value: 48, unit: 'horas' }
    },
    documents: []
  }
];

export const useInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const instCol = 'institutions';
  const contCol = 'contracts';

  useEffect(() => {
    const load = async () => {
      let instData = await db.getAll<Institution>(instCol);
      if (instData.length === 0) {
        await db.saveAll(instCol, INITIAL_INSTITUTIONS);
        instData = INITIAL_INSTITUTIONS;
      }
      setInstitutions(instData);

      let contData = await db.getAll<Contract>(contCol);
      if (contData.length === 0) {
        await db.saveAll(contCol, INITIAL_CONTRACTS);
        contData = INITIAL_CONTRACTS;
      }
      setContracts(contData);
      setLoading(false);
    };
    load();
  }, []);

  const addInstitution = async (inst: Omit<Institution, 'id'>) => {
    const newItem = { ...inst, id: crypto.randomUUID() };
    await db.add(instCol, newItem);
    setInstitutions(prev => [...prev, newItem]);
    return newItem;
  };

  const addContract = async (cont: Omit<Contract, 'id' | 'documents'>) => {
    const newItem = { ...cont, id: crypto.randomUUID(), documents: [] };
    await db.add(contCol, newItem);
    setContracts(prev => [...prev, newItem]);
    return newItem;
  };

  const updateInstitution = async (id: string, updates: Partial<Institution>) => {
    await db.update<Institution>(instCol, id, updates);
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    await db.update<Contract>(contCol, id, updates);
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteInstitution = async (id: string) => {
    await db.delete(instCol, id);
    setInstitutions(prev => prev.filter(i => i.id !== id));
    const associated = contracts.filter(c => c.institutionId === id);
    for (const c of associated) {
      await db.delete(contCol, c.id);
    }
    setContracts(prev => prev.filter(c => c.institutionId !== id));
  };

  const deleteContract = async (id: string) => {
    await db.delete(contCol, id);
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  return { 
    institutions, 
    contracts, 
    loading, 
    addInstitution, 
    addContract, 
    updateInstitution, 
    updateContract,
    deleteInstitution,
    deleteContract
  };
};
