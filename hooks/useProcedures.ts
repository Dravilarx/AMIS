
import { useState, useEffect } from 'react';
import { ProcedureEntry, ProcedureStatus, ProcedureRequirement, ProcedureCatalogItem } from '../types';
import { db } from '../services/db';

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

  const proceduresCol = 'procedures';
  const catalogCol = 'procedure_catalog';

  useEffect(() => {
    const load = async () => {
      let catData = await db.getAll<ProcedureCatalogItem>(catalogCol);
      if (catData.length === 0) {
        await db.saveAll(catalogCol, INITIAL_CATALOG);
        catData = INITIAL_CATALOG;
      }
      setCatalog(catData);

      let procData = await db.getAll<ProcedureEntry>(proceduresCol);
      if (procData.length === 0) {
        await db.saveAll(proceduresCol, INITIAL_PROCEDURES);
        procData = INITIAL_PROCEDURES;
      }
      setProcedures(procData);
      setLoading(false);
    };
    load();
  }, []);

  const addProcedure = async (data: Omit<ProcedureEntry, 'id' | 'createdAt' | 'status' | 'requirements'>) => {
    // Buscar los requerimientos definidos en el catálogo para este tipo de procedimiento
    const catalogItem = catalog.find(item => item.name === data.procedureType);
    const templateDocs = catalogItem?.requiredDocs || ['Consentimiento Informado', 'Orden Médica'];

    const newEntry: ProcedureEntry = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'Pendiente Docs',
      requirements: templateDocs.map((name, idx) => ({
        id: `r-${idx}-${Date.now()}`,
        name,
        isCompleted: false
      }))
    };
    await db.add(proceduresCol, newEntry);
    setProcedures(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updateProcedure = async (id: string, updates: Partial<ProcedureEntry>) => {
    await db.update(proceduresCol, id, updates);
    setProcedures(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
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
    await db.delete(proceduresCol, id);
    setProcedures(prev => prev.filter(p => p.id !== id));
  };

  const updateCatalogItem = async (id: string, updates: Partial<ProcedureCatalogItem>) => {
    await db.update(catalogCol, id, updates);
    setCatalog(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addCatalogItem = async (item: Omit<ProcedureCatalogItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    await db.add(catalogCol, newItem);
    setCatalog(prev => [...prev, newItem]);
  };

  return {
    procedures,
    catalog,
    loading,
    addProcedure,
    updateProcedure,
    toggleRequirement,
    deleteProcedure,
    updateCatalogItem,
    addCatalogItem
  };
};
