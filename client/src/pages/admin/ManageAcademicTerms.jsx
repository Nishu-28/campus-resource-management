import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

export default function ManageAcademicTerms() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ term_name: '', start_date: '', end_date: '', is_current: false });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = () => {
    setLoading(true);
    api.get('/academic-terms')
      .then(res => setTerms(res.data))
      .catch(() => toast.error('Failed to load academic terms'))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEditingTerm(null);
    setForm({ term_name: '', start_date: '', end_date: '', is_current: false });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingTerm(t);
    setForm({
      term_name: t.term_name || '',
      start_date: t.start_date ? t.start_date.slice(0, 10) : '',
      end_date: t.end_date ? t.end_date.slice(0, 10) : '',
      is_current: t.is_current || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTerm) {
        await api.put(`/academic-terms/${editingTerm.term_id}`, form);
        toast.success('Term updated');
      } else {
        await api.post('/academic-terms', form);
        toast.success('Term added');
      }
      setShowModal(false);
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete term "${t.term_name}"?`)) return;
    try {
      await api.delete(`/academic-terms/${t.term_id}`);
      toast.success('Term deleted');
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete term');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Academic Terms</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Term
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Term Name</th>
              <th className="px-5 py-3 font-medium">Start Date</th>
              <th className="px-5 py-3 font-medium">End Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.length === 0 ? (
              <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-500">No academic terms found.</td></tr>
            ) : terms.map(t => (
              <tr key={t.term_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">
                  {t.term_name}
                  {t.is_current && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Current</span>}
                </td>
                <td className="px-5 py-3 text-gray-600">{t.start_date ? new Date(t.start_date).toLocaleDateString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{t.end_date ? new Date(t.end_date).toLocaleDateString() : '-'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {t.is_current ? 'Current' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
              <h2 className="text-lg font-semibold text-gray-900">{editingTerm ? 'Edit Term' : 'Add Term'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term Name</label>
                <input required value={form.term_name} onChange={e => setForm({ ...form, term_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_current" checked={form.is_current} onChange={e => setForm({ ...form, is_current: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="is_current" className="text-sm font-medium text-gray-700">Current Term</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Saving...' : editingTerm ? 'Update Term' : 'Add Term'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
