import React, { useState } from 'react';
import { Menu, Sun, Moon, ShieldCheck, Activity, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onMenuToggle: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* System Health Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium">InsightFace Engine Online</span>
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            title="Change Password"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Role Tag */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden md:block text-right">
              <p className="text-xs font-medium text-slate-900 dark:text-white">
                {user?.full_name}
              </p>
              <span className="text-[10px] uppercase font-semibold text-brand-600 dark:text-brand-400">
                {user?.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
