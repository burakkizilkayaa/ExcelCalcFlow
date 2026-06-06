import client from './client'

export interface User {
  id: number
  email: string
}

export const register = (email: string, password: string) =>
  client.post<{ user: User }>('/auth/register', { email, password })

export const login = (email: string, password: string) =>
  client.post<{ user: User }>('/auth/login', { email, password })

export const logout = () => client.post('/auth/logout')

export const getMe = () => client.get<User>('/auth/me')
