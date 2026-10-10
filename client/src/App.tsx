import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, type Todo } from './api'

type Filter = 'all' | 'active' | 'completed'

const FILTER_LABELS: Record<Filter, string> = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .list()
      .then(setTodos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const run = async (action: () => Promise<void>) => {
    setError(null)
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    run(async () => {
      const todo = await api.create(trimmed)
      setTodos((prev) => [todo, ...prev])
      setTitle('')
    })
  }

  const toggle = (todo: Todo) =>
    run(async () => {
      const updated = await api.update(todo.id, { completed: !todo.completed })
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    })

  const remove = (todo: Todo) =>
    run(async () => {
      await api.remove(todo.id)
      setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    })

  const clearCompleted = () =>
    run(async () => {
      await api.clearCompleted()
      setTodos((prev) => prev.filter((t) => !t.completed))
    })

  const visible = useMemo(
    () =>
      todos.filter((t) =>
        filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed,
      ),
    [todos, filter],
  )
  const remaining = todos.filter((t) => !t.completed).length
  const hasCompleted = todos.length > remaining

  return (
    <main className="app">
      <h1>待办事项</h1>

      <form className="new-todo" onSubmit={handleSubmit}>
        <input
          aria-label="新任务"
          placeholder="需要做什么？"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" disabled={!title.trim()}>
          添加
        </button>
      </form>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">加载中…</p>
      ) : (
        <>
          <ul className="todo-list">
            {visible.map((todo) => (
              <li key={todo.id} className={todo.completed ? 'completed' : undefined}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggle(todo)}
                  />
                  <span>{todo.title}</span>
                </label>
                <button
                  className="delete"
                  aria-label={`删除 ${todo.title}`}
                  onClick={() => remove(todo)}
                >
                  ×
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="muted empty">暂无任务</li>}
          </ul>

          <footer className="toolbar">
            <span>剩余 {remaining} 项</span>
            <div className="filters" role="group" aria-label="筛选">
              {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
                <button
                  key={f}
                  className={filter === f ? 'active' : undefined}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
            <button onClick={clearCompleted} disabled={!hasCompleted}>
              清除已完成
            </button>
          </footer>
        </>
      )}
    </main>
  )
}
