const toTodo = (row) => ({
  id: row.id,
  title: row.title,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
});

export function createTodoRepo(db) {
  const stmts = {
    list: db.prepare('SELECT * FROM todos ORDER BY id DESC'),
    get: db.prepare('SELECT * FROM todos WHERE id = ?'),
    insert: db.prepare('INSERT INTO todos (title) VALUES (?)'),
    update: db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?'),
    remove: db.prepare('DELETE FROM todos WHERE id = ?'),
    clearCompleted: db.prepare('DELETE FROM todos WHERE completed = 1'),
  };

  return {
    list: () => stmts.list.all().map(toTodo),
    get(id) {
      const row = stmts.get.get(id);
      return row ? toTodo(row) : null;
    },
    create(title) {
      const { lastInsertRowid } = stmts.insert.run(title);
      return this.get(Number(lastInsertRowid));
    },
    update(id, changes) {
      const existing = this.get(id);
      if (!existing) return null;
      const next = { ...existing, ...changes };
      stmts.update.run(next.title, next.completed ? 1 : 0, id);
      return this.get(id);
    },
    remove: (id) => stmts.remove.run(id).changes > 0,
    clearCompleted: () => Number(stmts.clearCompleted.run().changes),
  };
}
