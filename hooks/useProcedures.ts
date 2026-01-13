
import { useState, useEffect } from 'react';
import { ProcedureEntry, ProcedureStatus, ProcedureRequirement, ProcedureCatalogItem } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_CATALOG: ProcedureCatalogItem[] = [
  {
    id: 'cat-1',
    name: 'Biopsia Core de Mama',
    baseValue: 380000,
    defaultModality: 'US',
    active: true,
    requiredDocs: ['Consentimiento Informado', 'Mamografía de Referencia', 'Pruebas Coagulación', 'Orden Médica']
  },
  {
    id: 'cat-2',
    name: 'Infiltración Articular Cadera',
    baseValue: 220000,
    defaultModality: 'TAC',
    active: true,
    requiredDocs: ['Consentimiento Informado', 'Evaluación Previa', 'Orden Médica']
  },
  {
    id: 'cat-3',
    name: 'PAAF de Tiroides',
    baseValue: 150000,
    defaultModality: 'US',
    active: true,
    requiredDocs: ['Consentimiento Informado', 'Orden Médica', 'Eco Tiroides Previa']
  },
  {
    id: 'cat-4',
    name: 'Nefrostomía Percutánea',
    baseValue: 650000,
    defaultModality: 'TAC',
    active: true,
    requiredDocs: ['Consentimiento Informado', 'Creatinina/Función Renal', 'Pruebas Coagulación', 'Orden Médica']
  },
  {
    id: 'cat-5',
    name: 'Drenaje Colección Abdominal',
    baseValue: 450000,
    defaultModality: 'US',
    active: true,
    requiredDocs: ['Consentimiento Informado', 'TAC/Eco Previa', 'Pruebas Coagulación', 'Orden Médica']
  }
];

const INITIAL_PROCEDURES: ProcedureEntry[] = [
  {
    id: 'proc-1',
    patientName: 'Maria Josefa López',
    patientRut: '15.678.901-2',
    patientPhone: '+56 9 9123 4455',
    patientEmail: 'mj.lopez@email.com',
    patientInsurance: 'Fonasa',
    patientBirthDate: '1985-05-12',
    patientAddress: 'Av. Providencia 1234, Santiago',
    takesAnticoagulants: true,
    procedureType: 'Biopsia Core de Mama',
    value: 380000,
    modality: 'US',
    referringPhysician: 'Dr. Marcos Valdivia (Ginecología)',
    radiologistId: '1',
    clinicalCenter: 'Clínica Las Condes',
    status: 'Pendiente Docs',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: [
      { id: 'req-1', name: 'Consentimiento Informado', isCompleted: true },
      { id: 'req-2', name: 'Mamografía de Referencia', isCompleted: false },
      { id: 'req-3', name: 'Pruebas Coagulación', isCompleted: false },
      { id: 'req-4', name: 'Orden Médica', isCompleted: true }
    ]
  },
  {
    id: 'proc-2',
    patientName: 'Carlos Iturra Zambrano',
    patientRut: '10.223.441-K',
    patientPhone: '+56 9 8877 6655',
    patientEmail: 'carlos.iz@email.com',
    patientInsurance: 'Isapre Colmena',
    patientBirthDate: '1972-10-25',
    patientAddress: 'Las Hualtatas 456, Vitacura',
    takesAnticoagulants: false,
    procedureType: 'Infiltración Articular Cadera',
    value: 220000,
    modality: 'TAC',
    referringPhysician: 'Dra. Sandra Rebolledo (Traumatología)',
    radiologistId: '1',
    clinicalCenter: 'Hospital Alemán',
    status: 'Completado',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: [
      { id: 'req-1', name: 'Consentimiento Informado', isCompleted: true },
      { id: 'req-2', name: 'Evaluación Previa', isCompleted: true },
      { id: 'req-3', name: 'Orden Médica', isCompleted: true }
    ]
  }
];

export const useProcedures = () => {
  const [procedures, setProcedures] = useState<ProcedureEntry[]>([]);
  const [catalog, setCatalog] = useState<ProcedureCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const proceduresCol = 'procedures';
  const catalogCol = 'procedure_catalog';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load catalog
        const catData = await getDocuments<ProcedureCatalogItem>(catalogCol);
        if (catData.length === 0) {
          console.log('No catalog found, seeding initial data...');
          for (const item of INITIAL_CATALOG) {
            await addDocument(catalogCol, item);
          }
          const seededCatalog = await getDocuments<ProcedureCatalogItem>(catalogCol);
          setCatalog(seededCatalog);
        } else {
          setCatalog(catData);
        }

        // Load procedures
        const procData = await getDocuments<ProcedureEntry>(proceduresCol, 'createdAt');
        if (procData.length === 0) {
          console.log('No procedures found, seeding initial data...');
          for (const proc of INITIAL_PROCEDURES) {
            await addDocument(proceduresCol, proc);
          }
          const seededProcs = await getDocuments<ProcedureEntry>(proceduresCol, 'createdAt');
          setProcedures(seededProcs);
        } else {
          setProcedures(procData);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading procedures:', err);
        setError(err instanceof Error ? err.message : 'Failed to load procedures');
        // Fallback to initial data
        setCatalog(INITIAL_CATALOG);
        setProcedures(INITIAL_PROCEDURES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addProcedure = async (data: Omit<ProcedureEntry, 'id' | 'createdAt' | 'status' | 'requirements'>) => {
    try {
      // Buscar los requerimientos definidos en el catálogo para este tipo de procedimiento
      const catalogItem = catalog.find(item => item.name === data.procedureType);
      const templateDocs = catalogItem?.requiredDocs || ['Consentimiento Informado', 'Orden Médica'];

      const newEntry = {
        ...data,
        createdAt: new Date().toISOString(),
        status: 'Pendiente Docs' as ProcedureStatus,
        requirements: templateDocs.map((name, idx) => ({
          id: `r-${idx}-${Date.now()}`,
          name,
          isCompleted: false
        }))
      };

      const id = await addDocument<ProcedureEntry>(proceduresCol, newEntry);
      const entryWithId = { ...newEntry, id };
      setProcedures(prev => [entryWithId, ...prev]);
      return entryWithId;
    } catch (err) {
      console.error('Error adding procedure:', err);
      throw err;
    }
  };

  const updateProcedure = async (id: string, updates: Partial<ProcedureEntry>) => {
    try {
      await updateDocument<ProcedureEntry>(proceduresCol, id, updates);
      setProcedures(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      console.error('Error updating procedure:', err);
      throw err;
    }
  };

  const toggleRequirement = async (procId: string, reqId: string) => {
    const proc = procedures.find(p => p.id === procId);
    if (!proc) return;

    const newReqs = proc.requirements.map(r =>
      r.id === reqId ? { ...r, isCompleted: !r.isCompleted } : r
    );

    const allDone = newReqs.every(r => r.isCompleted);
    let newStatus = proc.status;
    if (allDone && proc.status === 'Pendiente Docs') {
      newStatus = 'Listo';
    } else if (!allDone && proc.status === 'Listo') {
      newStatus = 'Pendiente Docs';
    }

    await updateProcedure(procId, { requirements: newReqs, status: newStatus });
  };

  const deleteProcedure = async (id: string) => {
    try {
      await deleteDocument(proceduresCol, id);
      setProcedures(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting procedure:', err);
      throw err;
    }
  };

  const updateCatalogItem = async (id: string, updates: Partial<ProcedureCatalogItem>) => {
    try {
      await updateDocument<ProcedureCatalogItem>(catalogCol, id, updates);
      setCatalog(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    } catch (err) {
      console.error('Error updating catalog item:', err);
      throw err;
    }
  };

  const addCatalogItem = async (item: Omit<ProcedureCatalogItem, 'id'>) => {
    try {
      const id = await addDocument<ProcedureCatalogItem>(catalogCol, item);
      const newItem = { ...item, id };
      setCatalog(prev => [...prev, newItem]);
    } catch (err) {
      console.error('Error adding catalog item:', err);
      throw err;
    }
  };

  return {
    procedures,
    catalog,
    loading,
    error,
    addProcedure,
    updateProcedure,
    toggleRequirement,
    deleteProcedure,
    updateCatalogItem,
    addCatalogItem
  };
};
