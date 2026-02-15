import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');

    const db = await connectDB();

    if (completed === 'true') {
      const logs = await db.all('SELECT * FROM completed_log ORDER BY completed_at DESC');
      await db.close();
      return NextResponse.json(logs);
    }

    const tasks = await db.all('SELECT * FROM tasks ORDER BY created_at DESC');
    await db.close();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const task = await request.json();
    const db = await connectDB();
    await db.run(
      'INSERT INTO tasks (id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)',
      [task.id || Date.now().toString(), task.title, task.description || null, task.priority || 'medium', task.status || 'todo']
    );
    await db.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const task = await request.json();
    const db = await connectDB();
    await db.run(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [task.title, task.description || null, task.priority, task.status, task.id]
    );

    // Log to completed history when task moves to done
    if (task.status === 'done') {
      await db.run(
        'INSERT INTO completed_log (task_id, title, description, priority) VALUES (?, ?, ?, ?)',
        [task.id, task.title, task.description || null, task.priority || 'medium']
      );
    }

    await db.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const db = await connectDB();
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    await db.close();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
