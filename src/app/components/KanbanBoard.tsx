'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, DragStart } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
  status: 'todo' | 'inProgress' | 'done';
}

interface DbTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CompletedEntry {
  id: number;
  task_id: string;
  title: string;
  description: string | null;
  priority: string;
  completed_at: string;
}

interface KanbanBoardProps {
  tasks?: Task[];
  onTaskMove?: (taskId: string, newStatus: string) => void;
}

function dbToTask(db: DbTask): Task {
  return {
    id: db.id,
    title: db.title,
    description: db.description || undefined,
    priority: (db.priority as Task['priority']) || 'medium',
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    status: (db.status as Task['status']) || 'todo',
  };
}

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string, description: string, priority: Task['priority']) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim(), priority);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-white/60 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-white/60 mb-1">Description / Agent Prompt</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the task in detail — your OpenClaw agent will read this when working on it"
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-white/60 mb-2">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${
                    priority === p
                      ? p === 'low' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : p === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTaskModal({ task, onClose, onConfirm }: { task: Task; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delete Task</h2>
            <p className="text-gray-500 dark:text-white/50 text-sm">This action cannot be undone</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-5">
          <p className="text-gray-900 dark:text-white font-medium text-sm">{task.title}</p>
          {task.description && (
            <p className="text-gray-500 dark:text-white/40 text-xs mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ onTaskMove }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [completedLog, setCompletedLog] = useState<CompletedEntry[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const [tasksRes, completedRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks?completed=true'),
      ]);
      if (tasksRes.ok) {
        const data: DbTask[] = await tasksRes.json();
        setTasks(data.map(dbToTask));
      }
      if (completedRes.ok) {
        const data: CompletedEntry[] = await completedRes.json();
        setCompletedLog(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const syncTask = async (task: Task, method: 'POST' | 'PUT' | 'DELETE' = 'PUT') => {
    setSyncing(true);
    try {
      await fetch('/api/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'DELETE' ? { id: task.id } : {
          id: task.id,
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          status: task.status,
        }),
      });
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  const handleDragStart = (_start: DragStart) => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId as Task['status'];

    const task = tasks.find(t => t.id === taskId);

    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      const movedTask = updated.find(t => t.id === taskId);
      if (movedTask) syncTask(movedTask);
      return updated;
    });

    // Optimistically add to completed log when moving to done
    if (newStatus === 'done' && task && !completedLog.some(e => e.task_id === task.id)) {
      setCompletedLog(prev => [{
        id: Date.now(),
        task_id: task.id,
        title: task.title,
        description: task.description || null,
        priority: task.priority,
        completed_at: new Date().toISOString(),
      }, ...prev]);
    }

    onTaskMove?.(taskId, newStatus);
  };

  const addTask = (title: string, description: string, priority: Task['priority']) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: description || undefined,
      priority,
      createdAt: new Date().toISOString(),
      status: 'todo',
    };

    setTasks(prev => [...prev, newTask]);
    syncTask(newTask, 'POST');
  };

  const requestDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) setDeleteTarget(task);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTasks(prev => prev.filter(t => t.id !== deleteTarget.id));
    syncTask(deleteTarget, 'DELETE');
    setDeleteTarget(null);
  };

  const getTasksByStatus = (status: Task['status']) =>
    tasks.filter(task => task.status === status);

  const visibleCompleted = showAllCompleted ? completedLog : completedLog.slice(0, 5);

  if (!loaded) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-500 dark:text-white/60 text-sm">
            Drag and drop to update status
            {syncing && <span className="ml-2 text-amber-400">Saving...</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-card px-4 py-2 text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-4 pb-4">
          <KanbanColumn id="todo" title="To Do" tasks={getTasksByStatus('todo')} color="purple" isDragging={isDragging} onDelete={requestDelete} />
          <KanbanColumn id="inProgress" title="In Progress" tasks={getTasksByStatus('inProgress')} color="amber" isDragging={isDragging} onDelete={requestDelete} />
          <KanbanColumn id="done" title="Done" tasks={getTasksByStatus('done')} color="green" isDragging={isDragging} onDelete={requestDelete} />
        </div>
      </DragDropContext>

      {/* Completed History */}
      {completedLog.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Completed</h2>
            <span className="bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/60 text-sm px-2 py-1 rounded-full">
              {completedLog.length}
            </span>
          </div>
          <div className="space-y-2">
            {visibleCompleted.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="min-w-0">
                    <span className="text-gray-700 dark:text-white/70 truncate block">{entry.title}</span>
                    {entry.description && (
                      <span className="text-gray-400 dark:text-white/30 text-xs truncate block">{entry.description}</span>
                    )}
                  </div>
                </div>
                <span className="text-gray-400 dark:text-white/30 text-xs flex-shrink-0 ml-3">
                  {new Date(entry.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          {completedLog.length > 5 && (
            <button
              onClick={() => setShowAllCompleted(!showAllCompleted)}
              className="mt-3 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 text-sm transition-colors"
            >
              {showAllCompleted ? 'Show less' : `Show all ${completedLog.length} completed tasks`}
            </button>
          )}
        </div>
      )}

      <div className="mt-6 text-center text-gray-400 dark:text-white/40 text-sm">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} &bull; Synced to database
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={addTask} />}
      {deleteTarget && <DeleteTaskModal task={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </div>
  );
}
