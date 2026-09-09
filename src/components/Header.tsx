import React from 'react';
import { Search, Bell, Shield, Building, User } from 'lucide-react';
import { ModuleId } from '../types';
import { NAVIGATION_ITEMS, DEFAULT_USER } from '../data/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  currentModule: ModuleId;
}

export const Header: React.FC<HeaderProps> = ({ currentModule }) => {
  const currentNavItem = NAVIGATION_ITEMS.find(item => item.id === currentModule) || NAVIGATION_ITEMS[0];
  const { profile, user, signOut } = useAuth();
  const userName = profile?.email?.split('@')[0] || user?.email?.split('@')[0] || DEFAULT_USER.name;
  const userRole = profile?.role || DEFAULT_USER.role;
  const avatarInitials = userName.substring(0, 2).toUpperCase();
  const unit = profile?.unit || 'Unit: Silvassa & Mumbai HQ';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {currentNavItem.label}
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200">
              DGFT Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentNavItem.description}
          </p>
        </div>
      </div>

      {/* Center/Right Actions & User Profile */}
      <div className="flex items-center gap-4">
        {/* Quick Search Placeholder */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search licence no, SION, item..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            disabled
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </div>

        {/* Plant / Unit Selector Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
          <Building className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium">{unit}</span>
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
          onClick={() => alert('Notifications: No pending DGFT expiry alerts at this moment.')}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm border border-blue-200">
            {avatarInitials}
          </div>
          
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
              {userName}
              {userRole === 'Admin' && <Shield className="w-3 h-3 text-emerald-600 fill-emerald-100" title="Verified Officer" />}
            </div>
            <div className="text-[11px] text-slate-500">{userRole}</div>
          </div>
          <button onClick={signOut} className="ml-2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
};
