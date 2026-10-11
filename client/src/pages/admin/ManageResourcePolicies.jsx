import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

export default function ManageResourcePolicies() {
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category_id: '', policy_name: '', max_duration_hrs: '', advance_booking_days: '',
    cancellation_hrs: '', requires_approval: false, auto_release_mins: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/resource-policies'),
      api.get('/resources/categories'),
    ])
      .then(([p, c]) => {
        setPolicies(p.data);
        setCategories(c.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEditingPolicy(null);
    setForm({
      category_id: '', policy_name: '', max_duration_hrs: '', advance_booking_days: '',
      cancellation_hrs: '', requires_approval: false, auto_release_mins: '',
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingPolicy(p);
    setForm({
      category_id: p.category_id || '',
      policy_name: p.policy_name || '',
      max_duration_hrs: p.max_duration_hrs ?? '',
      advance_booking_days: p.advance_booking_days ?? '',
      cancellation_hrs: p.cancellation_hrs ?? '',
      requires_approval: p.requires_approval || false,
      auto_release_mins: p.auto_release_mins ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        max_duration_hrs: form.max_duration_hrs !== '' ? parseFloat(form.max_duration_hrs) : null,
        advance_booking_days: form.advance_booking_days !== '' ? parseInt(form.advance_booking_days) : null,
        cancellation_hrs: form.cancellation_hrs !== '' ? parseFloat(form.cancellation_hrs) : null,
        auto_release_mins: form.auto_release_mins !== '' ? parseInt(form.auto_release_mins) : null,
      };
      if (editingPolicy) {
        await api.put(`/resource-policies/${editingPolicy.policy_id}`, payload);
        toast.success('Policy updated');
      } else {
        await api.post('/resource-policies', payload);
        toast.success('Policy added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete policy "${p.policy_name}"?`)) return;
    try {
      await api.delete(`/resource-policies/${p.policy_id}`);
      toast.success('Policy deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Resource Policies</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Policy Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Max Duration (hrs)</th>
              <th className="px-5 py-3 font-medium">Advance Booking (days)</th>
              <th className="px-5 py-3 font-medium">Cancellation (hrs)</th>
              <th className="px-5 py-3 font-medium">Approval</th>
              <th className="px-5 py-3 font-medium">Auto Release (mins)</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-500">No policies found.</td></tr>
            ) : policies.map(p => (
              <tr key={p.policy_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{p.policy_name}</td>
                <td className="px-5 py-3 text-gray-600">{p.resource_category?.category_name || p.category_name || '-'}</td>
                <td className="px-5 py-3 text-gray-600">{p.max_duration_hrs ?? '-'}</td>
                <td className="px-5 py-3 text-gray-600">{p.advance_booking_days ?? '-'}</td>
                <td className="px-5 py-3 text-gray-600">{p.cancellation_hrs ?? '-'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.requires_approval ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {p.requires_approval ? 'Required' : 'Auto'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">{p.auto_release_mins ?? '-'}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editingPolicy ? 'Edit Policy' : 'Add Policy'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                <input required value={form.policy_name} onChange={e => setForm({ ...form, policy_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Duration (hours)</label>
                <input type="number" step="0.5" min="0" value={form.max_duration_hrs} onChange={e => setForm({ ...form, max_duration_hrs: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Booking (days)</label>
                <input type="number" min="0" value={form.advance_booking_days} onChange={e => setForm({ ...form, advance_booking_days: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Window (hours)</label>
                <input type="number" step="0.5" min="0" value={form.cancellation_hrs} onChange={e => setForm({ ...form, cancellation_hrs: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="requires_approval" checked={form.requires_approval} onChange={e => setForm({ ...form, requires_approval: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="requires_approval" className="text-sm font-medium text-gray-700">Requires Approval</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto Release (minutes)</label>
                <input type="number" min="0" value={form.auto_release_mins} onChange={e => setForm({ ...form, auto_release_mins: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Add Policy'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
