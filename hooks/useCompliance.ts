
import { useState, useEffect } from 'react';
import { EmployeeCompliance, DocumentRecord, Employee, DocumentProfile } from '../types';
import { db } from '../services/db';

const INITIAL_PROFILES: DocumentProfile[] = [
  {
    id: 'prof-1',
    name: 'Ingreso Médico General',
    description: 'Requisitos básicos para contratación de facultativos.',
    requiredDocs: ['Título Profesional', 'Especialidad', 'Registro SIS', 'Seguro Malpractice']
  },
  {
    id: 'prof-2',
    name: 'Perfil de Eventos/Congresos',
    description: 'Documentación para asistencia a eventos internacionales.',
    requiredDocs: ['Carta Invitación', 'Pasaporte Vigente', 'Certificado Vacunación', 'Permiso Administrativo']
  },
  {
    id: 'prof-3',
    name: 'Staff Quirúrgico Senior',
    description: 'Acreditaciones para pabellón y especialidades críticas.',
    requiredDocs: ['Curso Protección Radiológica', 'Certificación ACLS', 'Póliza Específica Quirúrgica']
  }
];

const INITIAL_COMPLIANCE_DATA = (employeeId: string): EmployeeCompliance[] => [
  {
    // Added id for DB persistence
    id: employeeId,
    employeeId: employeeId,
    completionPercentage: 33,
    lastUpdate: new Date().toISOString(),
    documents: [
      {
        id: 'req-1',
        name: 'Título Profesional Médico Cirujano',
        category: 'Legal',
        status: 'Verified',
        mandatory: true,
        createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'req-2',
        name: 'Inscripción Superintendencia de Salud (SIS)',
        category: 'Legal',
        status: 'Uploaded',
        mandatory: true,
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'req-3',
        name: 'Seguro de Responsabilidad Civil (Malpractice)',
        category: 'Administrative',
        status: 'Pending',
        mandatory: true,
        createdDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export const useCompliance = (employees: Employee[]) => {
  const [complianceData, setComplianceData] = useState<EmployeeCompliance[]>([]);
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const complianceCollection = 'compliance';
  const profilesCollection = 'document_profiles';

  useEffect(() => {
    const load = async () => {
      // Load Profiles
      let loadedProfiles = await db.getAll<DocumentProfile>(profilesCollection);
      if (loadedProfiles.length === 0) {
        await db.saveAll(profilesCollection, INITIAL_PROFILES);
        loadedProfiles = INITIAL_PROFILES;
      }
      setProfiles(loadedProfiles);

      // Load Compliance
      let data = await db.getAll<EmployeeCompliance>(complianceCollection);
      let updatedData = [...data];
      let needsSave = false;

      if (data.length === 0 && employees.length > 0) {
        updatedData = INITIAL_COMPLIANCE_DATA(employees[0].id);
        needsSave = true;
      }

      employees.forEach(emp => {
        if (!updatedData.find(c => c.employeeId === emp.id)) {
          updatedData.push({
            // Added id for DB persistence
            id: emp.id,
            employeeId: emp.id,
            documents: [],
            completionPercentage: 0,
            lastUpdate: new Date().toISOString()
          });
          needsSave = true;
        }
      });

      // Fixed: Property 'id' is now present in EmployeeCompliance
      if (needsSave) await db.saveAll(complianceCollection, updatedData);
      setComplianceData(updatedData);
      setLoading(false);
    };
    if (employees.length > 0) load();
  }, [employees]);

  const saveProfile = async (profile: DocumentProfile) => {
    const exists = profiles.find(p => p.id === profile.id);
    let newProfiles;
    if (exists) {
      newProfiles = profiles.map(p => p.id === profile.id ? profile : p);
    } else {
      newProfiles = [profile, ...profiles];
    }
    setProfiles(newProfiles);
    await db.saveAll(profilesCollection, newProfiles);
  };

  const deleteProfile = async (id: string) => {
    const newProfiles = profiles.filter(p => p.id !== id);
    setProfiles(newProfiles);
    await db.saveAll(profilesCollection, newProfiles);
  };

  const updateDocument = async (employeeId: string, doc: Partial<DocumentRecord>) => {
    const record = complianceData.find(c => c.employeeId === employeeId);
    if (!record) return;

    let updatedDocs: DocumentRecord[];
    const existingDocIdx = record.documents.findIndex(d => d.id === doc.id);

    if (existingDocIdx > -1) {
      updatedDocs = record.documents.map((d, i) => i === existingDocIdx ? { ...d, ...doc } : d);
    } else {
      updatedDocs = [...record.documents, { 
        ...doc, 
        id: crypto.randomUUID(),
        createdDate: new Date().toISOString() 
      } as DocumentRecord];
    }

    const mandatoryCount = updatedDocs.filter(d => d.mandatory).length;
    const verifiedCount = updatedDocs.filter(d => d.mandatory && d.status === 'Verified').length;
    const percentage = mandatoryCount > 0 ? Math.round((verifiedCount / mandatoryCount) * 100) : 0;

    const updatedRecord: EmployeeCompliance = {
      ...record,
      documents: updatedDocs,
      completionPercentage: percentage,
      lastUpdate: new Date().toISOString()
    };

    const newComplianceData = complianceData.map(c => c.employeeId === employeeId ? updatedRecord : c);
    setComplianceData(newComplianceData);
    await db.saveAll(complianceCollection, newComplianceData);
  };

  const applyBatchDocs = async (role: string, department: string, docNames: string[]) => {
    const targets = employees.filter(e => e.role === role && (department === '' || e.department === department));
    const newComplianceData = [...complianceData];

    targets.forEach(emp => {
      const recordIdx = newComplianceData.findIndex(c => c.employeeId === emp.id);
      if (recordIdx > -1) {
        const currentDocs = [...newComplianceData[recordIdx].documents];
        docNames.forEach(name => {
          if (!currentDocs.find(d => d.name === name)) {
            currentDocs.push({
              id: crypto.randomUUID(),
              name,
              category: 'Administrative',
              status: 'Pending',
              mandatory: true,
              createdDate: new Date().toISOString()
            });
          }
        });
        
        const mandatoryCount = currentDocs.filter(d => d.mandatory).length;
        const verifiedCount = currentDocs.filter(d => d.mandatory && d.status === 'Verified').length;
        
        newComplianceData[recordIdx] = {
          ...newComplianceData[recordIdx],
          documents: currentDocs,
          completionPercentage: mandatoryCount > 0 ? Math.round((verifiedCount / mandatoryCount) * 100) : 0,
          lastUpdate: new Date().toISOString()
        };
      }
    });

    setComplianceData(newComplianceData);
    await db.saveAll(complianceCollection, newComplianceData);
  };

  return { complianceData, profiles, loading, updateDocument, applyBatchDocs, saveProfile, deleteProfile };
};
