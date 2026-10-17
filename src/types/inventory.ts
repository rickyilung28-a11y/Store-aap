export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  allocatedStock: number; // Qty requested in pending vouchers
  minStock: number;
  location: string;
  unitPrice?: number;
  description?: string;
  updatedAt: string;
}

export interface LPBItem {
  itemId: string;
  sku: string;
  itemName: string;
  unit: string;
  quantity: number;
  batchNo?: string;
  condition: 'Baik' | 'Kurang' | 'Rusak';
  notes?: string;
  specification?: string;
  storageLocation?: string;
}

export interface LPBDocument {
  id: string;
  lpbNumber: string; // LPB-202610-XXXX
  sjNumber: string; // Surat Jalan Supplier
  sjDate: string;
  supplierName: string;
  supplierAddress?: string;
  receivedDate: string;
  poNumber?: string;
  driverName?: string;
  vehiclePlate?: string;
  usagePurpose?: string;
  storageLocation?: string;
  notes?: string;
  receivedByAdmin: string;
  verifiedBy: string;
  items: LPBItem[];
  createdAt: string;
}

export interface CostCenterEntry {
  code: string; // e.g. "60"
  name: string; // e.g. "Bagging Plant 2 & Pemuatan"
  description?: string;
}

export interface GLAccountEntry {
  code: string; // e.g. "51010"
  name: string; // e.g. "Biaya Sparepart Mesin & Peralatan"
  description?: string;
}

export interface StorageLocation {
  id: string;
  code: string; // e.g. "RAK-A1"
  name: string; // e.g. "Rak A1 - Sparepart Mesin"
  zone?: string; // e.g. "Zona A (Mekanik & Mesin)"
  description?: string;
}

export interface CompanyProfile {
  appName: string; // e.g. "GudangPresisi"
  appTagline: string; // e.g. "SISTEM INVENTORY"
  companyName: string; // e.g. "PT. Abadi Agrosindo Persada"
  city: string; // e.g. "Sidoarjo"
  address: string; // e.g. "Kawasan Industri, Sidoarjo - Jawa Timur"
  phone?: string;
  email?: string;
  logoUrl?: string; // custom uploaded logo base64 or url; if empty uses default sprout logo
  sivDocCode: string; // e.g. "FR/AAP/G-STR/23/001"
  lpbDocCode: string; // e.g. "FR/AAP/G-LPB/23/002"
}

export type IssueVoucherStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IssueVoucherItem {
  itemId: string;
  sku: string;
  itemName: string;
  unit: string;
  requestedQty: number;
  approvedQty?: number;
  availableStockSnapshot?: number;
  costCenter?: string;
  glAcc?: string;
}

export interface IssueVoucherDocument {
  id: string;
  voucherNumber: string; // NPB-202610-XXXX
  requestedBy: string;
  userId: string;
  department: string;
  requestDate: string;
  purpose: string;
  notes?: string;
  status: IssueVoucherStatus;
  items: IssueVoucherItem[];
  approvedByAdmin?: string;
  approvedAt?: string;
  handoverOfficer?: string; // Petugas gudang penyerah barang
  recipientName?: string; // Penerima fisik barang
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  itemId: string;
  sku: string;
  itemName: string;
  type: MovementType;
  source: 'LPB_SUPPLIER' | 'NOTA_PENGAMBILAN' | 'PENYESUAIAN_AWAL';
  referenceNumber: string; // LPB No or NPB No
  secondaryRef?: string; // SJ No or Dept Pemohon
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  actor: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  targetUserId?: string; // If specific to a user
  targetRole?: UserRole | 'all';
  type: 'voucher_approved' | 'voucher_rejected' | 'voucher_created' | 'lpb_created' | 'low_stock' | 'min_stock_proposal' | 'min_stock_approved' | 'min_stock_rejected';
  title: string;
  message: string;
  voucherId?: string;
  lpbId?: string;
  proposalId?: string;
  read: boolean;
  timestamp: string;
}

export type MinStockProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MinStockProposal {
  id: string;
  proposalNumber: string; // e.g. "PROP-MIN-202610-001"
  itemId: string;
  sku: string;
  itemName: string;
  unit: string;
  currentMinStock: number; // Stok minimal sebelum usulan
  proposedMinStock: number; // Usulan stok minimal baru
  reason: string; // Alasan/justifikasi kebutuhan perubahan stok minimal
  requestedBy: string; // Nama user pemohon
  requestedByUserId: string;
  requestedByRole: UserRole;
  requestDate: string; // ISO date
  status: MinStockProposalStatus;
  reviewedByAdmin?: string; // Nama admin yang menyetujui / menolak
  reviewedAt?: string;
  adminNotes?: string; // Catatan dari admin
}

