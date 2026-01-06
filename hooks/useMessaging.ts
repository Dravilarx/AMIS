
import { useState, useEffect } from 'react';
import { Message } from '../types';
import { db } from '../services/db';

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
  const collection = 'messages';

  useEffect(() => {
    const load = async () => {
      let data = await db.getAll<Message>(collection);
      if (data.length === 0) {
        await db.saveAll(collection, INITIAL_MESSAGES);
        data = INITIAL_MESSAGES;
      }
      setMessages(data);
      setLoading(false);
    };
    load();
  }, []);

  const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'read' | 'folder'>) => {
    const newMessage: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      folder: 'sent'
    };
    
    // In a real app, this would be distributed to each recipient's inbox.
    // For this simulation, we save it once and the UI filters by user.
    await db.add(collection, newMessage);
    setMessages(prev => [newMessage, ...prev]);
    return newMessage;
  };

  const markAsRead = async (id: string) => {
    await db.update<Message>(collection, id, { read: true });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const deleteMessage = async (id: string) => {
    await db.update<Message>(collection, id, { folder: 'trash' });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m));
  };

  const permanentDelete = async (id: string) => {
    await db.delete(collection, id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return { messages, loading, sendMessage, markAsRead, deleteMessage, permanentDelete };
};
