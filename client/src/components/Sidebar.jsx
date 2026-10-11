import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineCube,
  HiOutlineClipboardDocumentCheck,
  HiOutlineBell,
  HiOutlineWrench,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineQueueList,
  HiOutlineUserCircle,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';

const navSections = [
  {
    title: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: HiOutlineHome, roles: null },
      { to: '/profile', label: 'Profile', icon: HiOutlineUserCircle, roles: null },
      { to: '/resources', label: 'Resources', icon: HiOutlineCube, roles: null },
      { to: '/bookings', label: 'Bookings', icon: HiOutlineCalendar, roles: null },
    ],
  },
  {
    title: 'Activity',
    items: [
      { to: '/approvals', label: 'Approvals', icon: HiOutlineClipboardDocumentCheck, roles: ['Admin', 'HOD'] },
      { to: '/notifications', label: 'Notifications', icon: HiOutlineBell, roles: null, showBadge: true },
      { to: '/maintenance', label: 'Maintenance', icon: HiOutlineWrench, roles: null },
      { to: '/waitlist', label: 'Waitlist', icon: HiOutlineQueueList, roles: null },
      { to: '/usage-logs', label: 'Usage Logs', icon: HiOutlineClock, roles: ['Admin', 'HOD', 'Faculty'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/admin/users', label: 'Manage Users', icon: HiOutlineUsers, roles: ['Admin'] },
      { to: '/admin/buildings', label: 'Buildings & Depts', icon: HiOutlineBuildingOffice2, roles: ['Admin'] },
      { to: '/admin/time-slots', label: 'Time Slots', icon: HiOutlineClock, roles: ['Admin'] },
      { to: '/admin/academic-terms', label: 'Academic Terms', icon: HiOutlineAcademicCap, roles: ['Admin'] },
      { to: '/admin/holidays', label: 'Holidays', icon: HiOutlineCalendar, roles: ['Admin'] },
      { to: '/admin/resource-policies', label: 'Resource Policies', icon: HiOutlineShieldCheck, roles: ['Admin'] },
      { to: '/audit-logs', label: 'Audit Logs', icon: HiOutlineDocumentText, roles: ['Admin'] },
    ],
  },
];

export default function Sidebar({ open, onClose, unreadCount = 0 }) {
  const { user } = useAuth();

  const visibleSections = navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.roles || i.roles.includes(user?.role_name)),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 w-72 bg-white border-r border-slate-200 flex flex-col z-20 transform transition-transform duration-300 shadow-sm ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Mobile close */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-3 right-3 p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
        aria-label="Close sidebar"
      >
        <HiOutlineXMark className="w-5 h-5" />
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center justify-between gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1e4d8c] to-[#2a6fc4] text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#1e4d8c]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3 min-w-0">
                      <item.icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#1e4d8c]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.showBadge && unreadCount > 0 && (
                      <span
                        className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          isActive ? 'bg-white text-[#1e4d8c]' : 'bg-red-500 text-white'
                        }`}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-slate-200 text-[11px] text-slate-400 bg-slate-50">
        <p className="font-semibold text-slate-600">Campus Resource Management</p>
        <p>SRM KTR &copy; 2026</p>
      </div>
    </aside>
  );
}
