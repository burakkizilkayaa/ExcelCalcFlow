import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFile } from '../api/uploads'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted')
      return
    }
    setError('')
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const res = await uploadFile(file)
      navigate(`/results/${res.data.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Upload Excel file</h1>
      <p className="text-sm text-gray-500">
        The file must contain columns:{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">amount</code>,{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">currency</code> (USD / EUR / TRY), and{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">description</code>.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 hover:border-indigo-300 bg-white'
        }`}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {file ? (
          <div>
            <p className="text-sm font-medium text-indigo-600">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400">Drag & drop an .xlsx file here</p>
            <p className="text-xs text-gray-300 mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Uploading & calculating…' : 'Upload & calculate'}
      </button>
    </div>
  )
}
