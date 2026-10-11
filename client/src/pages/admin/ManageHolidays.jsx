import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

export default function ManageHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ holiday_name: '', holiday_date: '', term_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/holidays'),
      api.get('/academic-terms'),
    ])
      .then(([h, t]) => {
        setHolidays(h.data);
        setTerms(t.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEditingHoliday(null);
    setForm({ holiday_name: '', holiday_date: '', term_id: '' });
    setShowModal(true);
  };

  const openEdit = (h) => {
    setEditingHoliday(h);
    setForm({
      holiday_name: h.holiday_name || '',
      holiday_date: h.holiday_date ? h.holiday_date.slice(0, 10) : '',
      term_id: h.term_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, term_id: form.term_id ? parseInt(form.term_id) : null };
      if (editingHoliday) {
        await api.put(`/holidays/${editingHoliday.holiday_id}`, payload);
        toast.success('Holiday updated');
      } else {
        await api.post('/holidays', payload);
        toast.success('Holiday added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete holiday "${h.holiday_name}"?`)) return;
    try {
      await api.delete(`/holidays/${h.holiday_id}`);
      toast.success('Holiday deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Holidays</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Holiday
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Holiday Name</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Academic Term</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No holidays found.</td></tr>
            ) : holidays.map(h => (
              <tr key={h.holiday_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{h.holiday_name}</td>
                <td className="px-5 py-3 text-gray-600">{h.holiday_date ? new Date(h.holiday_date).toLocaleDateString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{h.academic_term?.term_name || h.term_name || '-'}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(h)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(h)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
                <input required value={form.holiday_name} onChange={e => setForm({ ...form, holiday_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input required type="date" value={form.holiday_date} onChange={e => setForm({ ...form, holiday_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Term</label>
                <select value={form.term_id} onChange={e => setForm({ ...form, term_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select term</option>
                  {terms.map(t => <option key={t.term_id} value={t.term_id}>{t.term_name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Saving...' : editingHoliday ? 'Update Holiday' : 'Add Holiday'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
