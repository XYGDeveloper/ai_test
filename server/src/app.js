import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createTodoRepo } from './todos.js';

const MAX_TITLE_LENGTH = 200;

function validateTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') return 'title is required';
  if (title.trim().length > MAX_TITLE_LENGTH) return `title must be at most ${MAX_TITLE_LENGTH} characters`;
  return null;
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid id' });
    return null;
  }
  return id;
}

export function createApp(db, { staticDir } = {}) {
  const todos = createTodoRepo(db);
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/todos', (_req, res) => res.json(todos.list()));

  app.post('/api/todos', (req, res) => {
    const error = validateTitle(req.body?.title);
    if (error) return res.status(400).json({ error });
    res.status(201).json(todos.create(req.body.title.trim()));
  });

  app.patch('/api/todos/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;
    const { title, completed } = req.body ?? {};
    const changes = {};
    if (title !== undefined) {
      const error = validateTitle(title);
      if (error) return res.status(400).json({ error });
      changes.title = title.trim();
    }
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') return res.status(400).json({ error: 'completed must be a boolean' });
      changes.completed = completed;
    }
    const updated = todos.update(id, changes);
    if (!updated) return res.status(404).json({ error: 'todo not found' });
    res.json(updated);
  });

  app.delete('/api/todos/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;
    if (!todos.remove(id)) return res.status(404).json({ error: 'todo not found' });
    res.status(204).end();
  });

  app.delete('/api/todos', (req, res) => {
    if (req.query.completed !== 'true') return res.status(400).json({ error: 'only ?completed=true is supported' });
    res.json({ deleted: todos.clearCompleted() });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid JSON body' });
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}
