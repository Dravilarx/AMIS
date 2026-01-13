
import { useState, useEffect } from 'react';
import { AgrawallAnalysis } from '../types';
import { addDocument, getDocuments, deleteDocument } from '../services/firestoreService';

export const useAgrawall = () => {
  const [history, setHistory] = useState<AgrawallAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collection = 'agrawall_history';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDocuments<AgrawallAnalysis>(collection, 'timestamp');
        setHistory(data);
        setError(null);
      } catch (err) {
        console.error('Error loading agrawall history:', err);
        setError('Failed to load audit history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveAudit = async (analysis: AgrawallAnalysis) => {
    try {
      const id = await addDocument(collection, analysis);
      const entryWithId = { ...analysis, id };
      setHistory(prev => [entryWithId, ...prev]);
    } catch (err) {
      console.error('Error saving agrawall audit:', err);
      throw err;
    }
  };

  const deleteAudit = async (id: string) => {
    try {
      await deleteDocument(collection, id);
      setHistory(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting agrawall audit:', err);
      throw err;
    }
  };

  return { history, loading, error, saveAudit, deleteAudit };
};
