'use client';

import React from 'react';
import KanbanBoard from '../components/KanbanBoard';

export default function KanbanPage() {
  const handleTaskMove = (taskId: string, newStatus: string) => {
    console.log(`Task ${taskId} moved to ${newStatus}`);
    // Here you could save to database, trigger API call, etc.
  };

  return <KanbanBoard onTaskMove={handleTaskMove} />;
}