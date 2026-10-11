import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2';

export default function Waitlist() {
  const [entries, setEntries] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ resource_id: '', preferred_date: '', start_time: '', end_time: '', purpose: '' });

  useEffect(() => {
    fetchEntries();
    api.get('/resources').then(res => setResources(res.data)).catch(() => {});
  }, []);

  const fetchEntries = () => {
    setLoading(true);
    api.get('/waitlist')
      .then(res => setEntries(res.data))
      .catch(() => toast.error('Failed to load waitlist'))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/waitlist', form);
      toast.success('Added to waitlist');
      setShowModal(false);
      setForm({ resource_id: '', preferred_date: '', start_time: '', end_time: '', purpose: '' });
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  const removeEntry = async (id) => {
    if (!confirm('Remove from waitlist?')) return;
    try {
      await api.delete(`/waitlist/${id}`);
      toast.success('Removed from waitlist');
      fetchEntries();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      Waiting: 'bg-yellow-100 text-yellow-700',
      Notified: 'bg-blue-100 text-blue-700',
      Expired: 'bg-gray-100 text-gray-700',
      Converted: 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Join Waitlist
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Purpose</th>
              <th className="px-5 py-3 font-medium">Position</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500">No waitlist entries.</td></tr>
            ) : entries.map(e => (
              <tr key={e.waitlist_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{e.resource_name}</td>
                <td className="px-5 py-3 text-gray-600">{e.preferred_date ? new Date(e.preferred_date).toLocaleDateString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{e.start_time?.slice(0, 5)} - {e.end_time?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{e.purpose}</td>
                <td className="px-5 py-3 text-gray-600">{e.position || '-'}</td>
                <td className="px-5 py-3">{statusBadge(e.status)}</td>
                <td className="px-5 py-3">
                  {(e.status === 'Waiting' || !e.status) && (
                    <button onClick={() => removeEntry(e.waitlist_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Join Waitlist</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <select required value={form.resource_id} onChange={e => setForm({ ...form, resource_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select resource</option>
                  {resources.map(r => <option key={r.resource_id} value={r.resource_id}>{r.resource_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input required type="date" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input required type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input required type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea required value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Joining...' : 'Join Waitlist'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
