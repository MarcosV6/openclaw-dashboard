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

export default function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`glass-card p-4 mb-3 cursor-grab active:cursor-grabbing border-l-4 ${priorityColors[task.priority]} hover:bg-white/15 transition-colors ${
            snapshot.isDragging ? 'shadow-lg shadow-purple-500/20 bg-white/15' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-white font-medium">{task.title}</h4>
            <span className={`text-xs px-2 py-1 rounded ${priorityBadges[task.priority]}`}>
              {task.priority}
            </span>
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
