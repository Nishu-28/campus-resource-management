import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineWrenchScrewdriver } from 'react-icons/hi2';

export default function Maintenance() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ resource_id: '', description: '', priority: 'Medium' });
  const [updateForm, setUpdateForm] = useState({ status: '', assigned_to: '' });

  const isAdmin = user?.role_name === 'Admin';

  useEffect(() => {
    fetchLogs();
    api.get('/resources').then(res => setResources(res.data)).catch(() => {});
    if (isAdmin) {
      api.get('/users').then(res => setUsers(res.data)).catch(() => {});
    }
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/maintenance')
      .then(res => setLogs(res.data))
      .catch(() => toast.error('Failed to load maintenance logs'))
      .finally(() => setLoading(false));
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Issue reported successfully');
      setShowReportModal(false);
      setForm({ resource_id: '', description: '', priority: 'Medium' });
      fetchLogs();
    } catch {
      toast.error('Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    setSubmitting(true);
    try {
      await api.put(`/maintenance/${id}`, updateForm);
      toast.success('Maintenance log updated');
      setShowUpdateModal(null);
      fetchLogs();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdate = (log) => {
    setUpdateForm({ status: log.status || '', assigned_to: log.assigned_to || '' });
    setShowUpdateModal(log);
  };

  const priorityBadge = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-700',
      High: 'bg-orange-100 text-orange-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-700'}`}>{priority}</span>;
  };

  const statusBadge = (status) => {
    const colors = {
      Reported: 'bg-yellow-100 text-yellow-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Report Issue
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Reporter</th>
              <th className="px-5 py-3 font-medium">Assignee</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Reported</th>
              {isAdmin && <th className="px-5 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-5 py-8 text-center text-gray-500">No maintenance logs found.</td></tr>
            ) : logs.map(l => (
              <tr key={l.maintenance_id || l.log_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{l.resource_name}</td>
                <td className="px-5 py-3 text-gray-600">{l.reporter_name}</td>
                <td className="px-5 py-3 text-gray-600">{l.assignee_name || '-'}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{l.description}</td>
                <td className="px-5 py-3">{priorityBadge(l.priority)}</td>
                <td className="px-5 py-3">{statusBadge(l.status)}</td>
                <td className="px-5 py-3 text-gray-600">{l.reported_at ? new Date(l.reported_at).toLocaleDateString() : l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}</td>
                {isAdmin && (
                  <td className="px-5 py-3">
                    <button onClick={() => openUpdate(l)} className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium">Update</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Report Issue</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReport} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <select required value={form.resource_id} onChange={e => setForm({ ...form, resource_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select resource</option>
                  {resources.map(r => <option key={r.resource_id} value={r.resource_id}>{r.resource_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Reporting...' : 'Report Issue'}</button>
                <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Update Maintenance</h2>
              <button onClick={() => setShowUpdateModal(null)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="Reported">Reported</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select value={updateForm.assigned_to} onChange={e => setUpdateForm({ ...updateForm, assigned_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleUpdate(showUpdateModal.maintenance_id || showUpdateModal.log_id)} disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Updating...' : 'Update'}</button>
                <button onClick={() => setShowUpdateModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
