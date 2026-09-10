import { NavigationItem, UserProfile } from '../types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    description: 'Overview of active licences, utilization summary, and key alerts.'
  },
  {
    id: 'licences',
    label: 'Advance Licences',
    iconName: 'FileText',
    description: 'Manage DGFT Advance Licences, export obligation periods, and sanctioned values/quantities.',
    badge: 'Core'
  },
  {
    id: 'materials',
    label: 'Materials / Items',
    iconName: 'Package',
    description: 'SCOMET items, input raw materials (SION norms), and export finished goods master.'
  },
  {
    id: 'imports',
    label: 'Import Transactions',
    iconName: 'ArrowDownLeft',
    description: 'Bill of Entry (BOE), duty-free raw material imports against specific licences.'
  },
  {
    id: 'exports',
    label: 'Export Transactions',
    iconName: 'ArrowUpRight',
    description: 'Shipping Bills (SB), fulfillment of Export Obligation (EO) and physical exports.'
  },
  {
    id: 'utilization',
    label: 'Utilization',
    iconName: 'PieChart',
    description: 'Licence-wise consumption mapping, value/quantity balance, and EO discharge status.'
  },
  {
    id: 'finder',
    label: 'Licence Finder',
    iconName: 'Search',
    description: 'Smart query tool to find the optimal Advance Licence for upcoming import/export shipments.'
  },
  {
    id: 'reports',
    label: 'Reports',
    iconName: 'BarChart3',
    description: 'Compliance reports, audit trails, expiry alerts, and management summaries.'
  },
  {
    id: 'settings',
    label: 'Settings',
    iconName: 'Settings',
    description: 'System preferences, exchange rates, SION templates, and user access roles.'
  },
  {
    id: 'guide',
    label: 'Portal Guide',
    iconName: 'BookOpen',
    description: 'Comprehensive guide explaining DGFT Advance Licencing, SION norms, AI extraction, and workflow.',
    badge: 'Help'
  }
];

export const DEFAULT_USER: UserProfile = {
  name: 'Girman Thapa',
  role: 'Senior Export & Logistics Manager',
  department: 'Export Documentation & Compliance',
  location: 'India Delhi Okhla Phase 3',
  avatarInitials: 'GT'
};
