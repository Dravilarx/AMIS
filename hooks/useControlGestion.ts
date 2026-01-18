import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    where,
    Timestamp
} from 'firebase/firestore';
import { firestore as db } from '../services/firebaseConfig';
import type { ControlProject, ControlTask, ControlMilestone, CGTaskStatus } from '../types';

const PROJECTS_COLLECTION = 'control_projects';
const TASKS_COLLECTION = 'control_tasks';
const MILESTONES_COLLECTION = 'control_milestones';

// Default statuses for new projects
const DEFAULT_STATUSES: CGTaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

// Status labels in Spanish
export const STATUS_LABELS: Record<CGTaskStatus, string> = {
    backlog: 'Backlog',
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    review: 'En Revisión',
    done: 'Completado',
    blocked: 'Bloqueado'
};

// Priority colors
export const PRIORITY_COLORS = {
    low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
    high: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
    urgent: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' }
};

export const useControlGestion = () => {
    const [projects, setProjects] = useState<ControlProject[]>([]);
    const [tasks, setTasks] = useState<ControlTask[]>([]);
    const [milestones, setMilestones] = useState<ControlMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time listener for projects
    useEffect(() => {
        const q = query(
            collection(db, PROJECTS_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const projectsData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as ControlProject))
                    .filter(p => !p.archivedAt); // Exclude archived
                setProjects(projectsData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching projects:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Real-time listener for tasks
    useEffect(() => {
        const q = query(
            collection(db, TASKS_COLLECTION),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ControlTask));
                setTasks(tasksData);
            },
            (err) => {
                console.error('Error fetching tasks:', err);
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, []);

    // Real-time listener for milestones
    useEffect(() => {
        const q = query(
            collection(db, MILESTONES_COLLECTION),
            orderBy('plannedDate', 'asc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const milestonesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ControlMilestone));
                setMilestones(milestonesData);
            },
            (err) => {
                console.error('Error fetching milestones:', err);
                setError(err.message);
            }
        );

        return () => unsubscribe();
    }, []);

    // ========== PROJECT OPERATIONS ==========

    const createProject = async (data: Omit<ControlProject, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = new Date().toISOString();
            const projectData = {
                ...data,
                customStatuses: data.customStatuses || DEFAULT_STATUSES,
                createdAt: now,
                updatedAt: now
            };

            const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
            return docRef.id;
        } catch (err) {
            console.error('Error creating project:', err);
            throw err;
        }
    };

    const updateProject = async (id: string, data: Partial<ControlProject>) => {
        try {
            const ref = doc(db, PROJECTS_COLLECTION, id);
            await updateDoc(ref, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating project:', err);
            throw err;
        }
    };

    const archiveProject = async (id: string) => {
        try {
            const ref = doc(db, PROJECTS_COLLECTION, id);
            await updateDoc(ref, {
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error archiving project:', err);
            throw err;
        }
    };

    // ========== TASK OPERATIONS ==========

    const createTask = async (data: Omit<ControlTask, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = new Date().toISOString();

            // Get max order for the status column
            const tasksInColumn = tasks.filter(t =>
                t.projectIds.some(pid => data.projectIds.includes(pid)) &&
                t.status === data.status
            );
            const maxOrder = tasksInColumn.length > 0
                ? Math.max(...tasksInColumn.map(t => t.order)) + 1
                : 0;

            const taskData = {
                ...data,
                order: data.order ?? maxOrder,
                tags: data.tags || [],
                linkedDocuments: data.linkedDocuments || [],
                assigneeIds: data.assigneeIds || [],
                createdAt: now,
                updatedAt: now
            };

            const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
            return docRef.id;
        } catch (err) {
            console.error('Error creating task:', err);
            throw err;
        }
    };

    const updateTask = async (id: string, data: Partial<ControlTask>) => {
        try {
            const ref = doc(db, TASKS_COLLECTION, id);
            const updateData: any = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            // If completing task
            if (data.status === 'done') {
                updateData.completedAt = new Date().toISOString();
            }

            await updateDoc(ref, updateData);
        } catch (err) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    const moveTask = async (taskId: string, newStatus: CGTaskStatus, newOrder: number) => {
        try {
            const ref = doc(db, TASKS_COLLECTION, taskId);
            await updateDoc(ref, {
                status: newStatus,
                order: newOrder,
                updatedAt: new Date().toISOString(),
                ...(newStatus === 'done' ? { completedAt: new Date().toISOString() } : {})
            });
        } catch (err) {
            console.error('Error moving task:', err);
            throw err;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await deleteDoc(doc(db, TASKS_COLLECTION, id));
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    };

    // ========== MILESTONE OPERATIONS ==========

    const createMilestone = async (data: Omit<ControlMilestone, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const now = new Date().toISOString();
            const milestoneData = {
                ...data,
                linkedTaskIds: data.linkedTaskIds || [],
                createdAt: now,
                updatedAt: now
            };

            const docRef = await addDoc(collection(db, MILESTONES_COLLECTION), milestoneData);
            return docRef.id;
        } catch (err) {
            console.error('Error creating milestone:', err);
            throw err;
        }
    };

    const updateMilestone = async (id: string, data: Partial<ControlMilestone>) => {
        try {
            const ref = doc(db, MILESTONES_COLLECTION, id);
            await updateDoc(ref, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating milestone:', err);
            throw err;
        }
    };

    const deleteMilestone = async (id: string) => {
        try {
            await deleteDoc(doc(db, MILESTONES_COLLECTION, id));
        } catch (err) {
            console.error('Error deleting milestone:', err);
            throw err;
        }
    };

    // ========== HELPER FUNCTIONS ==========

    const getTasksByProject = (projectId: string) => {
        return tasks.filter(t => t.projectIds.includes(projectId));
    };

    const getTasksByStatus = (projectId: string, status: CGTaskStatus) => {
        return tasks
            .filter(t => t.projectIds.includes(projectId) && t.status === status)
            .sort((a, b) => a.order - b.order);
    };

    const getMilestonesByProject = (projectId: string) => {
        return milestones.filter(m => m.projectId === projectId);
    };

    const getOverdueTasks = () => {
        const now = new Date().toISOString();
        return tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done');
    };

    const getProjectStats = (projectId: string) => {
        const projectTasks = getTasksByProject(projectId);
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.status === 'done').length;
        const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
        const blocked = projectTasks.filter(t => t.status === 'blocked').length;
        const overdue = projectTasks.filter(t => t.dueDate && t.dueDate < new Date().toISOString() && t.status !== 'done').length;

        return {
            total,
            completed,
            inProgress,
            blocked,
            overdue,
            percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    };

    return {
        // State
        projects,
        tasks,
        milestones,
        loading,
        error,

        // Project operations
        createProject,
        updateProject,
        archiveProject,

        // Task operations
        createTask,
        updateTask,
        moveTask,
        deleteTask,

        // Milestone operations
        createMilestone,
        updateMilestone,
        deleteMilestone,

        // Helpers
        getTasksByProject,
        getTasksByStatus,
        getMilestonesByProject,
        getOverdueTasks,
        getProjectStats
    };
};

export default useControlGestion;
