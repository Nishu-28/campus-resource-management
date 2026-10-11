import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineInformationCircle } from 'react-icons/hi2';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const typeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'success':
      case 'approved':
        return <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
      case 'rejected':
        return <HiOutlineExclamationTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <HiOutlineInformationCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const typeBadge = (type) => {
    const colors = {
      success: 'bg-green-100 text-green-700',
      approved: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      error: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
    };
    const c = colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c}`}>{type || 'Info'}</span>;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <HiOutlineBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.notification_id}
            onClick={() => !n.is_read && markAsRead(n.notification_id)}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.is_read ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : ''}`}
          >
            <div className="mt-0.5">{typeIcon(n.type || n.notification_type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {typeBadge(n.type || n.notification_type)}
                {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
              </div>
              <p className="text-sm text-gray-900">{n.message || n.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
