import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Todo } from './api'

let store: Todo[]
let nextId: number

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function fakeServer(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input)
  const method = init?.method ?? 'GET'
  const body = init?.body ? JSON.parse(String(init.body)) : undefined
  const idMatch = url.match(/\/api\/todos\/(\d+)$/)

  if (url === '/api/todos' && method === 'GET') return Promise.resolve(json(store))
  if (url === '/api/todos' && method === 'POST') {
    const todo: Todo = { id: nextId++, title: body.title, completed: false, createdAt: '' }
    store = [todo, ...store]
    return Promise.resolve(json(todo, 201))
  }
  if (idMatch && method === 'PATCH') {
    const id = Number(idMatch[1])
    store = store.map((t) => (t.id === id ? { ...t, ...body } : t))
    return Promise.resolve(json(store.find((t) => t.id === id)))
  }
  if (idMatch && method === 'DELETE') {
    store = store.filter((t) => t.id !== Number(idMatch[1]))
    return Promise.resolve(json(null, 204))
  }
  if (url === '/api/todos?completed=true' && method === 'DELETE') {
    const before = store.length
    store = store.filter((t) => !t.completed)
    return Promise.resolve(json({ deleted: before - store.length }))
  }
  return Promise.resolve(json({ error: 'not found' }, 404))
}

beforeEach(() => {
  store = [
    { id: 2, title: '写代码', completed: false, createdAt: '' },
    { id: 1, title: '买牛奶', completed: true, createdAt: '' },
  ]
  nextId = 3
  vi.stubGlobal('fetch', vi.fn(fakeServer))
})

afterEach(() => vi.unstubAllGlobals())

const items = () => screen.getAllByRole('listitem')

describe('App', () => {
  it('loads and displays todos', async () => {
    render(<App />)
    expect(await screen.findByText('写代码')).toBeInTheDocument()
    expect(screen.getByText('买牛奶')).toBeInTheDocument()
    expect(screen.getByText('剩余 1 项')).toBeInTheDocument()
  })

  it('adds a todo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('写代码')
    await user.type(screen.getByLabelText('新任务'), '  学习 React  {enter}')
    expect(await screen.findByText('学习 React')).toBeInTheDocument()
    expect(screen.getByLabelText('新任务')).toHaveValue('')
    expect(items()[0]).toHaveTextContent('学习 React')
    expect(screen.getByText('剩余 2 项')).toBeInTheDocument()
  })

  it('disables add button for blank input', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('写代码')
    const button = screen.getByRole('button', { name: '添加' })
    expect(button).toBeDisabled()
    await user.type(screen.getByLabelText('新任务'), '   ')
    expect(button).toBeDisabled()
  })

  it('toggles a todo', async () => {
    const user = userEvent.setup()
    render(<App />)
    const label = await screen.findByText('写代码')
    await user.click(within(label.closest('li')!).getByRole('checkbox'))
    await waitFor(() => expect(screen.getByText('剩余 0 项')).toBeInTheDocument())
    expect(label.closest('li')).toHaveClass('completed')
  })

  it('deletes a todo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('写代码')
    await user.click(screen.getByRole('button', { name: '删除 写代码' }))
    await waitFor(() => expect(screen.queryByText('写代码')).not.toBeInTheDocument())
  })

  it('filters todos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('写代码')
    await user.click(screen.getByRole('button', { name: '未完成' }))
    expect(items()).toHaveLength(1)
    expect(items()[0]).toHaveTextContent('写代码')
    await user.click(screen.getByRole('button', { name: '已完成' }))
    expect(items()[0]).toHaveTextContent('买牛奶')
    await user.click(screen.getByRole('button', { name: '全部' }))
    expect(items()).toHaveLength(2)
  })

  it('clears completed todos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('买牛奶')
    await user.click(screen.getByRole('button', { name: '清除已完成' }))
    await waitFor(() => expect(screen.queryByText('买牛奶')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: '清除已完成' })).toBeDisabled()
  })

  it('shows server errors', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ error: '服务器错误' }, 500))))
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('服务器错误')
  })
})
