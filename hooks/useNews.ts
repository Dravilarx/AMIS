
import { useState, useEffect } from 'react';
import { NewsPost } from '../types';
import { addDocument, getDocuments, deleteDocument } from '../services/firestoreService';

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
  const [error, setError] = useState<string | null>(null);
  const collection = 'announcements';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDocuments<NewsPost>(collection, 'timestamp');

        // If no data exists, seed with initial news
        if (data.length === 0) {
          console.log('No announcements found, seeding initial data...');
          for (const post of INITIAL_NEWS) {
            await addDocument(collection, post);
          }
          const seededData = await getDocuments<NewsPost>(collection, 'timestamp');
          setNews(seededData);
        } else {
          setNews(data);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading news:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news');
        // Fallback to initial data if Firestore fails
        setNews(INITIAL_NEWS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addPost = async (postData: Omit<NewsPost, 'id' | 'timestamp'>) => {
    try {
      const newPost = {
        ...postData,
        timestamp: new Date().toISOString()
      };
      const id = await addDocument<NewsPost>(collection, newPost);
      const postWithId = { ...newPost, id };
      setNews(prev => [postWithId, ...prev]);
      return postWithId;
    } catch (err) {
      console.error('Error adding post:', err);
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setNews(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  return { news, loading, error, addPost, deletePost };
};
