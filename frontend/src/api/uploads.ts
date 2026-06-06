import client from './client'

export interface Upload {
  id: number
  filename: string
  row_count: number | null
  status: 'pending' | 'done' | 'error'
  error_msg: string | null
  uploaded_at: string
}

export interface Result {
  id: number
  row_index: number
  description: string
  amount: number
  currency: string
  live_rate: number
  converted_try: number
}

export interface UploadDetail extends Upload {
  results: Result[]
  fx_snapshot?: {
    usd_to_try: number
    eur_to_try: number
    fetched_at: string
  }
}

export const listUploads = () => client.get<Upload[]>('/uploads/')

export const getUpload = (id: number) => client.get<UploadDetail>(`/uploads/${id}`)

export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Upload>('/uploads/', form)
}

export const downloadUpload = (id: number) =>
  client.get(`/uploads/${id}/download`, { responseType: 'blob' })

export const deleteUpload = (id: number) => client.delete(`/uploads/${id}`)
