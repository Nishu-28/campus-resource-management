import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // refetch on route change (e.g., after visiting Notifications)
  useEffect(() => {
    fetchUnread();
  }, [location.pathname, fetchUnread]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-30 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Toggle sidebar"
          >
            <HiOutlineBars3 className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/srm-logo.png"
              alt="SRM Institute of Science & Technology"
              className="h-11 md:h-12 w-auto object-contain"
            />
            <div className="hidden md:block pl-3 border-l border-slate-200">
              <p className="text-xs text-slate-500 leading-tight">Campus Resource</p>
              <p className="text-sm font-bold text-[#1e4d8c] leading-tight">
                Management Portal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Notifications"
            title="Notifications"
          >
            <HiOutlineBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User */}
          <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e4d8c] to-[#2a6fc4] text-white flex items-center justify-center font-semibold text-sm shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role_name}</p>
            </div>
            <button
              onClick={logout}
              className="ml-1 p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadCount={unreadCount} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-20 md:hidden"
        />
      )}

      {/* Main */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'md:pl-72' : 'md:pl-0'
        }`}
      >
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
