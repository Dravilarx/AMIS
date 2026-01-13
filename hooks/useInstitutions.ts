
import { useState, useEffect } from 'react';
import { Institution, Contract } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

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
  const [error, setError] = useState<string | null>(null);

  const instCol = 'institutions';
  const contCol = 'contracts';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        let instData = await getDocuments<Institution>(instCol);
        if (instData.length === 0) {
          console.log('No institutions found, seeding...');
          for (const inst of INITIAL_INSTITUTIONS) {
            await addDocument(instCol, inst);
          }
          instData = await getDocuments<Institution>(instCol);
        }
        setInstitutions(instData);

        let contData = await getDocuments<Contract>(contCol);
        if (contData.length === 0) {
          console.log('No contracts found, seeding...');
          for (const cont of INITIAL_CONTRACTS) {
            await addDocument(contCol, cont);
          }
          contData = await getDocuments<Contract>(contCol);
        }
        setContracts(contData);
        setError(null);
      } catch (err) {
        console.error('Error loading institutions:', err);
        setError('Failed to load institutional data');
        // Fallback
        setInstitutions(INITIAL_INSTITUTIONS);
        setContracts(INITIAL_CONTRACTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addInstitution = async (inst: Omit<Institution, 'id'>) => {
    try {
      const id = await addDocument(instCol, inst);
      const newItem = { ...inst, id };
      setInstitutions(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Error adding institution:', err);
      throw err;
    }
  };

  const addContract = async (cont: Omit<Contract, 'id' | 'documents'>) => {
    try {
      const data = { ...cont, documents: [] };
      const id = await addDocument(contCol, data);
      const newItem = { ...data, id } as Contract;
      setContracts(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Error adding contract:', err);
      throw err;
    }
  };

  const updateInstitution = async (id: string, updates: Partial<Institution>) => {
    try {
      await updateDocument<Institution>(instCol, id, updates);
      setInstitutions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    } catch (err) {
      console.error('Error updating institution:', err);
      throw err;
    }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    try {
      await updateDocument<Contract>(contCol, id, updates);
      setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      console.error('Error updating contract:', err);
      throw err;
    }
  };

  const deleteInstitution = async (id: string) => {
    try {
      await deleteDocument(instCol, id);
      setInstitutions(prev => prev.filter(i => i.id !== id));

      // Also delete associated contracts (optional but good for cleanup)
      const associated = contracts.filter(c => c.institutionId === id);
      for (const c of associated) {
        await deleteDocument(contCol, c.id);
      }
      setContracts(prev => prev.filter(c => c.institutionId !== id));
    } catch (err) {
      console.error('Error deleting institution:', err);
      throw err;
    }
  };

  const deleteContract = async (id: string) => {
    try {
      await deleteDocument(contCol, id);
      setContracts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting contract:', err);
      throw err;
    }
  };

  return {
    institutions,
    contracts,
    loading,
    error,
    addInstitution,
    addContract,
    updateInstitution,
    updateContract,
    deleteInstitution,
    deleteContract
  };
};
