import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineXMark, HiStar, HiOutlineStar } from 'react-icons/hi2';

export default function UsageLogs() {
  const [logs, setLogs] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [checkOutForm, setCheckOutForm] = useState({ actual_attendees: '', rating: 0, remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
    api.get('/bookings/approved').then(res => setApprovedBookings(res.data)).catch(() => {});
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/usage-logs')
      .then(res => setLogs(res.data))
      .catch(() => toast.error('Failed to load usage logs'))
      .finally(() => setLoading(false));
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      await api.post('/usage-logs', { booking_id: selectedBooking });
      toast.success('Checked in successfully');
      setShowCheckInModal(false);
      setSelectedBooking('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (logId) => {
    setSubmitting(true);
    try {
      await api.put(`/usage-logs/${logId}/checkout`, {
        actual_attendees: parseInt(checkOutForm.actual_attendees) || 0,
        feedback_rating: checkOutForm.rating,
        remarks: checkOutForm.remarks,
      });
      toast.success('Checked out successfully');
      setShowCheckOutModal(null);
      setCheckOutForm({ actual_attendees: '', rating: 0, remarks: '' });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check out');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)} className="text-yellow-400 hover:scale-110 transition-transform">
          {star <= value ? <HiStar className="w-6 h-6" /> : <HiOutlineStar className="w-6 h-6" />}
        </button>
      ))}
    </div>
  );

  const statusBadge = (status) => {
    const colors = {
      'Checked In': 'bg-blue-100 text-blue-700',
      'Checked Out': 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usage Logs</h1>
        <button onClick={() => setShowCheckInModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Check In
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Booking Date</th>
              <th className="px-5 py-3 font-medium">Check In</th>
              <th className="px-5 py-3 font-medium">Check Out</th>
              <th className="px-5 py-3 font-medium">Attendees</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-500">No usage logs found.</td></tr>
            ) : logs.map(l => (
              <tr key={l.usage_id || l.log_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{l.resource_name}</td>
                <td className="px-5 py-3 text-gray-600">{l.booking_date ? new Date(l.booking_date).toLocaleDateString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{l.check_in_time ? new Date(l.check_in_time).toLocaleString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{l.check_out_time ? new Date(l.check_out_time).toLocaleString() : '-'}</td>
                <td className="px-5 py-3 text-gray-600">{l.actual_attendees || '-'}</td>
                <td className="px-5 py-3">
                  {l.rating ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={s <= l.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          {s <= l.rating ? <HiStar className="w-4 h-4" /> : <HiOutlineStar className="w-4 h-4" />}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-5 py-3">{statusBadge(l.status || (l.check_out_time ? 'Checked Out' : 'Checked In'))}</td>
                <td className="px-5 py-3">
                  {!l.check_out_time && (
                    <button
                      onClick={() => { setShowCheckOutModal(l); setCheckOutForm({ actual_attendees: '', rating: 0, remarks: '' }); }}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                    >
                      Check Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Check In</h2>
              <button onClick={() => setShowCheckInModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Approved Booking</label>
                <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select booking</option>
                  {approvedBookings.map(b => (
                    <option key={b.booking_id} value={b.booking_id}>
                      {b.resource_name} - {new Date(b.booking_date).toLocaleDateString()} ({b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCheckIn} disabled={submitting || !selectedBooking} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Checking in...' : 'Check In'}</button>
                <button onClick={() => setShowCheckInModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Check Out</h2>
              <button onClick={() => setShowCheckOutModal(null)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Attendees</label>
                <input type="number" min="0" value={checkOutForm.actual_attendees} onChange={e => setCheckOutForm({ ...checkOutForm, actual_attendees: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating value={checkOutForm.rating} onChange={v => setCheckOutForm({ ...checkOutForm, rating: v })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={checkOutForm.remarks} onChange={e => setCheckOutForm({ ...checkOutForm, remarks: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleCheckOut(showCheckOutModal.usage_id || showCheckOutModal.log_id)} disabled={submitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{submitting ? 'Checking out...' : 'Check Out'}</button>
                <button onClick={() => setShowCheckOutModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
