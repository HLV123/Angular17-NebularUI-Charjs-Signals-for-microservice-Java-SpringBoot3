export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES_MGR' | 'INV_MGR' | 'MKT_MGR' | 'CS_AGENT' | 'CASHIER' | 'ANALYST';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
  department: string;
  email: string;
}

export interface MenuItem {
  key: string;
  title: string;
  icon: string;
  protocol?: string;
  badge?: string;
}

// Permission matrix - which roles can access which pages
// false = hidden entirely, true = visible
export const ROLE_PERMISSIONS: Record<string, Record<UserRole, boolean>> = {
  'dashboard':        { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: true,  CASHIER: true,  ANALYST: true  },
  'products':         { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: false, CASHIER: true,  ANALYST: false },
  'inventory':        { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: true,  MKT_MGR: false, CS_AGENT: false, CASHIER: false, ANALYST: false },
  'orders':           { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: false, MKT_MGR: false, CS_AGENT: true,  CASHIER: true,  ANALYST: false },
  'crm':              { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: false, MKT_MGR: true,  CS_AGENT: true,  CASHIER: false, ANALYST: false },
  'marketing':        { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: false, MKT_MGR: true,  CS_AGENT: false, CASHIER: false, ANALYST: false },
  'omnichannel':      { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: false, CASHIER: false, ANALYST: false },
  'analytics':        { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: false, CASHIER: false, ANALYST: true  },
  'finance':          { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: false, MKT_MGR: false, CS_AGENT: false, CASHIER: true,  ANALYST: false },
  'staff':            { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: false, MKT_MGR: false, CS_AGENT: false, CASHIER: false, ANALYST: false },
  'notifications':    { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: true,  CASHIER: true,  ANALYST: true  },
  'search':           { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: true,  INV_MGR: true,  MKT_MGR: true,  CS_AGENT: true,  CASHIER: true,  ANALYST: true  },
  'data-governance':  { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: false, MKT_MGR: false, CS_AGENT: false, CASHIER: false, ANALYST: true  },
  'pipeline':         { SUPER_ADMIN: true,  ADMIN: true,  SALES_MGR: false, INV_MGR: false, MKT_MGR: false, CS_AGENT: false, CASHIER: false, ANALYST: true  },
};

export const MENU_ITEMS: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Tổng quan',
    items: [
      { key: 'dashboard', title: 'Dashboard', icon: 'fa-th-large', protocol: 'RSocket' },
    ]
  },
  {
    section: 'Quản lý kinh doanh',
    items: [
      { key: 'products', title: 'Sản phẩm', icon: 'fa-box', protocol: 'REST' },
      { key: 'inventory', title: 'Kho hàng', icon: 'fa-warehouse', protocol: 'gRPC' },
      { key: 'orders', title: 'Đơn hàng', icon: 'fa-shopping-cart', badge: '6' },
      { key: 'crm', title: 'CRM 360°', icon: 'fa-users', protocol: 'Elastic' },
    ]
  },
  {
    section: 'Marketing & Bán hàng',
    items: [
      { key: 'marketing', title: 'Marketing', icon: 'fa-bullhorn', protocol: 'Airflow' },
      { key: 'omnichannel', title: 'Đa kênh', icon: 'fa-satellite-dish', protocol: 'Kafka' },
    ]
  },
  {
    section: 'Phân tích & Hệ thống',
    items: [
      { key: 'analytics', title: 'Analytics', icon: 'fa-chart-pie', protocol: 'Spark' },
      { key: 'finance', title: 'Tài chính', icon: 'fa-coins' },
      { key: 'staff', title: 'Nhân viên', icon: 'fa-user-shield', protocol: 'Ranger' },
    ]
  },
  {
    section: 'Hệ thống nâng cao',
    items: [
      { key: 'notifications', title: 'Thông báo', icon: 'fa-bell', badge: '4' },
      { key: 'search', title: 'Tìm kiếm', icon: 'fa-search', protocol: 'Elastic' },
      { key: 'data-governance', title: 'Atlas / Ranger', icon: 'fa-shield-alt' },
      { key: 'pipeline', title: 'Pipeline', icon: 'fa-stream', protocol: 'Spark' },
    ]
  }
];

export const DEMO_USERS: User[] = [
  { id: 1, username: 'superadmin', fullName: 'Nguyễn Văn Admin', role: 'SUPER_ADMIN', roleLabel: 'Super Admin', initials: 'SA', department: 'IT', email: 'admin@omnirevenue.vn' },
  { id: 2, username: 'admin', fullName: 'Trần Thị Quản Lý', role: 'ADMIN', roleLabel: 'Admin', initials: 'TQ', department: 'Operations', email: 'quanly@omnirevenue.vn' },
  { id: 3, username: 'sales', fullName: 'Lê Minh Bán Hàng', role: 'SALES_MGR', roleLabel: 'Sales Manager', initials: 'LM', department: 'Sales', email: 'sales@omnirevenue.vn' },
  { id: 4, username: 'warehouse', fullName: 'Phạm Kho Hàng', role: 'INV_MGR', roleLabel: 'Inventory Manager', initials: 'PK', department: 'Warehouse', email: 'kho@omnirevenue.vn' },
  { id: 5, username: 'marketing', fullName: 'Hoàng Thị Marketing', role: 'MKT_MGR', roleLabel: 'Marketing Manager', initials: 'HM', department: 'Marketing', email: 'mkt@omnirevenue.vn' },
  { id: 6, username: 'csagent', fullName: 'Vũ Chăm Sóc', role: 'CS_AGENT', roleLabel: 'CS Agent', initials: 'VC', department: 'Support', email: 'cs@omnirevenue.vn' },
  { id: 7, username: 'cashier', fullName: 'Đỗ Thu Ngân', role: 'CASHIER', roleLabel: 'Cashier (POS)', initials: 'ĐT', department: 'POS', email: 'pos@omnirevenue.vn' },
  { id: 8, username: 'analyst', fullName: 'Ngô Phân Tích', role: 'ANALYST', roleLabel: 'Data Analyst', initials: 'NP', department: 'Data', email: 'data@omnirevenue.vn' },
];
