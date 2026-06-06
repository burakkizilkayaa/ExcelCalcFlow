import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUpload, downloadUpload, UploadDetail } from '../api/uploads'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const [upload, setUpload] = useState<UploadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getUpload(Number(id))
      .then((res) => setUpload(res.data))
      .catch(() => setError('Could not load results'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!id || !upload) return
    const res = await downloadUpload(Number(id))
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${upload.filename.replace('.xlsx', '')}_result.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>
  if (error || !upload) return <p className="text-red-500 text-sm">{error || 'Not found'}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{upload.filename}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(upload.uploaded_at).toLocaleString()}
            {upload.fx_snapshot && (
              <>
                {' · '}USD: {upload.fx_snapshot.usd_to_try.toFixed(4)}
                {' · '}EUR: {upload.fx_snapshot.eur_to_try.toFixed(4)}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {upload.status === 'done' && (
            <button
              onClick={handleDownload}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Download .xlsx
            </button>
          )}
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Back
          </Link>
        </div>
      </div>

      {upload.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {upload.error_msg}
        </div>
      )}

      {upload.results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-left">Currency</th>
                <th className="px-5 py-3 text-right">Rate</th>
                <th className="px-5 py-3 text-right">TRY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upload.results.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-400">{r.row_index + 1}</td>
                  <td className="px-5 py-3 text-gray-700">{r.description}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-500">{r.currency}</td>
                  <td className="px-5 py-3 text-right text-gray-400">{r.live_rate.toFixed(4)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-indigo-600">
                    {r.converted_try.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
