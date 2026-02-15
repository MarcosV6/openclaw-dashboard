'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete?: (taskId: string) => void;
}

const priorityColors = {
  low: 'border-l-blue-500',
  medium: 'border-l-amber-500',
  high: 'border-l-red-500',
};

const priorityBadges = {
  low: 'bg-blue-500/20 text-blue-300',
  medium: 'bg-amber-500/20 text-amber-300',
  high: 'bg-red-500/20 text-red-300',
};

export default function TaskCard({ task, index, onDelete }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 mb-3 cursor-grab active:cursor-grabbing border-l-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] ${priorityColors[task.priority]} hover:bg-white/15 transition-colors group ${
            snapshot.isDragging ? 'shadow-lg shadow-purple-500/20' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-white font-medium">{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${priorityBadges[task.priority]}`}>
                {task.priority}
              </span>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                  title="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-white/60 text-sm mb-2">{task.description}</p>
          )}
          <div className="flex justify-between items-center text-xs text-white/40">
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            <span className="opacity-50">&#8942;&#8942;</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
