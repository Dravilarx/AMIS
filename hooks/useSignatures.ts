import { useState, useEffect } from 'react';
import { SignatureDocument, SignatureStatus, SignatureSigner, SignatureEvidence } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

// Initial Mock Data
const INITIAL_SIGNATURE_DOCS: SignatureDocument[] = [
  {
    id: 'sig-1',
    title: 'Consentimiento Teleradiología 2025',
    description: 'Protocolo de confidencialidad y tratamiento de datos para staff médico.',
    content: 'Por la presente, el profesional declara conocer y aceptar los protocolos de seguridad de la red AMIS...',
    origin: 'Interno_RichText',
    currentHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    status: 'Enviado',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'admin-1',
    signers: [
      {
        id: 'signer-1',
        name: 'Dr. Julián Riquelme',
        email: 'j.riquelme@amis.health',
        role: 'Neurorradiólogo',
        order: 1,
        status: 'Pendiente'
      }
    ],
    evidenceLog: [],
    // Legacy mapping
    signerName: 'Dr. Julián Riquelme',
    signerRole: 'Neurorradiólogo',
    signerEmail: 'j.riquelme@amis.health'
  },
  {
    id: 'sig-2',
    title: 'Acuerdo de Honorarios Extraordinarios',
    description: 'Ajuste de tarifas para turnos festivos y emergencias.',
    content: 'Se acuerda un incremento del 20% en la tarifa base para lecturas realizadas en días festivos...',
    origin: 'Interno_RichText',
    currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin-1',
    signers: [
      {
        id: 'signer-2',
        name: 'Administración AMIS',
        email: 'admin@amis.health',
        role: 'Dirección Médica',
        order: 1,
        status: 'Pendiente'
      }
    ],
    evidenceLog: [],
    // Legacy mapping
    signerName: 'Administración AMIS',
    signerRole: 'Dirección Médica',
    signerEmail: 'admin@amis.health'
  }
];

// Helper for SHA-256
async function generateHash(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content + new Date().toISOString()); // Add randomness
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'hash-gen-error-' + Date.now();
  }
}

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

  const createDocument = async (docData: any) => {
    try {
      const initialHash = await generateHash(docData.content || docData.title);

      const newDoc: Omit<SignatureDocument, 'id'> = {
        title: docData.title,
        description: docData.description,
        content: docData.content,
        origin: 'Interno_RichText', // Defaulting for now
        currentHash: initialHash,
        status: 'Pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user', // Should be passed
        signers: [{
          id: crypto.randomUUID(),
          name: docData.signerName,
          email: docData.signerEmail,
          role: docData.signerRole,
          order: 1,
          status: 'Pendiente'
        }],
        evidenceLog: [{
          id: crypto.randomUUID(),
          signerId: 'system',
          timestamp: new Date().toISOString(),
          event: 'created',
          ip: '127.0.0.1', // Mock IP
          detail: 'Documento creado y hash generado',
          hashSnapshot: initialHash
        }],
        // Legacy compat
        signerName: docData.signerName,
        signerRole: docData.signerRole
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

  const updateStatus = async (id: string, status: SignatureStatus, extraData: any = {}) => {
    try {
      // Find current doc to update evidence
      const currentDoc = documents.find(d => d.id === id);
      if (!currentDoc) return;

      const newHash = await generateHash(currentDoc.content || '' + status);

      const evidenceEntry: SignatureEvidence = {
        id: crypto.randomUUID(),
        signerId: currentDoc.signers[0]?.id || 'unknown',
        timestamp: new Date().toISOString(),
        event: status === 'Firmado' ? 'signed' : status === 'Visto' ? 'viewed' : 'rejected',
        ip: '192.168.1.1', // Mock
        detail: status === 'Firmado' ? 'Firma aplicada correctamente' : 'Estado actualizado a ' + status,
        hashSnapshot: newHash
      };

      const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
        evidenceLog: [...(currentDoc.evidenceLog || []), evidenceEntry],
        ...extraData
      };

      if (status === 'Visto') updates.viewedAt = new Date().toISOString();
      if (status === 'Firmado') {
        updates.signedAt = new Date().toISOString();
        updates.currentHash = newHash;
        // Update signer status
        if (currentDoc.signers.length > 0) {
          const updatedSigners = [...currentDoc.signers];
          updatedSigners[0] = {
            ...updatedSigners[0],
            status: 'Firmado',
            signedAt: new Date().toISOString(),
            signatureData: extraData.signatureData
          };
          updates.signers = updatedSigners;
        }
      }

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
