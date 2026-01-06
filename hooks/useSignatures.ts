
import { useState, useEffect } from 'react';
import { SignatureDocument, SignatureStatus } from '../types';
import { db } from '../services/db';

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
  const collection = 'signature_documents';

  useEffect(() => {
    const load = async () => {
      let data = await db.getAll<SignatureDocument>(collection);
      if (data.length === 0) {
        await db.saveAll(collection, INITIAL_SIGNATURE_DOCS);
        data = INITIAL_SIGNATURE_DOCS;
      }
      setDocuments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    };
    load();
  }, []);

  const createDocument = async (doc: Omit<SignatureDocument, 'id' | 'createdAt' | 'status'>) => {
    const newDoc: SignatureDocument = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'Pendiente'
    };
    await db.add(collection, newDoc);
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const updateStatus = async (id: string, status: SignatureStatus, extraData: Partial<SignatureDocument> = {}) => {
    const updates: Partial<SignatureDocument> = { status, ...extraData };
    if (status === 'Visto') updates.viewedAt = new Date().toISOString();
    if (status === 'Firmado') updates.signedAt = new Date().toISOString();

    await db.update(collection, id, updates);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDocument = async (id: string) => {
    await db.delete(collection, id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return { documents, loading, createDocument, updateStatus, deleteDocument };
};
