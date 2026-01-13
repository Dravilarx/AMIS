
import { useState, useEffect } from 'react';
import { SignatureDocument, SignatureStatus } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_SIGNATURE_DOCS: SignatureDocument[] = [
  {
    id: 'sig-1',
    title: 'Consentimiento Teleradiología 2025',
    description: 'Protocolo de confidencialidad y tratamiento de datos para staff médico.',
    content: 'Por la presente, el profesional declara conocer y aceptar los protocolos de seguridad de la red AMIS...',
    status: 'Enviado',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    signerName: 'Dr. Julián Riquelme',
    signerRole: 'Neurorradiólogo',
    signerEmail: 'j.riquelme@amis.health'
  },
  {
    id: 'sig-2',
    title: 'Acuerdo de Honorarios Extraordinarios',
    description: 'Ajuste de tarifas para turnos festivos y emergencias.',
    content: 'Se acuerda un incremento del 20% en la tarifa base para lecturas realizadas en días festivos...',
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    signerName: 'Administración AMIS',
    signerRole: 'Dirección Médica',
    signerEmail: 'admin@amis.health'
  }
];

export const useSignatures = () => {
  const [documents, setDocuments] = useState<SignatureDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collection = 'signature_documents';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let data = await getDocuments<SignatureDocument>(collection, 'createdAt');
        if (data.length === 0) {
          console.log('No signature documents found, seeding...');
          for (const doc of INITIAL_SIGNATURE_DOCS) {
            await addDocument(collection, doc);
          }
          data = await getDocuments<SignatureDocument>(collection, 'createdAt');
        }
        setDocuments(data);
        setError(null);
      } catch (err) {
        console.error('Error loading signature documents:', err);
        setError('Failed to load signature data');
        setDocuments(INITIAL_SIGNATURE_DOCS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const createDocument = async (doc: Omit<SignatureDocument, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newDoc = {
        ...doc,
        createdAt: new Date().toISOString(),
        status: 'Pendiente' as SignatureStatus
      };
      const id = await addDocument(collection, newDoc);
      const entryWithId = { ...newDoc, id } as SignatureDocument;
      setDocuments(prev => [entryWithId, ...prev]);
      return entryWithId;
    } catch (err) {
      console.error('Error creating signature document:', err);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: SignatureStatus, extraData: Partial<SignatureDocument> = {}) => {
    try {
      const updates: Partial<SignatureDocument> = { status, ...extraData };
      if (status === 'Visto') updates.viewedAt = new Date().toISOString();
      if (status === 'Firmado') updates.signedAt = new Date().toISOString();

      await updateDocument<SignatureDocument>(collection, id, updates);
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (err) {
      console.error('Error updating signature status:', err);
      throw err;
    }
  };

  const deleteDocumentHandler = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting signature document:', err);
      throw err;
    }
  };

  return { documents, loading, error, createDocument, updateStatus, deleteDocument: deleteDocumentHandler };
};
