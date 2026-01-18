import { useState, useEffect } from 'react';
import {
  SignatureDocument,
  SignatureInstanceStatus,
  SignatureSigner,
  SignatureEvidence,
  SignatureStatusChange
} from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

// Helper for SHA-256
async function generateHash(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.error('Hash generation error:', e);
    return 'hash-error-' + Date.now();
  }
}

// Generate simple access token (simulated JWT)
function generateAccessToken(): string {
  return btoa(crypto.randomUUID() + '.' + Date.now());
}

// Initial data with new structure
const INITIAL_DOCS: SignatureDocument[] = [
  {
    id: 'sig-demo-1',
    title: 'Consentimiento Teleradiología 2025',
    description: 'Protocolo de confidencialidad para staff médico.',
    origin: 'Interno_RichText',
    content: 'Por la presente, el profesional declara conocer y aceptar los protocolos de seguridad de la red AMIS. Se compromete a mantener la confidencialidad de toda información clínica y personal de los pacientes...',
    hashOriginal: '',
    status: 'Borrador',
    statusHistory: [],
    signers: [],
    requiredSignatures: 0,
    completedSignatures: 0,
    isSequential: false,
    evidenceLog: [],
    createdAt: new Date().toISOString(),
    createdBy: 'admin-1',
    updatedAt: new Date().toISOString()
  }
];

export interface CreateDocumentInput {
  title: string;
  description?: string;
  origin: 'Interno_RichText' | 'Externo_PDF';
  content?: string;
  fileUrl?: string;
  signers: SignerInput[];
  isSequential: boolean;
  expiresAt?: string;
  createdBy: string;
}

export interface SignerInput {
  employeeId?: string;
  fullName: string;
  email: string;
  role?: string;
  order: number;
}

export const useSignatures = () => {
  const [documents, setDocuments] = useState<SignatureDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collection = 'signature_instances';

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let data = await getDocuments<SignatureDocument>(collection, 'createdAt');

      // Seed initial data if empty
      if (data.length === 0) {
        console.log('Seeding signature documents...');
        for (const doc of INITIAL_DOCS) {
          const hash = await generateHash(doc.content || doc.title);
          await addDocument(collection, { ...doc, hashOriginal: hash });
        }
        data = await getDocuments<SignatureDocument>(collection, 'createdAt');
      }

      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('Error loading signatures:', err);
      setError('Error al cargar documentos de firma');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new document with signers
  const createDocument = async (input: CreateDocumentInput): Promise<SignatureDocument> => {
    try {
      const now = new Date().toISOString();
      const contentToHash = input.content || input.fileUrl || input.title;
      const hashOriginal = await generateHash(contentToHash);

      // Build signers array
      const signers: SignatureSigner[] = input.signers.map(s => ({
        id: crypto.randomUUID(),
        employeeId: s.employeeId,
        isManualEntry: !s.employeeId,
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        order: s.order,
        status: 'Pendiente',
        accessToken: generateAccessToken(),
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));

      // Initial evidence
      const evidence: SignatureEvidence = {
        id: crypto.randomUUID(),
        signerId: 'system',
        instanceId: '',
        timestamp: now,
        event: 'created',
        ipAddress: '0.0.0.0',
        detail: `Documento creado con ${signers.length} firmante(s) asignado(s)`,
        hashSnapshot: hashOriginal
      };

      const newDoc: Omit<SignatureDocument, 'id'> = {
        title: input.title,
        description: input.description || '',
        origin: input.origin,
        content: input.content || '',
        fileUrl: input.fileUrl || '',
        hashOriginal,
        status: 'Borrador',
        statusHistory: [{
          status: 'Borrador',
          changedAt: now,
          changedBy: input.createdBy,
          notes: 'Documento creado'
        }],
        signers,
        requiredSignatures: signers.length,
        completedSignatures: 0,
        isSequential: input.isSequential,
        evidenceLog: [evidence],
        createdAt: now,
        createdBy: input.createdBy,
        updatedAt: now,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
      };

      const id = await addDocument(collection, newDoc);
      const docWithId = { ...newDoc, id } as SignatureDocument;

      setDocuments(prev => [docWithId, ...prev]);
      return docWithId;
    } catch (err) {
      console.error('Error creating document:', err);
      throw err;
    }
  };

  // Send document for signing (Borrador → Pendiente)
  const sendForSigning = async (docId: string, userId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || doc.status !== 'Borrador') return;

    const now = new Date().toISOString();
    const updates: Partial<SignatureDocument> = {
      status: 'Pendiente',
      updatedAt: now,
      statusHistory: [...doc.statusHistory, {
        status: 'Pendiente',
        changedAt: now,
        changedBy: userId,
        notes: 'Documento enviado a firmar'
      }],
      evidenceLog: [...doc.evidenceLog, {
        id: crypto.randomUUID(),
        signerId: 'system',
        instanceId: doc.id,
        timestamp: now,
        event: 'sent',
        ipAddress: '0.0.0.0',
        detail: 'Notificaciones enviadas a firmantes',
        hashSnapshot: doc.hashOriginal
      }]
    };

    await updateDocument(collection, docId, updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
  };

  // Apply signature from a signer
  const applySignature = async (
    docId: string,
    signerId: string,
    signatureData: string,
    ipAddress: string = '0.0.0.0'
  ) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const signer = doc.signers.find(s => s.id === signerId);
    if (!signer || signer.status !== 'Pendiente') return;

    // Check sequential order
    if (doc.isSequential) {
      const pendingBefore = doc.signers.filter(s => s.order < signer.order && s.status === 'Pendiente');
      if (pendingBefore.length > 0) {
        throw new Error('Debe esperar a que firmen los firmantes anteriores');
      }
    }

    const now = new Date().toISOString();
    const newHash = await generateHash((doc.content || '') + signatureData + now);

    // Update signer
    const updatedSigners = doc.signers.map(s =>
      s.id === signerId
        ? { ...s, status: 'Firmado' as const, signedAt: now, signatureData, ipAddress }
        : s
    );

    const newCompletedCount = updatedSigners.filter(s => s.status === 'Firmado').length;
    const allSigned = newCompletedCount === doc.requiredSignatures;

    const newStatus: SignatureInstanceStatus = allSigned ? 'Firmado' : 'EnProceso';

    const updates: Partial<SignatureDocument> = {
      signers: updatedSigners,
      completedSignatures: newCompletedCount,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...doc.statusHistory, {
        status: newStatus,
        changedAt: now,
        changedBy: signerId,
        notes: allSigned ? 'Todas las firmas completadas' : `Firma aplicada por ${signer.fullName}`
      }],
      evidenceLog: [...doc.evidenceLog, {
        id: crypto.randomUUID(),
        signerId,
        instanceId: doc.id,
        timestamp: now,
        event: allSigned ? 'completed' : 'signed',
        ipAddress,
        detail: `Firma aplicada por ${signer.fullName}`,
        hashSnapshot: newHash
      }],
      ...(allSigned && { hashFinal: newHash, completedAt: now })
    };

    await updateDocument(collection, docId, updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
  };

  // Reject signature
  const rejectSignature = async (
    docId: string,
    signerId: string,
    reason: string,
    ipAddress: string = '0.0.0.0'
  ) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const signer = doc.signers.find(s => s.id === signerId);
    if (!signer) return;

    const now = new Date().toISOString();

    const updatedSigners = doc.signers.map(s =>
      s.id === signerId
        ? { ...s, status: 'Rechazado' as const, rejectionReason: reason }
        : s
    );

    const updates: Partial<SignatureDocument> = {
      signers: updatedSigners,
      status: 'Rechazado',
      updatedAt: now,
      statusHistory: [...doc.statusHistory, {
        status: 'Rechazado',
        changedAt: now,
        changedBy: signerId,
        notes: `Rechazado por ${signer.fullName}: ${reason}`
      }],
      evidenceLog: [...doc.evidenceLog, {
        id: crypto.randomUUID(),
        signerId,
        instanceId: doc.id,
        timestamp: now,
        event: 'rejected',
        ipAddress,
        detail: `Rechazado: ${reason}`,
        hashSnapshot: doc.hashOriginal
      }]
    };

    await updateDocument(collection, docId, updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
  };

  // Add signer to draft document
  const addSigner = async (docId: string, signer: SignerInput) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || doc.status !== 'Borrador') return;

    const newSigner: SignatureSigner = {
      id: crypto.randomUUID(),
      employeeId: signer.employeeId,
      isManualEntry: !signer.employeeId,
      fullName: signer.fullName,
      email: signer.email,
      role: signer.role,
      order: signer.order,
      status: 'Pendiente',
      accessToken: generateAccessToken(),
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updates: Partial<SignatureDocument> = {
      signers: [...doc.signers, newSigner],
      requiredSignatures: doc.requiredSignatures + 1,
      updatedAt: new Date().toISOString()
    };

    await updateDocument(collection, docId, updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
  };

  // Remove signer from draft
  const removeSigner = async (docId: string, signerId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || doc.status !== 'Borrador') return;

    const updates: Partial<SignatureDocument> = {
      signers: doc.signers.filter(s => s.id !== signerId),
      requiredSignatures: Math.max(0, doc.requiredSignatures - 1),
      updatedAt: new Date().toISOString()
    };

    await updateDocument(collection, docId, updates);
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...updates } : d));
  };

  // Delete document
  const deleteDoc = async (docId: string) => {
    await deleteDocument(collection, docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Get documents by status
  const getByStatus = (status: SignatureInstanceStatus) =>
    documents.filter(d => d.status === status);

  // Get pending for specific signer email
  const getPendingForSigner = (email: string) =>
    documents.filter(d =>
      d.status !== 'Borrador' &&
      d.signers.some(s => s.email === email && s.status === 'Pendiente')
    );

  return {
    documents,
    loading,
    error,
    createDocument,
    sendForSigning,
    applySignature,
    rejectSignature,
    addSigner,
    removeSigner,
    deleteDocument: deleteDoc,
    getByStatus,
    getPendingForSigner,
    reload: loadDocuments
  };
};
