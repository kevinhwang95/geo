import axios from 'axios';
import type { Todo } from '@/types';

const API_URL = 'https://jsonplaceholder.typicode.com/todos'; // Example API

const api = axios.create({
  baseURL: API_URL,
});

export const getTodos = async (): Promise<Todo[]> => {
  const response = await api.get<Todo[]>('');
  return response.data;
};

export const getTodoById = async (id: number): Promise<Todo> => {
  const response = await api.get<Todo>(`/${id}`);
  return response.data;
};

export const createTodo = async (newTodo: Omit<Todo, 'id'>): Promise<Todo> => {
  const response = await api.post<Todo>('', newTodo);
  return response.data;
};

export const updateTodo = async (id: number, updatedTodo: Partial<Todo>): Promise<Todo> => {
  const response = await api.put<Todo>(`/${id}`, updatedTodo);
  return response.data;
};

export const deleteTodo = async (id: number): Promise<void> => {
  await api.delete(`/${id}`);
};