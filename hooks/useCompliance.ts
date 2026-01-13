
import { useState, useEffect } from 'react';
import { EmployeeCompliance, DocumentRecord, Employee, DocumentProfile } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument, setDocument } from '../services/firestoreService';

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

const INITIAL_COMPLIANCE_DATA = (employeeId: string): EmployeeCompliance => ({
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
});

export const useCompliance = (employees: Employee[]) => {
  const [complianceData, setComplianceData] = useState<EmployeeCompliance[]>([]);
  const [profiles, setProfiles] = useState<DocumentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const complianceCol = 'compliance';
  const profilesCol = 'document_profiles';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Load Profiles
        let loadedProfiles = await getDocuments<DocumentProfile>(profilesCol);
        if (loadedProfiles.length === 0) {
          console.log('Seeding profiles...');
          for (const prof of INITIAL_PROFILES) {
            await addDocument(profilesCol, prof);
          }
          loadedProfiles = await getDocuments<DocumentProfile>(profilesCol);
        }
        setProfiles(loadedProfiles);

        // Load Compliance
        let data = await getDocuments<EmployeeCompliance>(complianceCol);
        let updatedData = [...data];
        let needsSync = false;

        if (data.length === 0 && employees.length > 0) {
          const firstComp = INITIAL_COMPLIANCE_DATA(employees[0].id);
          await setDocument(complianceCol, firstComp.id, firstComp);
          updatedData = [firstComp];
          needsSync = true;
        }

        for (const emp of employees) {
          if (!updatedData.find(c => c.employeeId === emp.id)) {
            const newComp: EmployeeCompliance = {
              id: emp.id,
              employeeId: emp.id,
              documents: [],
              completionPercentage: 0,
              lastUpdate: new Date().toISOString()
            };
            await setDocument(complianceCol, newComp.id, newComp);
            updatedData.push(newComp);
            needsSync = true;
          }
        }

        setComplianceData(updatedData);
        setError(null);
      } catch (err) {
        console.error('Error loading compliance:', err);
        setError('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };
    if (employees.length > 0) load();
  }, [employees]);

  const saveProfile = async (profile: DocumentProfile) => {
    try {
      if (profile.id) {
        await updateDocument(profilesCol, profile.id, profile);
        setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
      } else {
        const id = await addDocument(profilesCol, profile);
        setProfiles(prev => [{ ...profile, id }, ...prev]);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err;
    }
  };

  const deleteProfileHandler = async (id: string) => {
    try {
      await deleteDocument(profilesCol, id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting profile:', err);
      throw err;
    }
  };

  const updateDocumentHandler = async (employeeId: string, doc: Partial<DocumentRecord>) => {
    try {
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

      await updateDocument(complianceCol, record.id, updatedRecord);
      setComplianceData(prev => prev.map(c => c.employeeId === employeeId ? updatedRecord : c));
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  };

  const applyBatchDocs = async (role: string, department: string, docNames: string[]) => {
    try {
      const targets = employees.filter(e => e.role === role && (department === '' || e.department === department));
      const updatedRecords: EmployeeCompliance[] = [];

      for (const emp of targets) {
        const record = complianceData.find(c => c.employeeId === emp.id);
        if (record) {
          const currentDocs = [...record.documents];
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

          const updatedRecord = {
            ...record,
            documents: currentDocs,
            completionPercentage: mandatoryCount > 0 ? Math.round((verifiedCount / mandatoryCount) * 100) : 0,
            lastUpdate: new Date().toISOString()
          };

          await updateDocument(complianceCol, record.id, updatedRecord);
          updatedRecords.push(updatedRecord);
        }
      }

      setComplianceData(prev => prev.map(c => {
        const updated = updatedRecords.find(u => u.employeeId === c.employeeId);
        return updated || c;
      }));
    } catch (err) {
      console.error('Error applying batch docs:', err);
      throw err;
    }
  };

  return {
    complianceData,
    profiles,
    loading,
    error,
    updateDocument: updateDocumentHandler,
    applyBatchDocs,
    saveProfile,
    deleteProfile: deleteProfileHandler
  };
};
