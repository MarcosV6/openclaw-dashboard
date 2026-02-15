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

export default function KanbanBoard({ onTaskMove }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data: DbTask[] = await res.json();
        setTasks(data.map(dbToTask));
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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

    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      const movedTask = updated.find(t => t.id === taskId);
      if (movedTask) syncTask(movedTask);
      return updated;
    });

    onTaskMove?.(taskId, newStatus);
  };

  const addTask = (status: Task['status']) => {
    const title = prompt('Task title:');
    if (!title?.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      priority: 'medium',
      createdAt: new Date().toISOString(),
      status,
    };

    setTasks(prev => [...prev, newTask]);
    syncTask(newTask, 'POST');
  };

  const deleteTask = (taskId: string) => {
    if (confirm('Delete this task?')) {
      const task = tasks.find(t => t.id === taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (task) syncTask(task, 'DELETE');
    }
  };

  const getTasksByStatus = (status: Task['status']) =>
    tasks.filter(task => task.status === status);

  const completedTasks = getTasksByStatus('done').sort((a, b) => {
    const dateA = a.updatedAt || a.createdAt;
    const dateB = b.updatedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const visibleCompleted = showAllCompleted ? completedTasks : completedTasks.slice(0, 5);

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
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-white/60 text-sm">
            Drag and drop to update status
            {syncing && <span className="ml-2 text-amber-400">Saving...</span>}
          </p>
        </div>
        <button
          onClick={() => addTask('todo')}
          className="glass-card px-4 py-2 text-white/80 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-4 pb-4">
          <KanbanColumn id="todo" title="To Do" tasks={getTasksByStatus('todo')} color="purple" isDragging={isDragging} onDelete={deleteTask} />
          <KanbanColumn id="inProgress" title="In Progress" tasks={getTasksByStatus('inProgress')} color="amber" isDragging={isDragging} onDelete={deleteTask} />
          <KanbanColumn id="done" title="Done" tasks={getTasksByStatus('done')} color="green" isDragging={isDragging} onDelete={deleteTask} />
        </div>
      </DragDropContext>

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="text-lg font-semibold text-white">Completed</h2>
            <span className="bg-white/10 text-white/60 text-sm px-2 py-1 rounded-full">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {visibleCompleted.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] group">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/70 truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-white/30 text-xs">
                    {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {completedTasks.length > 5 && (
            <button
              onClick={() => setShowAllCompleted(!showAllCompleted)}
              className="mt-3 text-white/40 hover:text-white/60 text-sm transition-colors"
            >
              {showAllCompleted ? 'Show less' : `Show all ${completedTasks.length} completed tasks`}
            </button>
          )}
        </div>
      )}

      <div className="mt-6 text-center text-white/40 text-sm">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} &bull; Synced to database
      </div>
    </div>
  );
}
