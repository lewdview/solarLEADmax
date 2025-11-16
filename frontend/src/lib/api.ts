import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

export const leadApi = {
  list: (params?: { status?: string; source?: string }) =>
    api.get('/leads', { params }).then(r => r.data),
  get: (id: string) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data: any) => api.post('/leads/intake', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data).then(r => r.data),
}
