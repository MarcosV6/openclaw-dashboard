'use client';

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

const columnColors = {
  todo: 'border-t-purple-500',
  inProgress: 'border-t-amber-500',
  done: 'border-t-green-500',
};

const headerColors = {
  todo: 'text-purple-400',
  inProgress: 'text-amber-400',
  done: 'text-green-400',
};

export default function KanbanColumn({ id, title, tasks, color }: KanbanColumnProps) {
  return (
    <div className={`glass-card p-4 flex-1 lg:min-w-0 border-t-2 ${columnColors[id as keyof typeof columnColors] || 'border-t-gray-500'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          id === 'todo' ? 'bg-purple-500' : 
          id === 'inProgress' ? 'bg-amber-500' : 
          'bg-green-500'
        }`}></div>
        <h3 className={`font-semibold ${headerColors[id as keyof typeof headerColors] || 'text-white'}`}>
          {title}
        </h3>
        <span className="ml-auto bg-white/10 text-white/60 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? 'bg-white/10' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-white/40 text-sm">
                No tasks
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}