
import { useState, useEffect } from 'react';
import { NewsPost } from '../types';
import { db } from '../services/db';

const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news-1',
    authorId: 'system-admin',
    authorName: 'Administración AMIS',
    title: 'Nueva Acreditación Institucional Lograda',
    content: 'Nos complace informar que hemos renovado nuestra acreditación de calidad con un cumplimiento del 99.8%. Gracias a todo el equipo por su compromiso.',
    category: 'Noticia',
    targetRoles: ['Superuser', 'Jefatura', 'Médico', 'Técnico', 'Administrativo'],
    targetUserIds: [],
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    attachments: [
      { id: 'a1', type: 'image', name: 'Certificado.png', url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&auto=format&fit=crop&q=60' }
    ]
  },
  {
    id: 'news-2',
    authorId: '1',
    authorName: 'Dr. Julián Riquelme',
    title: 'Capacitación: Avances en IA aplicada a Neurorradiología',
    content: 'Estimados, el próximo viernes realizaremos un workshop sobre el uso de Gemini en la detección temprana de patologías cerebrales.',
    category: 'Evento',
    targetRoles: ['Médico', 'Técnico'],
    targetUserIds: [],
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    eventDate: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
    attachments: [
      { id: 'a2', type: 'link', name: 'Link de Registro', url: 'https://zoom.us' }
    ]
  }
];

export const useNews = () => {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const collection = 'news_posts';

  useEffect(() => {
    const load = async () => {
      let data = await db.getAll<NewsPost>(collection);
      if (data.length === 0) {
        await db.saveAll(collection, INITIAL_NEWS);
        data = INITIAL_NEWS;
      }
      setNews(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setLoading(false);
    };
    load();
  }, []);

  const addPost = async (postData: Omit<NewsPost, 'id' | 'timestamp'>) => {
    const newPost: NewsPost = {
      ...postData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    await db.add(collection, newPost);
    setNews(prev => [newPost, ...prev]);
    return newPost;
  };

  const deletePost = async (id: string) => {
    await db.delete(collection, id);
    setNews(prev => prev.filter(p => p.id !== id));
  };

  return { news, loading, addPost, deletePost };
};
