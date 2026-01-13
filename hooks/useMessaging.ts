
import { useState, useEffect } from 'react';
import { Message } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument } from '../services/firestoreService';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    senderId: '1', // Julián Riquelme
    recipientIds: ['system-admin'],
    subject: 'Solicitud de Revisión Agrawall',
    content: 'Hola Admin, podrías revisar el último informe de la paciente Josefa? Me parece que el nivel asignado por la IA es muy alto.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    attachments: [
      { id: 'att-1', type: 'image', name: 'Captura_IA.png', url: '#' }
    ],
    folder: 'inbox'
  },
  {
    id: 'm-2',
    senderId: 'system-admin',
    recipientIds: ['1'],
    subject: 'Bienvenido al Centro de Mensajería',
    content: 'Hola Julián, este es el nuevo centro de mensajería seguro de AMIS. Aquí podrás compartir informes y archivos con todo el staff.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    attachments: [],
    folder: 'inbox'
  }
];

export const useMessaging = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const collection = 'messages';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let data = await getDocuments<Message>(collection, 'timestamp');
        if (data.length === 0) {
          console.log('No messages found, seeding...');
          for (const msg of INITIAL_MESSAGES) {
            await addDocument(collection, msg);
          }
          data = await getDocuments<Message>(collection, 'timestamp');
        }
        setMessages(data);
        setError(null);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messaging data');
        setMessages(INITIAL_MESSAGES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'read' | 'folder'>) => {
    try {
      const newMessage = {
        ...messageData,
        timestamp: new Date().toISOString(),
        read: false,
        folder: 'sent' as const
      };

      const id = await addDocument(collection, newMessage);
      const entryWithId = { ...newMessage, id } as Message;
      setMessages(prev => [entryWithId, ...prev]);
      return entryWithId;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDocument<Message>(collection, id, { read: true });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await updateDocument<Message>(collection, id, { folder: 'trash' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m));
    } catch (err) {
      console.error('Error moving message to trash:', err);
      throw err;
    }
  };

  const permanentDelete = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting message permanently:', err);
      throw err;
    }
  };

  return { messages, loading, error, sendMessage, markAsRead, deleteMessage, permanentDelete };
};
