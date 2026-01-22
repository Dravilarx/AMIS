import React, { useState, useRef } from 'react';
import {
    Layers,
    Plus,
    MoreVertical,
    Calendar,
    Table,
    LayoutGrid,
    BarChart3,
    Flag,
    Clock,
    Users,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    X,
    Edit2,
    Trash2,
    GripVertical,
    AlertCircle,
    CheckCircle2,
    Circle,
    Archive,
    Search,
    Filter
} from 'lucide-react';
import { useControlGestion, STATUS_LABELS, PRIORITY_COLORS } from '../hooks/useControlGestion';
import { useEmployees } from '../hooks/useEmployees';
import type { ControlProject, ControlTask, CGTaskStatus, CGTaskPriority } from '../types';

// Project colors
const PROJECT_COLORS = [
    '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
];

type ViewMode = 'kanban' | 'calendar' | 'table' | 'dashboard';

interface ControlGestionModuleProps {
    isDark: boolean;
}

const ControlGestionModule: React.FC<ControlGestionModuleProps> = ({ isDark }) => {
    const {
        projects,
        tasks,
        loading,
        createProject,
        updateProject,
        archiveProject,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        getTasksByStatus,
        getProjectStats
    } = useControlGestion();

    const { employees } = useEmployees();

    // State
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingProject, setEditingProject] = useState<ControlProject | null>(null);
    const [editingTask, setEditingTask] = useState<ControlTask | null>(null);
    const [quickAddColumn, setQuickAddColumn] = useState<CGTaskStatus | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Drag state
    const [draggedTask, setDraggedTask] = useState<ControlTask | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<CGTaskStatus | null>(null);

    // Get selected project
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const projectStatuses: CGTaskStatus[] = selectedProject?.customStatuses ||
        ['backlog', 'todo', 'in_progress', 'review', 'done'];

    // Filtered tasks for current project
    const projectTasks = selectedProjectId
        ? tasks.filter(t => t.projectIds.includes(selectedProjectId))
        : [];

    // Search filter
    const filteredTasks = searchQuery
        ? projectTasks.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : projectTasks;

    // ========== PROJECT MODAL ==========
    const ProjectModal = () => {
        const [name, setName] = useState(editingProject?.name || '');
        const [description, setDescription] = useState(editingProject?.description || '');
        const [color, setColor] = useState(editingProject?.color || PROJECT_COLORS[0]);

        const handleSave = async () => {
            if (!name.trim()) return;

            const data = {
                name,
                description,
                color,
                ownerId: 'current-user', // TODO: get from auth
                members: []
            };

            if (editingProject) {
                await updateProject(editingProject.id, data);
            } else {
                const newId = await createProject(data);
                setSelectedProjectId(newId);
            }

            setShowProjectModal(false);
            setEditingProject(null);
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className={`w-full max-w-md rounded-3xl p-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                    </h2>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nombre del proyecto"
                            className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />

                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descripción (opcional)"
                            rows={3}
                            className={`w-full p-3 rounded-xl border outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />

                        <div>
                            <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Color</label>
                            <div className="flex gap-2">
                                {PROJECT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => { setShowProjectModal(false); setEditingProject(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white disabled:opacity-40"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ========== TASK MODAL ==========
    const TaskModal = () => {
        const [title, setTitle] = useState(editingTask?.title || '');
        const [description, setDescription] = useState(editingTask?.description || '');
        const [priority, setPriority] = useState<CGTaskPriority>(editingTask?.priority || 'medium');
        const [status, setStatus] = useState<CGTaskStatus>(editingTask?.status || 'todo');
        const [dueDate, setDueDate] = useState(editingTask?.dueDate?.split('T')[0] || '');
        const [assigneeIds, setAssigneeIds] = useState<string[]>(editingTask?.assigneeIds || []);

        const handleSave = async () => {
            if (!title.trim() || !selectedProjectId) return;

            const data = {
                title,
                description,
                priority,
                status,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                assigneeIds,
                projectIds: [selectedProjectId],
                tags: [],
                linkedDocuments: [],
                order: 0,
                createdBy: 'current-user' // TODO: get from auth
            };

            if (editingTask) {
                await updateTask(editingTask.id, data);
            } else {
                await createTask(data);
            }

            setShowTaskModal(false);
            setEditingTask(null);
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className={`w-full max-w-lg rounded-3xl p-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
                    </h2>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Título de la tarea"
                            className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />

                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descripción (opcional)"
                            rows={3}
                            className={`w-full p-3 rounded-xl border outline-none resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Estado</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as CGTaskStatus)}
                                    className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                >
                                    {projectStatuses.map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Prioridad</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as CGTaskPriority)}
                                    className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Fecha límite</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>

                        <div>
                            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Asignados</label>
                            <div className="flex flex-wrap gap-2">
                                {employees.slice(0, 8).map(emp => (
                                    <button
                                        key={emp.id}
                                        onClick={() => {
                                            if (assigneeIds.includes(emp.id)) {
                                                setAssigneeIds(assigneeIds.filter(id => id !== emp.id));
                                            } else {
                                                setAssigneeIds([...assigneeIds, emp.id]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${assigneeIds.includes(emp.id)
                                            ? 'bg-indigo-600 text-white'
                                            : isDark ? 'bg-slate-800 text-white/60' : 'bg-slate-100 text-slate-600'
                                            }`}
                                    >
                                        {emp.firstName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                        >
                            Cancelar
                        </button>
                        {editingTask && (
                            <button
                                onClick={async () => {
                                    await deleteTask(editingTask.id);
                                    setShowTaskModal(false);
                                    setEditingTask(null);
                                }}
                                className="py-3 px-4 rounded-xl font-bold bg-red-600 text-white"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white disabled:opacity-40"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ========== CALENDAR VIEW ==========
    const CalendarView = () => {
        const [currentDate, setCurrentDate] = useState(new Date());
        const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

        const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (year: number, month: number) => {
            const day = new Date(year, month, 1).getDay();
            return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
        };

        const generateCalendarDays = () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = getDaysInMonth(year, month);
            const firstDay = getFirstDayOfMonth(year, month);
            const days: { date: Date; isCurrentMonth: boolean }[] = [];

            // Previous month padding
            const prevMonthDate = new Date(year, month, 0);
            for (let i = firstDay - 1; i >= 0; i--) {
                days.push({
                    date: new Date(year, month - 1, prevMonthDate.getDate() - i),
                    isCurrentMonth: false
                });
            }

            // Current month
            for (let i = 1; i <= daysInMonth; i++) {
                days.push({
                    date: new Date(year, month, i),
                    isCurrentMonth: true
                });
            }

            // Next month padding to fill 6 rows (42 days)
            const remainingDays = 42 - days.length;
            for (let i = 1; i <= remainingDays; i++) {
                days.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false
                });
            }

            return days;
        };

        const generateWeekDays = () => {
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            startOfWeek.setDate(diff);

            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                days.push({ date: d, isCurrentMonth: true });
            }
            return days;
        };

        const days = calendarMode === 'month' ? generateCalendarDays() : generateWeekDays();

        const changePeriod = (delta: number) => {
            const newDate = new Date(currentDate);
            if (calendarMode === 'month') {
                newDate.setMonth(newDate.getMonth() + delta);
            } else {
                newDate.setDate(newDate.getDate() + (delta * 7));
            }
            setCurrentDate(newDate);
        };

        const isToday = (date: Date) => {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
        };

        const getTasksForDate = (date: Date) => {
            return filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate.getDate() === date.getDate() &&
                    taskDate.getMonth() === date.getMonth() &&
                    taskDate.getFullYear() === date.getFullYear();
            });
        };

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Calendar Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold dark:text-white">
                            {calendarMode === 'month'
                                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                : `Semana del ${days[0].date.getDate()} de ${monthNames[days[0].date.getMonth()]}`
                            }
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => changePeriod(-1)}
                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"
                            >
                                <ChevronLeft className="w-5 h-5 dark:text-white" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 text-sm font-medium dark:text-white hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => changePeriod(1)}
                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"
                            >
                                <ChevronRight className="w-5 h-5 dark:text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setCalendarMode('month')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${calendarMode === 'month'
                                ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setCalendarMode('week')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${calendarMode === 'week'
                                ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                        {dayNames.map(day => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Cells */}
                    <div className={`flex-1 grid grid-cols-7 ${calendarMode === 'month' ? 'grid-rows-6' : 'grid-rows-1'}`}>
                        {days.map((dayObj, idx) => {
                            const dayTasks = getTasksForDate(dayObj.date);
                            const isCurrentDay = isToday(dayObj.date);

                            return (
                                <div
                                    key={idx}
                                    className={`border-b border-r border-slate-200 dark:border-slate-800 p-2 min-h-0 overflow-y-auto relative group
                                        ${!dayObj.isCurrentMonth && calendarMode === 'month' ? 'bg-slate-50 dark:bg-slate-800/50' : ''}
                                        ${isCurrentDay ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
                                    `}
                                    onClick={() => {
                                        // Optional: Add new task on date click
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isCurrentDay
                                                ? 'bg-indigo-600 text-white'
                                                : dayObj.isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
                                            }
                                        `}>
                                            {dayObj.date.getDate()}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {dayTasks.map(task => (
                                            <button
                                                key={task.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTask(task);
                                                    setShowTaskModal(true);
                                                }}
                                                className={`w-full text-left p-1.5 rounded-lg text-xs font-medium border border-l-4 transition-all hover:scale-[1.02] truncate
                                                    ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'} ${PRIORITY_COLORS[task.priority].border}
                                                `}
                                            >
                                                {task.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ========== TABLE VIEW ==========
    const TableView = () => {
        const [sortConfig, setSortConfig] = useState<{ key: keyof ControlTask | 'assignees'; direction: 'asc' | 'desc' } | null>(null);

        const handleSort = (key: keyof ControlTask | 'assignees') => {
            let direction: 'asc' | 'desc' = 'asc';
            if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
                direction = 'desc';
            }
            setSortConfig({ key, direction });
        };

        const sortedTasks = [...filteredTasks].sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            let valA: any = a[key as keyof ControlTask] || '';
            let valB: any = b[key as keyof ControlTask] || '';

            if (key === 'assignees') {
                valA = employees.filter(e => a.assigneeIds.includes(e.id)).map(e => e.firstName).join('');
                valB = employees.filter(e => b.assigneeIds.includes(e.id)).map(e => e.firstName).join('');
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        const SortIcon = ({ columnKey }: { columnKey: string }) => {
            if (sortConfig?.key !== columnKey) return <div className="w-4 h-4" />;
            return sortConfig.direction === 'asc'
                ? <ChevronUp className="w-4 h-4 ml-1" />
                : <ChevronDown className="w-4 h-4 ml-1" />;
        };

        return (
            <div className={`rounded-xl overflow-hidden border flex flex-col h-full ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Table Header */}
                <div className={`grid grid-cols-12 gap-4 p-4 border-b text-sm font-semibold sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <div
                        className="col-span-4 flex items-center cursor-pointer hover:text-indigo-500"
                        onClick={() => handleSort('title')}
                    >
                        Tarea <SortIcon columnKey="title" />
                    </div>
                    <div
                        className="col-span-2 flex items-center cursor-pointer hover:text-indigo-500"
                        onClick={() => handleSort('status')}
                    >
                        Estado <SortIcon columnKey="status" />
                    </div>
                    <div
                        className="col-span-2 flex items-center cursor-pointer hover:text-indigo-500"
                        onClick={() => handleSort('priority')}
                    >
                        Prioridad <SortIcon columnKey="priority" />
                    </div>
                    <div
                        className="col-span-2 flex items-center cursor-pointer hover:text-indigo-500"
                        onClick={() => handleSort('dueDate')}
                    >
                        Fecha Límite <SortIcon columnKey="dueDate" />
                    </div>
                    <div
                        className="col-span-2 flex items-center cursor-pointer hover:text-indigo-500"
                        onClick={() => handleSort('assignees')}
                    >
                        Asignados <SortIcon columnKey="assignees" />
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-y-auto flex-1">
                    {sortedTasks.length === 0 ? (
                        <div className={`p-8 text-center ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            No hay tareas que mostrar
                        </div>
                    ) : (
                        sortedTasks.map((task) => {
                            const assignees = employees.filter(e => task.assigneeIds.includes(e.id));
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                                    className={`grid grid-cols-12 gap-4 p-4 border-b items-center text-sm cursor-pointer transition-colors
                                        ${isDark
                                            ? 'border-slate-800 text-white/80 hover:bg-slate-800'
                                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    <div className="col-span-4 font-medium truncate pr-4">
                                        {task.title}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                                            ${task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    task.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {STATUS_LABELS[task.status]}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text}`}>
                                            {task.priority === 'urgent' ? '🔥 ' : ''}{task.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        {task.dueDate ? (
                                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                                                <Clock className="w-3 h-3" />
                                                {new Date(task.dueDate).toLocaleDateString('es-CL')}
                                            </div>
                                        ) : (
                                            <span className="opacity-30 text-xs">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {assignees.map(a => (
                                                <div
                                                    key={a.id}
                                                    className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                                                    title={`${a.firstName} ${a.lastName}`}
                                                >
                                                    {a.firstName[0]}
                                                </div>
                                            ))}
                                            {assignees.length === 0 && <span className="opacity-30 text-xs">-</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    // ========== KANBAN COLUMN ==========
    const KanbanColumn = ({ status }: { status: CGTaskStatus }) => {
        const columnTasks = getTasksByStatus(selectedProjectId || '', status);
        const quickAddRef = useRef<HTMLInputElement>(null);

        const handleDrop = async (e: React.DragEvent) => {
            e.preventDefault();
            if (draggedTask && draggedTask.status !== status) {
                await moveTask(draggedTask.id, status, columnTasks.length);
            }
            setDraggedTask(null);
            setDragOverColumn(null);
        };

        const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && quickAddRef.current?.value.trim()) {
                await createTask({
                    title: quickAddRef.current.value.trim(),
                    status,
                    priority: 'medium',
                    projectIds: [selectedProjectId!],
                    assigneeIds: [],
                    tags: [],
                    linkedDocuments: [],
                    order: columnTasks.length,
                    createdBy: 'current-user'
                });
                quickAddRef.current.value = '';
                setQuickAddColumn(null);
            }
        };

        const statusColors: Record<CGTaskStatus, string> = {
            backlog: 'bg-slate-500',
            todo: 'bg-blue-500',
            in_progress: 'bg-amber-500',
            review: 'bg-purple-500',
            done: 'bg-emerald-500',
            blocked: 'bg-red-500'
        };

        return (
            <div
                className={`flex-1 min-w-[280px] max-w-[320px] rounded-2xl p-3 transition-all ${dragOverColumn === status
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                    : isDark ? 'bg-slate-800/50' : 'bg-slate-100'
                    }`}
                onDragOver={e => { e.preventDefault(); setDragOverColumn(status); }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={handleDrop}
            >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {STATUS_LABELS[status]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-white/60' : 'bg-slate-200 text-slate-600'}`}>
                            {columnTasks.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setQuickAddColumn(status)}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    >
                        <Plus className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
                    </button>
                </div>

                {/* Quick Add */}
                {quickAddColumn === status && (
                    <div className="mb-2">
                        <input
                            ref={quickAddRef}
                            autoFocus
                            type="text"
                            placeholder="Título y Enter..."
                            onKeyDown={handleQuickAdd}
                            onBlur={() => setQuickAddColumn(null)}
                            className={`w-full p-2 text-sm rounded-lg outline-none ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'}`}
                        />
                    </div>
                )}

                {/* Tasks */}
                <div className="space-y-2 min-h-[100px]">
                    {columnTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </div>
        );
    };

    // ========== TASK CARD ==========
    const TaskCard = ({ task }: { task: ControlTask }) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
        const assignees = employees.filter(e => task.assigneeIds.includes(e.id));

        return (
            <div
                draggable
                onDragStart={() => setDraggedTask(task)}
                onDragEnd={() => setDraggedTask(null)}
                onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:shadow-md'
                    } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
            >
                {/* Priority indicator */}
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority].bg} ${PRIORITY_COLORS[task.priority].text}`}>
                        {task.priority === 'urgent' ? '🔥' : task.priority === 'high' ? '⬆️' : task.priority === 'low' ? '⬇️' : ''} {task.priority.toUpperCase()}
                    </span>
                </div>

                {/* Title */}
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {task.title}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    {/* Due date */}
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-500' : isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}
                        </div>
                    )}

                    {/* Assignees */}
                    {assignees.length > 0 && (
                        <div className="flex -space-x-2">
                            {assignees.slice(0, 3).map(a => (
                                <div
                                    key={a.id}
                                    className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900"
                                    title={`${a.firstName} ${a.lastName}`}
                                >
                                    {a.firstName[0]}
                                </div>
                            ))}
                            {assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                                    +{assignees.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ========== MAIN RENDER ==========
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Sidebar - Projects List */}
            <div className={`w-72 border-r flex flex-col ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Proyectos</h2>
                        <button
                            onClick={() => setShowProjectModal(true)}
                            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Projects List */}
                    <div className="space-y-1">
                        {projects.map(project => {
                            const stats = getProjectStats(project.id);
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProjectId(project.id)}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${selectedProjectId === project.id
                                        ? 'bg-indigo-600 text-white'
                                        : isDark ? 'hover:bg-slate-800 text-white/80' : 'hover:bg-slate-200 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{project.name}</p>
                                            <p className={`text-[10px] ${selectedProjectId === project.id ? 'text-white/60' : isDark ? 'text-white/40' : 'text-slate-500'}`}>
                                                {stats.total} tareas • {stats.percentComplete}% completo
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {projects.length === 0 && (
                            <p className={`text-center py-8 text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                No hay proyectos aún
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedProject ? (
                    <>
                        {/* Header */}
                        <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {selectedProject.name}
                                    </h1>
                                    <button
                                        onClick={() => { setEditingProject(selectedProject); setShowProjectModal(true); }}
                                        className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                                    >
                                        <Edit2 className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Search */}
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <Search className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Buscar tareas..."
                                            className={`bg-transparent outline-none text-sm w-40 ${isDark ? 'text-white placeholder:text-white/40' : 'text-slate-900 placeholder:text-slate-400'}`}
                                        />
                                    </div>

                                    {/* View Toggle */}
                                    <div className={`flex rounded-xl p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        {[
                                            { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
                                            { mode: 'calendar' as ViewMode, icon: Calendar, label: 'Calendario' },
                                            { mode: 'table' as ViewMode, icon: Table, label: 'Tabla' },
                                            { mode: 'dashboard' as ViewMode, icon: BarChart3, label: 'Dashboard' }
                                        ].map(({ mode, icon: Icon, label }) => (
                                            <button
                                                key={mode}
                                                onClick={() => setViewMode(mode)}
                                                title={label}
                                                className={`p-2 rounded-lg transition-colors ${viewMode === mode
                                                    ? 'bg-indigo-600 text-white'
                                                    : isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* New Task */}
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nueva Tarea
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto p-4">
                            {viewMode === 'kanban' && (
                                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                                    {projectStatuses.map(status => (
                                        <KanbanColumn key={status} status={status} />
                                    ))}
                                </div>
                            )}

                            {viewMode === 'calendar' && (
                                <CalendarView />
                            )}

                            {viewMode === 'table' && (
                                <TableView />
                            )}

                            {viewMode === 'dashboard' && (
                                <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                    <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>Dashboard</p>
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Próximamente...</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* No Project Selected */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Layers className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>Selecciona un proyecto</p>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>o crea uno nuevo para comenzar</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showProjectModal && <ProjectModal />}
            {showTaskModal && <TaskModal />}
        </div>
    );
};

export default ControlGestionModule;
