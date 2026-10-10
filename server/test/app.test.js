import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let app;

beforeEach(() => {
  app = createApp(openDb(':memory:'));
});

const createTodo = (title) => request(app).post('/api/todos').send({ title });

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('todos API', () => {
  it('starts empty', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('creates a todo with trimmed title', async () => {
    const res = await createTodo('  Buy milk  ');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Buy milk', completed: false });
    expect(res.body.createdAt).toBeTypeOf('string');
  });

  it('lists todos newest first', async () => {
    await createTodo('first');
    await createTodo('second');
    const res = await request(app).get('/api/todos');
    expect(res.body.map((t) => t.title)).toEqual(['second', 'first']);
  });

  it.each([[undefined], [''], ['   '], [123], ['x'.repeat(201)]])('rejects invalid title %j', async (title) => {
    const res = await createTodo(title);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/todos').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid JSON body' });
  });

  it('updates completed and title', async () => {
    const { body: todo } = await createTodo('task');
    const res = await request(app).patch(`/api/todos/${todo.id}`).send({ completed: true, title: 'renamed' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: todo.id, title: 'renamed', completed: true });
  });

  it('validates update payload', async () => {
    const { body: todo } = await createTodo('task');
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({ completed: 'yes' })).status).toBe(400);
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({ title: '' })).status).toBe(400);
    expect((await request(app).patch('/api/todos/abc').send({ completed: true })).status).toBe(400);
  });

  it('returns 404 for unknown todo', async () => {
    expect((await request(app).patch('/api/todos/999').send({ completed: true })).status).toBe(404);
    expect((await request(app).delete('/api/todos/999')).status).toBe(404);
  });

  it('deletes a todo', async () => {
    const { body: todo } = await createTodo('task');
    expect((await request(app).delete(`/api/todos/${todo.id}`)).status).toBe(204);
    expect((await request(app).get('/api/todos')).body).toEqual([]);
  });

  it('clears completed todos', async () => {
    const { body: a } = await createTodo('a');
    await createTodo('b');
    await request(app).patch(`/api/todos/${a.id}`).send({ completed: true });
    const res = await request(app).delete('/api/todos?completed=true');
    expect(res.body).toEqual({ deleted: 1 });
    expect((await request(app).get('/api/todos')).body.map((t) => t.title)).toEqual(['b']);
    expect((await request(app).delete('/api/todos')).status).toBe(400);
  });

  it('returns 404 JSON for unknown api routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not found' });
  });
});
