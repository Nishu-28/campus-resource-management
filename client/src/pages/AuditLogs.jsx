import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const perPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = () => {
    setLoading(true);
    const params = { page, limit: perPage };
    if (actionFilter) params.action_type = actionFilter;
    if (search) params.search = search;

    api.get('/audit-logs', { params })
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setLogs(data);
          setTotalPages(Math.ceil(data.length / perPage) || 1);
        } else {
          setLogs(data.logs || data.data || []);
          setTotalPages(data.totalPages || Math.ceil((data.total || 0) / perPage) || 1);
        }
      })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const formatValue = (val) => {
    if (!val) return '-';
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  };

  const actionBadge = (action) => {
    const colors = {
      INSERT: 'bg-green-100 text-green-700',
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
    };
    const c = colors[action?.toUpperCase()] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c}`}>{action}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user or record..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Record ID</th>
              <th className="px-5 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-500">No audit logs found.</td></tr>
            ) : logs.map((l, idx) => (
              <>
                <tr key={l.audit_id || idx} className="border-b last:border-0 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}>
                  <td className="px-5 py-3 text-gray-600">{l.created_at ? new Date(l.created_at).toLocaleString() : l.timestamp ? new Date(l.timestamp).toLocaleString() : '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{l.user_name || l.performed_by || '-'}</td>
                  <td className="px-5 py-3">{actionBadge(l.action_type || l.action)}</td>
                  <td className="px-5 py-3 text-gray-600">{l.table_name || l.entity_type || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{l.record_id || l.entity_id || '-'}</td>
                  <td className="px-5 py-3 text-indigo-600 text-xs font-medium">{expandedRow === idx ? 'Hide' : 'View'}</td>
                </tr>
                {expandedRow === idx && (
                  <tr key={`${idx}-detail`} className="border-b">
                    <td colSpan="6" className="px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Old Values</p>
                          <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto max-h-48 whitespace-pre-wrap">{formatValue(l.old_values || l.old_data)}</pre>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">New Values</p>
                          <pre className="text-xs bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto max-h-48 whitespace-pre-wrap">{formatValue(l.new_values || l.new_data)}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <HiOutlineChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
