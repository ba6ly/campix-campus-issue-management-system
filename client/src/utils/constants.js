import { Wifi, ShieldAlert, House, FileText, GraduationCap, BookOpen, Briefcase } from 'lucide-react';

export const CATEGORIES = [
  { value: 'hostel_wifi', label: 'Hostel/WiFi Issues' },
  { value: 'academic', label: 'Academic Issues' },
  { value: 'sports', label: 'Sports Issues' },
  { value: 'department', label: 'Department Issues' },
  { value: 'general', label: 'General Issues' },
  { value: 'library', label: 'Library Issues' },
  { value: 'placement', label: 'Placement Issues' },
];

export const CATEGORY_ICONS = {
  hostel_wifi: Wifi,
  academic: GraduationCap,
  sports: ShieldAlert,
  department: House,
  general: FileText,
  library: BookOpen,
  placement: Briefcase,
};

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4bc87a' },
  { value: 'medium', label: 'Medium', color: '#e8a84b' },
  { value: 'high', label: 'High', color: '#e84b4b' },
];

export const STATUSES = [
  { value: 'pending', label: 'Pending', color: '#6b7ab8' },
  { value: 'assigned', label: 'Assigned', color: '#e8a84b' },
  { value: 'in-progress', label: 'In Progress', color: '#4b9de8' },
  { value: 'resolved', label: 'Resolved', color: '#4bc87a' },
];

export const STATUS_COLORS = {
  pending: '#6b7ab8',
  assigned: '#e8a84b',
  'in-progress': '#4b9de8',
  resolved: '#4bc87a',
};

export const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Main Admin' },
  { value: 'academic_admin', label: 'Academic Management' },
  { value: 'hostel_admin', label: 'Hostel Management' },
  { value: 'hod_admin', label: 'HOD / Department Admin' },
  { value: 'sports_admin', label: 'Sports Management' },
  { value: 'library_admin', label: 'Library Management' },
  { value: 'placement_admin', label: 'Placement Cell' },
];

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
