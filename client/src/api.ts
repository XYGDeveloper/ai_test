export interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const api = {
  list: () => request<Todo[]>('/api/todos'),
  create: (title: string) =>
    request<Todo>('/api/todos', { method: 'POST', body: JSON.stringify({ title }) }),
  update: (id: number, changes: Partial<Pick<Todo, 'title' | 'completed'>>) =>
    request<Todo>(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (id: number) => request<void>(`/api/todos/${id}`, { method: 'DELETE' }),
  clearCompleted: () =>
    request<{ deleted: number }>('/api/todos?completed=true', { method: 'DELETE' }),
}
