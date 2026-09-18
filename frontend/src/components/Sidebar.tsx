import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  MapPin,
  CalendarCheck,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Camera,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/lecturers', label: 'Lecturers', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/units', label: 'Units & Subjects', icon: Layers },
    { to: '/admin/venues', label: 'Venues', icon: MapPin },
    { to: '/admin/attendance', label: 'Attendance Records', icon: CalendarCheck },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
    { to: '/admin/audit-logs', label: 'Security Logs', icon: ShieldAlert },
  ];

  const lecturerLinks = [
    { to: '/lecturer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/lecturer/sessions', label: 'My Sessions', icon: CalendarCheck },
    { to: '/lecturer/sessions/new', label: 'Launch Session', icon: Camera },
    { to: '/lecturer/analytics', label: 'Attendance Stats', icon: BarChart3 },
    { to: '/lecturer/reports', label: 'Export Reports', icon: FileSpreadsheet },
  ];

  const links = isAdmin ? adminLinks : lecturerLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Vision<span className="text-brand-600">Attend</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {isAdmin ? 'Admin Console' : 'Lecturer Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onClose()}
                className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-3 ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
