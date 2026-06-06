import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUploads, deleteUpload, Upload } from '../api/uploads'
import { getLatestRates, FXRates } from '../api/fx'

export default function Dashboard() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [rates, setRates] = useState<FXRates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listUploads(), getLatestRates()])
      .then(([uploadsRes, ratesRes]) => {
        setUploads(uploadsRes.data)
        setRates(ratesRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this upload and all its results?')) return
    await deleteUpload(id)
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>

  return (
    <div className="space-y-8">
      {rates && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">USD → TRY</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{rates.usd_to_try.toFixed(4)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">EUR → TRY</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{rates.eur_to_try.toFixed(4)}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your uploads</h2>
          <Link
            to="/upload"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            New upload
          </Link>
        </div>

        {uploads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No uploads yet.</p>
            <Link to="/upload" className="mt-2 inline-block text-indigo-600 text-sm hover:underline">
              Upload your first .xlsx file
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Filename</th>
                  <th className="px-5 py-3 text-left">Rows</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploads.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{u.filename}</td>
                    <td className="px-5 py-3 text-gray-500">{u.row_count ?? '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(u.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right space-x-4">
                      {u.status === 'done' && (
                        <Link to={`/results/${u.id}`} className="text-indigo-600 hover:underline text-sm">
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-400 hover:text-red-600 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  const cls = styles[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
