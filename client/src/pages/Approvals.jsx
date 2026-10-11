import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';

export default function Approvals() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAction, setModalAction] = useState(null); // { booking_id, action: 'approve'|'reject' }
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = () => {
    setLoading(true);
    api.get('/approvals')
      .then(res => setBookings(res.data))
      .catch(() => toast.error('Failed to load pending bookings'))
      .finally(() => setLoading(false));
  };

  const handleAction = async () => {
    if (!modalAction) return;
    setSubmitting(true);
    try {
      await api.post(`/approvals/${modalAction.booking_id}`, {
        decision: modalAction.action === 'approve' ? 'Approved' : 'Rejected',
        remarks,
      });
      toast.success(`Booking ${modalAction.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setModalAction(null);
      setRemarks('');
      fetchPending();
    } catch {
      toast.error(`Failed to ${modalAction.action} booking`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Approvals</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Requester</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Purpose</th>
              <th className="px-5 py-3 font-medium">Attendees</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-500">No pending approvals.</td></tr>
            ) : bookings.map(b => (
              <tr key={b.booking_id} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{b.resource_name}</td>
                <td className="px-5 py-3 text-gray-600">{b.requester_name || b.booked_by}</td>
                <td className="px-5 py-3 text-gray-600">{new Date(b.booking_date).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-gray-600">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{b.purpose}</td>
                <td className="px-5 py-3 text-gray-600">{b.attendee_count}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalAction({ booking_id: b.booking_id, action: 'approve' })}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                    >
                      <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setModalAction({ booking_id: b.booking_id, action: 'reject' })}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalAction.action === 'approve' ? 'Approve' : 'Reject'} Booking
              </h2>
              <button onClick={() => { setModalAction(null); setRemarks(''); }} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows="3"
                  placeholder="Add any remarks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAction}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${modalAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {submitting ? 'Processing...' : modalAction.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button onClick={() => { setModalAction(null); setRemarks(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
