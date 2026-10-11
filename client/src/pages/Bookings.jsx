import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [form, setForm] = useState({ resource_id: '', booking_date: '', start_time: '', end_time: '', purpose: '', attendee_count: '' });
  const [conflictError, setConflictError] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ recurrence_type: 'Weekly', day_of_week: 'Mon', recur_start: '', recur_end: '' });
  const [recurringSummary, setRecurringSummary] = useState(null);

  useEffect(() => {
    fetchBookings();
    api.get('/resources').then(res => setResources(res.data)).catch(() => {});
  }, []);

  const fetchBookings = () => {
    setLoading(true);
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');
    setRecurringSummary(null);
    setSubmitting(true);
    try {
      if (isRecurring) {
        const res = await api.post('/bookings/recurring', {
          resource_id: form.resource_id,
          start_time: form.start_time,
          end_time: form.end_time,
          purpose: form.purpose,
          attendee_count: parseInt(form.attendee_count) || 0,
          recurrence_type: recurringForm.recurrence_type,
          day_of_week: (recurringForm.recurrence_type === 'Weekly' || recurringForm.recurrence_type === 'Biweekly') ? recurringForm.day_of_week : undefined,
          recur_start: recurringForm.recur_start,
          recur_end: recurringForm.recur_end,
        });
        const { created, skipped, skipped_dates } = res.data;
        setRecurringSummary({ created, skipped, skipped_dates });
        if (created > 0) {
          toast.success(`Created ${created} recurring booking(s)`);
        }
        if (skipped > 0) {
          toast(`Skipped ${skipped} date(s) due to conflicts/holidays`, { icon: '\u26A0\uFE0F' });
        }
        fetchBookings();
      } else {
        await api.post('/bookings', {
          ...form,
          attendee_count: parseInt(form.attendee_count) || 0,
        });
        toast.success('Booking created successfully');
        setShowModal(false);
        setForm({ resource_id: '', booking_date: '', start_time: '', end_time: '', purpose: '', attendee_count: '' });
        fetchBookings();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create booking';
      if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('overlap') || err.response?.status === 409) {
        setConflictError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(b => !statusFilter || b.booking_status === statusFilter);

  const statusBadge = (status) => {
    const colors = {
      Approved: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Rejected: 'bg-red-100 text-red-700',
      Cancelled: 'bg-gray-100 text-gray-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  const filteredResources = resources.filter(r =>
    !resourceSearch || r.resource_name?.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> New Booking
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Purpose</th>
              <th className="px-5 py-3 font-medium">Attendees</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500">No bookings found.</td></tr>
            ) : filteredBookings.map(b => (
              <tr key={b.booking_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{b.resource_name}</td>
                <td className="px-5 py-3 text-gray-600">{new Date(b.booking_date).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-gray-600">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{b.purpose}</td>
                <td className="px-5 py-3 text-gray-600">{b.attendee_count}</td>
                <td className="px-5 py-3">{statusBadge(b.booking_status)}</td>
                <td className="px-5 py-3">
                  {(b.booking_status === 'Pending' || b.booking_status === 'Approved') && (
                    <button onClick={() => cancelBooking(b.booking_id)} className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">Cancel</button>
                  )}
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
              <h2 className="text-lg font-semibold text-gray-900">New Booking</h2>
              <button onClick={() => { setShowModal(false); setConflictError(''); setIsRecurring(false); setRecurringSummary(null); }} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {conflictError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{conflictError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={e => setResourceSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm mb-1"
                />
                <select
                  required
                  value={form.resource_id}
                  onChange={e => setForm({ ...form, resource_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                >
                  <option value="">Select resource</option>
                  {filteredResources.map(r => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} - {r.building_name}</option>)}
                </select>
              </div>
              {!isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" value={form.booking_date} onChange={e => setForm({ ...form, booking_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                </div>
              )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendee Count</label>
                <input required type="number" min="1" value={form.attendee_count} onChange={e => setForm({ ...form, attendee_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_recurring" checked={isRecurring} onChange={e => { setIsRecurring(e.target.checked); setRecurringSummary(null); }} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">Make this recurring</label>
              </div>
              {isRecurring && (
                <div className="space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Type</label>
                    <select value={recurringForm.recurrence_type} onChange={e => setRecurringForm({ ...recurringForm, recurrence_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Biweekly">Biweekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  {(recurringForm.recurrence_type === 'Weekly' || recurringForm.recurrence_type === 'Biweekly') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                      <select value={recurringForm.day_of_week} onChange={e => setRecurringForm({ ...recurringForm, day_of_week: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                        <option value="Mon">Monday</option>
                        <option value="Tue">Tuesday</option>
                        <option value="Wed">Wednesday</option>
                        <option value="Thu">Thursday</option>
                        <option value="Fri">Friday</option>
                        <option value="Sat">Saturday</option>
                        <option value="Sun">Sunday</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input required type="date" value={recurringForm.recur_start} onChange={e => setRecurringForm({ ...recurringForm, recur_start: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input required type="date" value={recurringForm.recur_end} onChange={e => setRecurringForm({ ...recurringForm, recur_end: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>
              )}
              {recurringSummary && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <p className="font-medium text-green-800">Created {recurringSummary.created} booking(s), skipped {recurringSummary.skipped}.</p>
                  {recurringSummary.skipped_dates.length > 0 && (
                    <ul className="mt-1 text-green-700 list-disc list-inside">
                      {recurringSummary.skipped_dates.map((s, i) => (
                        <li key={i}>{s.date} - {s.reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : isRecurring ? 'Create Recurring Bookings' : 'Create Booking'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setConflictError(''); setIsRecurring(false); setRecurringSummary(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
