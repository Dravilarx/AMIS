
import { useState, useEffect } from 'react';
import { AgrawallAnalysis } from '../types';
import { db } from '../services/db';

export const useAgrawall = () => {
  const [history, setHistory] = useState<AgrawallAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const collection = 'agrawall_history';

  useEffect(() => {
    const load = async () => {
      const data = await db.getAll<AgrawallAnalysis>(collection);
      setHistory(data);
      setLoading(false);
    };
    load();
  }, []);

  const saveAudit = async (analysis: AgrawallAnalysis) => {
    await db.add(collection, analysis);
    setHistory(prev => [analysis, ...prev]);
  };

  const deleteAudit = async (id: string) => {
    await db.delete(collection, id);
    setHistory(prev => prev.filter(a => a.id !== id));
  };

  return { history, loading, saveAudit, deleteAudit };
};
