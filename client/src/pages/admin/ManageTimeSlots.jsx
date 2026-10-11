import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

export default function ManageTimeSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ slot_label: '', start_time: '', end_time: '', is_active: true });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = () => {
    setLoading(true);
    api.get('/time-slots')
      .then(res => setSlots(res.data))
      .catch(() => toast.error('Failed to load time slots'))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEditingSlot(null);
    setForm({ slot_label: '', start_time: '', end_time: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingSlot(s);
    setForm({
      slot_label: s.slot_label || '',
      start_time: s.start_time || '',
      end_time: s.end_time || '',
      is_active: s.is_active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSlot) {
        await api.put(`/time-slots/${editingSlot.slot_id}`, form);
        toast.success('Time slot updated');
      } else {
        await api.post('/time-slots', form);
        toast.success('Time slot added');
      }
      setShowModal(false);
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save time slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete time slot "${s.slot_label}"?`)) return;
    try {
      await api.delete(`/time-slots/${s.slot_id}`);
      toast.success('Time slot deleted');
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete time slot');
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/time-slots/${s.slot_id}`, { ...s, is_active: !s.is_active });
      toast.success(`Time slot ${s.is_active ? 'deactivated' : 'activated'}`);
      fetchSlots();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Time Slots</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Time Slot
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Label</th>
              <th className="px-5 py-3 font-medium">Start Time</th>
              <th className="px-5 py-3 font-medium">End Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-500">No time slots found.</td></tr>
            ) : slots.map(s => (
              <tr key={s.slot_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{s.slot_label}</td>
                <td className="px-5 py-3 text-gray-600">{s.start_time}</td>
                <td className="px-5 py-3 text-gray-600">{s.end_time}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {s.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${s.is_active !== false ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      {s.is_active !== false ? 'Deactivate' : 'Activate'}
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slot Label</label>
                <input required value={form.slot_label} onChange={e => setForm({ ...form, slot_label: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input required type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input required type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Saving...' : editingSlot ? 'Update Time Slot' : 'Add Time Slot'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
