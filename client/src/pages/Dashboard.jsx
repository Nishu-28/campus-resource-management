import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { HiOutlineCalendar, HiOutlineCube, HiOutlineUsers, HiOutlineClipboardDocumentCheck, HiOutlineSun } from 'react-icons/hi2';

const STATUS_COLORS = {
  Pending: { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  Approved: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  Rejected: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  Cancelled: { bar: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' },
  Completed: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
};

const MAINTENANCE_COLORS = {
  Reported: 'bg-red-100 text-red-700',
  In_Progress: 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role_name === 'Admin';
  const isHOD = user?.role_name === 'HOD';

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const cards = [
    { label: 'Total Bookings', value: stats?.totalBookings ?? 0, icon: HiOutlineCalendar, color: 'bg-blue-500' },
    { label: 'Available Resources', value: stats?.availableResources ?? 0, icon: HiOutlineCube, color: 'bg-green-500' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: HiOutlineClipboardDocumentCheck, color: 'bg-yellow-500' },
    { label: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: HiOutlineSun, color: 'bg-orange-500' },
  ];
  if (isAdmin) {
    cards.push({ label: 'Active Users', value: stats?.activeUsers ?? 0, icon: HiOutlineUsers, color: 'bg-purple-500' });
  }

  const totalStatusCount = stats?.bookingsByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500">Here&apos;s what&apos;s happening on campus today.</p>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-5 mb-8`}>
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings by Status */}
        {stats?.bookingsByStatus?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Status</h2>
            <div className="space-y-3">
              {stats.bookingsByStatus.map((s) => {
                const pct = Math.round((s.count / totalStatusCount) * 100);
                const colors = STATUS_COLORS[s.status] || { bar: 'bg-gray-400' };
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 shrink-0">{s.status}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className={`${colors.bar} h-4 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%`, minWidth: s.count > 0 ? '0.5rem' : '0' }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 5 Most Booked Resources */}
        {stats?.topResources?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Most Booked Resources</h2>
            <div className="space-y-3">
              {stats.topResources.map((r, i) => {
                const maxCount = stats.topResources[0]?.count || 1;
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <div key={r.resource_id} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-gray-400 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.resource_name}</p>
                      <div className="bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, minWidth: '0.5rem' }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{r.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Department Stats + Maintenance in two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Booking Stats (Admin / HOD only) */}
        {(isAdmin || isHOD) && stats?.deptStats?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Booking Stats</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-right">Approved</th>
                    <th className="pb-3 font-medium text-right">Pending</th>
                    <th className="pb-3 font-medium text-right">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.deptStats.map((d) => (
                    <tr key={d.dept_name} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{d.dept_name}</td>
                      <td className="py-3 text-right text-gray-600">{d.total_bookings}</td>
                      <td className="py-3 text-right text-green-600 font-medium">{d.approved}</td>
                      <td className="py-3 text-right text-yellow-600 font-medium">{d.pending}</td>
                      <td className="py-3 text-right text-red-600 font-medium">{d.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Maintenance Overview */}
        {stats?.maintenanceStats?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Overview</h2>
            <div className="flex flex-wrap gap-3">
              {stats.maintenanceStats.map((m) => (
                <div
                  key={m.status}
                  className={`${MAINTENANCE_COLORS[m.status] || 'bg-gray-100 text-gray-700'} px-4 py-3 rounded-lg text-center min-w-[120px]`}
                >
                  <p className="text-2xl font-bold">{m.count}</p>
                  <p className="text-xs font-medium mt-1">{m.status?.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Today */}
      {stats?.upcomingToday?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Resource</th>
                  <th className="pb-3 font-medium">Booked By</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingToday.map((b) => (
                  <tr key={b.booking_id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">{b.resource_name}</td>
                    <td className="py-3 text-gray-600">{b.booked_by}</td>
                    <td className="py-3 text-gray-600">{b.start_time} - {b.end_time}</td>
                    <td className="py-3 text-gray-600">{b.purpose || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {stats?.recentBookings?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Resource</th>
                  <th className="pb-3 font-medium">Booked By</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.booking_id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">{b.resource_name}</td>
                    <td className="py-3 text-gray-600">{b.booked_by}</td>
                    <td className="py-3 text-gray-600">{b.booking_date}</td>
                    <td className="py-3 text-gray-600">{b.start_time} - {b.end_time}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[b.booking_status]?.badge || 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
