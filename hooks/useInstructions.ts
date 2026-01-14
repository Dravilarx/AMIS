
import { useState, useEffect } from 'react';
import { ProcedureInstructions } from '../types';
import { addDocument, getDocuments, updateDocument, deleteDocument, setDocument } from '../services/firestoreService';

const COLLECTION = 'procedure_instructions';

// Default instructions to seed if collection is empty
const DEFAULT_INSTRUCTIONS: Omit<ProcedureInstructions, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        procedureType: 'Biopsia Hepática',
        modality: 'US',
        fullInstructions: `Estimado(a) paciente,

Se le ha programado una BIOPSIA HEPÁTICA guiada por ecografía. Por favor siga estas indicaciones:

1. AYUNO: Debe presentarse con un ayuno mínimo de 8 horas (solo agua está permitida).
2. EXÁMENES PREVIOS: Traiga sus exámenes de coagulación (TP, TTPK, Plaquetas) realizados en los últimos 7 días.
3. ANTICOAGULANTES: Si toma aspirina, clopidogrel, warfarina u otro anticoagulante, debe suspenderlo según indicación de su médico tratante (usualmente 5-7 días antes).
4. ACOMPAÑANTE: Debe venir acompañado(a). No podrá conducir durante las 24 horas posteriores al procedimiento.
5. REPOSO: Posterior al procedimiento deberá permanecer en observación por 4-6 horas.

Ante cualquier duda, contáctenos.
Equipo AMIS Intervencionismo`,
        shortInstructions: `BIOPSIA HEPÁTICA: Ayuno 8hrs, traer exámenes coagulación, suspender anticoagulantes según indicación, venir acompañado. Reposo 4-6hrs post-procedimiento. Consultas: AMIS`,
        anticoagulantWarning: true,
        fastingHours: 8
    },
    {
        procedureType: 'Drenaje Percutáneo',
        modality: 'TAC',
        fullInstructions: `Estimado(a) paciente,

Se le ha programado un DRENAJE PERCUTÁNEO guiado por TAC. Por favor siga estas indicaciones:

1. AYUNO: Debe presentarse con un ayuno mínimo de 6 horas.
2. EXÁMENES: Traiga sus exámenes de laboratorio recientes (hemograma, creatinina, coagulación).
3. ALERGIAS: Informe si tiene alergia al yodo o medios de contraste.
4. MEDICAMENTOS: Continúe con sus medicamentos habituales, excepto anticoagulantes según indicación previa.
5. ACOMPAÑANTE: Obligatorio venir acompañado.

Equipo AMIS Intervencionismo`,
        shortInstructions: `DRENAJE PERCUTÁNEO: Ayuno 6hrs, traer exámenes lab, informar alergias a contraste, venir acompañado. Consultas: AMIS`,
        anticoagulantWarning: true,
        fastingHours: 6
    }
];

export const useInstructions = () => {
    const [instructions, setInstructions] = useState<ProcedureInstructions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getDocuments<ProcedureInstructions>(COLLECTION, 'procedureType');

                if (data.length === 0) {
                    // Seed default instructions
                    for (const inst of DEFAULT_INSTRUCTIONS) {
                        await addDocument(COLLECTION, inst);
                    }
                    const seeded = await getDocuments<ProcedureInstructions>(COLLECTION, 'procedureType');
                    setInstructions(seeded);
                } else {
                    setInstructions(data);
                }
                setError(null);
            } catch (err) {
                console.error('Error loading instructions:', err);
                setError('Failed to load procedure instructions');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addInstruction = async (instruction: Omit<ProcedureInstructions, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const id = await addDocument(COLLECTION, instruction);
            const newEntry = { ...instruction, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as ProcedureInstructions;
            setInstructions(prev => [...prev, newEntry]);
            return newEntry;
        } catch (err) {
            console.error('Error adding instruction:', err);
            throw err;
        }
    };

    const updateInstruction = async (id: string, updates: Partial<ProcedureInstructions>) => {
        try {
            await updateDocument(COLLECTION, id, updates);
            setInstructions(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
        } catch (err) {
            console.error('Error updating instruction:', err);
            throw err;
        }
    };

    const deleteInstruction = async (id: string) => {
        try {
            await deleteDocument(COLLECTION, id);
            setInstructions(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Error deleting instruction:', err);
            throw err;
        }
    };

    const getInstructionForProcedure = (procedureType: string): ProcedureInstructions | undefined => {
        return instructions.find(i => i.procedureType.toLowerCase() === procedureType.toLowerCase());
    };

    return {
        instructions,
        loading,
        error,
        addInstruction,
        updateInstruction,
        deleteInstruction,
        getInstructionForProcedure
    };
};
