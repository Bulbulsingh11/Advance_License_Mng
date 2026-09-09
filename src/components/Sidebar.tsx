import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Search, 
  BarChart3, 
  Settings, 
  Building2,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { ModuleId } from '../types';
import { NAVIGATION_ITEMS } from '../data/navigation';

interface SidebarProps {
  currentModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  collapsed?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Search,
  BarChart3,
  Settings,
  BookOpen
};

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onSelectModule }) => {
  return (
    <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col items-start gap-3 bg-slate-950/50">
        <img 
          src="/Alok-Color.png" 
          alt="Alok Industries" 
          className="h-12 w-auto object-contain object-left"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm tracking-tight text-white">ALOK INDUSTRIES</h1>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-medium px-1.5 py-0.5 rounded border border-blue-500/30">ALMS</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Export & Logistics Dept</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main Modules
        </div>
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.iconName] || LayoutDashboard;
          const isActive = currentModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm font-semibold' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Status
          </span>
          <span className="text-emerald-400 font-medium">Operational</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Version 1.0.0-beta</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Audit Ready
          </span>
        </div>
      </div>
    </aside>
  );
};
