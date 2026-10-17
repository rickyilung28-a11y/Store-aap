import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  StockItem,
  LPBDocument,
  IssueVoucherDocument,
  StockMovement,
  AppNotification,
  UserAccount,
  UserRole,
  LPBItem,
  IssueVoucherItem,
  CostCenterEntry,
  GLAccountEntry,
  StorageLocation,
  CompanyProfile,
  MinStockProposal,
} from '../types/inventory';
import {
  INITIAL_USERS,
  INITIAL_STOCK_ITEMS,
  INITIAL_LPB_DOCUMENTS,
  INITIAL_ISSUE_VOUCHERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COST_CENTERS,
  INITIAL_GL_ACCOUNTS,
  INITIAL_STORAGE_LOCATIONS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_MIN_STOCK_PROPOSALS,
} from '../data/mockData';
import { realtimeService, RealtimeEventPayload } from '../services/realtimeService';

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  voucherNumber?: string;
}

interface InventoryContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => { success: boolean; error?: string; user?: UserAccount };
  logout: () => void;
  createUser: (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    department: string;
    email?: string;
  }) => { success: boolean; error?: string; user?: UserAccount };
  updateUser: (userId: string, updates: Partial<UserAccount>) => { success: boolean; error?: string };
  resetUserPassword: (userId: string, newPassword: string) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; error?: string };
  toggleUserStatus: (userId: string) => { success: boolean; error?: string };

  stockItems: StockItem[];
  lpbDocuments: LPBDocument[];
  issueVouchers: IssueVoucherDocument[];
  stockMovements: StockMovement[];
  notifications: AppNotification[];

  // Cost Center & GL Accounts Master (Admin editable & dropdown selectable)
  costCenters: CostCenterEntry[];
  glAccounts: GLAccountEntry[];
  addCostCenter: (entry: CostCenterEntry) => { success: boolean; error?: string };
  updateCostCenter: (oldCode: string, entry: CostCenterEntry) => { success: boolean; error?: string };
  deleteCostCenter: (code: string) => { success: boolean; error?: string };
  importCostCentersBulk: (
    entries: CostCenterEntry[],
    mode?: 'upsert' | 'replace'
  ) => { success: boolean; added: number; updated: number; error?: string };
  addGLAccount: (entry: GLAccountEntry) => { success: boolean; error?: string };
  updateGLAccount: (oldCode: string, entry: GLAccountEntry) => { success: boolean; error?: string };
  deleteGLAccount: (code: string) => { success: boolean; error?: string };
  importGLAccountsBulk: (
    entries: GLAccountEntry[],
    mode?: 'upsert' | 'replace'
  ) => { success: boolean; added: number; updated: number; error?: string };
  
  activeToast: ToastInfo | null;
  dismissToast: () => void;
  
  // Actions
  createLPB: (data: {
    sjNumber: string;
    sjDate: string;
    supplierName: string;
    receivedDate: string;
    poNumber?: string;
    driverName?: string;
    vehiclePlate?: string;
    usagePurpose?: string;
    storageLocation?: string;
    notes?: string;
    items: Omit<LPBItem, 'sku' | 'itemName' | 'unit'>[];
  }) => LPBDocument;

  createIssueVoucher: (data: {
    purpose: string;
    notes?: string;
    department?: string;
    items: { itemId: string; requestedQty: number; costCenter?: string; glAcc?: string }[];
  }) => { success: boolean; voucher?: IssueVoucherDocument; error?: string };

  approveIssueVoucher: (
    voucherId: string,
    handover: { handoverOfficer: string; recipientName: string; notes?: string }
  ) => { success: boolean; error?: string };

  rejectIssueVoucher: (voucherId: string, reason: string) => { success: boolean; error?: string };

  updateIssueVoucher: (
    voucherId: string,
    data: {
      purpose: string;
      notes?: string;
      items: { itemId: string; requestedQty: number; costCenter?: string; glAcc?: string }[];
    }
  ) => { success: boolean; error?: string };

  deleteIssueVoucher: (voucherId: string) => { success: boolean; error?: string };

  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  
  addNewStockItem: (item: Omit<StockItem, 'id' | 'allocatedStock' | 'updatedAt'>) => StockItem;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => { success: boolean; error?: string };
  importStockItemsBulk: (
    items: Array<{
      sku: string;
      name: string;
      category: string;
      unit: string;
      currentStock: number;
      minStock: number;
      location: string;
      description?: string;
    }>,
    mode?: 'upsert' | 'add_only'
  ) => { success: boolean; added: number; updated: number; error?: string };

  // Lokasi & Rak Penyimpanan
  storageLocations: StorageLocation[];
  addStorageLocation: (loc: Omit<StorageLocation, 'id'>) => { success: boolean; location?: StorageLocation; error?: string };
  updateStorageLocation: (id: string, updates: Partial<StorageLocation>) => { success: boolean; error?: string };
  deleteStorageLocation: (id: string) => { success: boolean; error?: string };

  // Data Perusahaan & Branding
  companyProfile: CompanyProfile;
  updateCompanyProfile: (updates: Partial<CompanyProfile>) => void;
  resetCompanyProfile: () => void;
  
  // Batas Stok Minimal & Pengajuan
  minStockProposals: MinStockProposal[];
  createMinStockProposal: (data: {
    itemId: string;
    proposedMinStock: number;
    reason: string;
  }) => { success: boolean; proposal?: MinStockProposal; error?: string };
  approveMinStockProposal: (
    proposalId: string,
    adminNotes?: string
  ) => { success: boolean; error?: string };
  rejectMinStockProposal: (
    proposalId: string,
    adminNotes: string
  ) => { success: boolean; error?: string };

  // Alert helpers
  lowStockItems: StockItem[]; // Melampaui / Kritis (currentStock <= minStock)
  nearMinStockItems: StockItem[]; // Mendekati minimal (currentStock > minStock && currentStock <= minStock + buffer)

  // Print preview state
  selectedDocumentForPrint: { type: 'LPB' | 'NPB'; doc: LPBDocument | IssueVoucherDocument } | null;
  openPrintPreview: (type: 'LPB' | 'NPB', doc: LPBDocument | IssueVoucherDocument) => void;
  closePrintPreview: () => void;

  resetToDefaultData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'inv_current_user_id',
  USERS: 'inv_users_list_v2',
  STOCK_ITEMS: 'inv_stock_items_v2',
  LPB_DOCS: 'inv_lpb_docs_v2',
  ISSUE_VOUCHERS: 'inv_issue_vouchers_v2',
  STOCK_MOVEMENTS: 'inv_stock_movements_v2',
  NOTIFICATIONS: 'inv_notifications_v2',
  COST_CENTERS: 'inv_cost_centers_v2',
  GL_ACCOUNTS: 'inv_gl_accounts_v2',
  STORAGE_LOCATIONS: 'inv_storage_locations_v2',
  COMPANY_PROFILE: 'inv_company_profile_v2',
  MIN_STOCK_PROPOSALS: 'inv_min_stock_proposals_v2',
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Users list state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  // Current user state (null if not logged in)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const savedUsersJson = localStorage.getItem(STORAGE_KEYS.USERS);
        const usersList: UserAccount[] = savedUsersJson ? JSON.parse(savedUsersJson) : INITIAL_USERS;
        const found = usersList.find((u) => u.id === saved && u.isActive !== false);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Stock items
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STOCK_ITEMS;
  });

  // LPB Documents
  const [lpbDocuments, setLpbDocuments] = useState<LPBDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LPB_DOCS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LPB_DOCUMENTS;
  });

  // Issue Vouchers (Nota Pengambilan Barang)
  const [issueVouchers, setIssueVouchers] = useState<IssueVoucherDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ISSUE_VOUCHERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_ISSUE_VOUCHERS;
  });

  // Stock Movements Ledger
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STOCK_MOVEMENTS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Cost Centers Master State
  const [costCenters, setCostCenters] = useState<CostCenterEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COST_CENTERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_COST_CENTERS;
  });

  // GL Accounts Master State
  const [glAccounts, setGlAccounts] = useState<GLAccountEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GL_ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_GL_ACCOUNTS;
  });

  // Storage Locations State (Rak & Lokasi Penyimpanan)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORAGE_LOCATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_STORAGE_LOCATIONS;
  });

  // Company Profile & Branding State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANY_PROFILE);
      if (saved) return { ...INITIAL_COMPANY_PROFILE, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return INITIAL_COMPANY_PROFILE;
  });

  // Batas Stok Minimal & Pengajuan State
  const [minStockProposals, setMinStockProposals] = useState<MinStockProposal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MIN_STOCK_PROPOSALS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MIN_STOCK_PROPOSALS;
  });

  // Floating Toast Alert
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);

  // Print Preview Modal State
  const [selectedDocumentForPrint, setSelectedDocumentForPrint] = useState<{
    type: 'LPB' | 'NPB';
    doc: LPBDocument | IssueVoucherDocument;
  } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(stockItems));
    } catch {}
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LPB_DOCS, JSON.stringify(lpbDocuments));
    } catch {}
  }, [lpbDocuments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ISSUE_VOUCHERS, JSON.stringify(issueVouchers));
    } catch {}
  }, [issueVouchers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements));
    } catch {}
  }, [stockMovements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COST_CENTERS, JSON.stringify(costCenters));
    } catch {}
  }, [costCenters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GL_ACCOUNTS, JSON.stringify(glAccounts));
    } catch {}
  }, [glAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORAGE_LOCATIONS, JSON.stringify(storageLocations));
    } catch {}
  }, [storageLocations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY_PROFILE, JSON.stringify(companyProfile));
    } catch {}
  }, [companyProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MIN_STOCK_PROPOSALS, JSON.stringify(minStockProposals));
    } catch {}
  }, [minStockProposals]);

  // Real-time Event Listener (BroadcastChannel & Storage Events)
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((payload: RealtimeEventPayload) => {
      if (payload.type === 'VOUCHER_APPROVED') {
        const voucher = payload.data as IssueVoucherDocument;
        
        // Show real-time toast to the user
        setActiveToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Nota Pengambilan Disetujui & Diserahkan!',
          message: `Nota #${voucher.voucherNumber} (${voucher.department}) telah di-ACC oleh Admin. Barang telah diserahkan & stok resmi dipotong.`,
          voucherNumber: voucher.voucherNumber,
        });

        // Ensure state is updated if from another tab
        setIssueVouchers((prev) =>
          prev.map((v) => (v.id === voucher.id ? voucher : v))
        );
      } else if (payload.type === 'VOUCHER_CREATED') {
        const voucher = payload.data as IssueVoucherDocument;
        setActiveToast({
          id: Math.random().toString(),
          type: 'info',
          title: 'Nota Pengambilan Baru Terbit',
          message: `Nota #${voucher.voucherNumber} dibuat oleh ${voucher.requestedBy} (${voucher.department}). Menunggu approval admin.`,
          voucherNumber: voucher.voucherNumber,
        });
      } else if (payload.type === 'VOUCHER_REJECTED') {
        const voucher = payload.data as IssueVoucherDocument;
        setActiveToast({
          id: Math.random().toString(),
          type: 'warning',
          title: 'Nota Pengambilan Ditolak',
          message: `Nota #${voucher.voucherNumber} ditolak. Alasan: ${voucher.rejectionReason || 'Tidak disebutkan'}.`,
          voucherNumber: voucher.voucherNumber,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    (username: string, password: string) => {
      const trimmedUser = username.trim().toLowerCase();
      const user = users.find(
        (u) => u.username.toLowerCase() === trimmedUser && u.password === password
      );

      if (!user) {
        return { success: false, error: 'Username atau password salah. Silakan periksa kembali.' };
      }

      if (user.isActive === false) {
        return {
          success: false,
          error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi admin gudang untuk mengaktifkan.',
        };
      }

      const updatedUser: UserAccount = {
        ...user,
        lastLogin: new Date().toISOString(),
      };

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      setCurrentUser(updatedUser);

      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Login Berhasil',
        message: `Selamat datang, ${user.name} (${user.role === 'admin' ? 'Administrator Gudang' : user.department}).`,
      });

      return { success: true, user: updatedUser };
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setActiveToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Logout Berhasil',
      message: 'Anda telah keluar dari sistem inventaris gudang.',
    });
  }, []);

  const createUser = useCallback(
    (userData: {
      username: string;
      password: string;
      name: string;
      role: UserRole;
      department: string;
      email?: string;
    }) => {
      const trimmedUsername = userData.username.trim().toLowerCase();
      if (!trimmedUsername || !userData.password || !userData.name) {
        return { success: false, error: 'Username, password, dan nama lengkap wajib diisi.' };
      }

      if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
        return { success: false, error: `Username "${userData.username}" sudah digunakan. Silakan gunakan username lain.` };
      }

      const newUser: UserAccount = {
        id: `user_${Date.now()}`,
        username: userData.username.trim(),
        password: userData.password,
        name: userData.name.trim(),
        role: userData.role,
        department: userData.department.trim(),
        email: userData.email ? userData.email.trim() : `${trimmedUsername}@pabrik.co.id`,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);

      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Akun Pengguna Baru Dibuat',
        message: `Akun "${newUser.username}" (${newUser.name}) berhasil ditambahkan oleh Admin.`,
      });

      return { success: true, user: newUser };
    },
    [users]
  );

  const updateUser = useCallback(
    (userId: string, updates: Partial<UserAccount>) => {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return { success: false, error: 'Pengguna tidak ditemukan.' };

      if (updates.username) {
        const trimmed = updates.username.trim().toLowerCase();
        if (users.some((u) => u.id !== userId && u.username.toLowerCase() === trimmed)) {
          return { success: false, error: `Username "${updates.username}" sudah dipakai akun lain.` };
        }
      }

      const updated = { ...targetUser, ...updates };
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));

      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updated);
      }

      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Data Pengguna Diperbarui',
        message: `Perubahan akun ${updated.username} berhasil disimpan.`,
      });

      return { success: true };
    },
    [currentUser, users]
  );

  const resetUserPassword = useCallback(
    (userId: string, newPassword: string) => {
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'Password baru minimal 4 karakter.' };
      }

      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return { success: false, error: 'Pengguna tidak ditemukan.' };

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
      );

      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Password Berhasil Diubah',
        message: `Password akun ${targetUser.username} telah diperbarui oleh Admin.`,
      });

      return { success: true };
    },
    [users]
  );

  const deleteUser = useCallback(
    (userId: string) => {
      if (currentUser && currentUser.id === userId) {
        return { success: false, error: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif login.' };
      }

      const target = users.find((u) => u.id === userId);
      if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };

      setUsers((prev) => prev.filter((u) => u.id !== userId));

      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Pengguna Dihapus',
        message: `Akun ${target.username} (${target.name}) telah dihapus dari sistem.`,
      });

      return { success: true };
    },
    [currentUser, users]
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      if (currentUser && currentUser.id === userId) {
        return { success: false, error: 'Tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.' };
      }

      const target = users.find((u) => u.id === userId);
      if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };

      const newStatus = !target.isActive;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
      );

      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: newStatus ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
        message: `Status akun ${target.username} diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`,
      });

      return { success: true };
    },
    [currentUser, users]
  );

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Cost Center Management (Admin)
  const addCostCenter = useCallback((entry: CostCenterEntry) => {
    const code = entry.code.trim();
    const name = entry.name.trim();
    if (!code) return { success: false, error: 'Nomor / Kode Cost Center wajib diisi.' };
    if (!name) return { success: false, error: 'Nama / Keterangan Cost Center wajib diisi.' };
    if (costCenters.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      return { success: false, error: `Cost Center dengan kode "${code}" sudah terdaftar.` };
    }
    setCostCenters((prev) => [...prev, { code, name, description: entry.description?.trim() || '' }]);
    return { success: true };
  }, [costCenters]);

  const updateCostCenter = useCallback((oldCode: string, entry: CostCenterEntry) => {
    const code = entry.code.trim();
    const name = entry.name.trim();
    if (!code) return { success: false, error: 'Nomor / Kode Cost Center wajib diisi.' };
    if (!name) return { success: false, error: 'Nama / Keterangan Cost Center wajib diisi.' };
    if (
      code.toLowerCase() !== oldCode.toLowerCase() &&
      costCenters.some((c) => c.code.toLowerCase() === code.toLowerCase())
    ) {
      return { success: false, error: `Cost Center dengan kode "${code}" sudah digunakan.` };
    }
    setCostCenters((prev) =>
      prev.map((c) => (c.code === oldCode ? { code, name, description: entry.description?.trim() || '' } : c))
    );
    return { success: true };
  }, [costCenters]);

  const deleteCostCenter = useCallback((code: string) => {
    setCostCenters((prev) => prev.filter((c) => c.code !== code));
    return { success: true };
  }, []);

  const importCostCentersBulk = useCallback(
    (entries: CostCenterEntry[], mode: 'upsert' | 'replace' = 'upsert') => {
      if (!entries || entries.length === 0) {
        return { success: false, added: 0, updated: 0, error: 'Tidak ada data Cost Center yang valid untuk diimpor.' };
      }

      let added = 0;
      let updated = 0;

      if (mode === 'replace') {
        const cleaned: CostCenterEntry[] = [];
        const seenCodes = new Set<string>();
        for (const item of entries) {
          const code = (item.code || '').toString().trim();
          const name = (item.name || '').toString().trim();
          if (code && name && !seenCodes.has(code.toLowerCase())) {
            seenCodes.add(code.toLowerCase());
            cleaned.push({
              code,
              name,
              description: item.description ? item.description.toString().trim() : '',
            });
            added++;
          }
        }
        setCostCenters(cleaned);
        setActiveToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Import Excel Berhasil',
          message: `${added} data Cost Center berhasil diimpor (mode ganti semua).`,
        });
        return { success: true, added, updated: 0 };
      } else {
        // Upsert mode
        setCostCenters((prev) => {
          const map = new Map<string, CostCenterEntry>();
          prev.forEach((c) => map.set(c.code.toLowerCase(), c));

          entries.forEach((item) => {
            const code = (item.code || '').toString().trim();
            const name = (item.name || '').toString().trim();
            if (code && name) {
              const key = code.toLowerCase();
              if (map.has(key)) {
                map.set(key, {
                  code,
                  name,
                  description: item.description ? item.description.toString().trim() : map.get(key)!.description || '',
                });
                updated++;
              } else {
                map.set(key, {
                  code,
                  name,
                  description: item.description ? item.description.toString().trim() : '',
                });
                added++;
              }
            }
          });

          return Array.from(map.values());
        });

        setActiveToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Import Excel Berhasil',
          message: `${added} Cost Center baru ditambahkan, ${updated} diperbarui.`,
        });

        return { success: true, added, updated };
      }
    },
    []
  );

  // GL Account Management (Admin)
  const addGLAccount = useCallback((entry: GLAccountEntry) => {
    const code = entry.code.trim();
    const name = entry.name.trim();
    if (!code) return { success: false, error: 'Nomor GL Account wajib diisi.' };
    if (!name) return { success: false, error: 'Nama / Keterangan GL Account wajib diisi.' };
    if (glAccounts.some((g) => g.code.toLowerCase() === code.toLowerCase())) {
      return { success: false, error: `GL Account dengan nomor "${code}" sudah terdaftar.` };
    }
    setGlAccounts((prev) => [...prev, { code, name, description: entry.description?.trim() || '' }]);
    return { success: true };
  }, [glAccounts]);

  const updateGLAccount = useCallback((oldCode: string, entry: GLAccountEntry) => {
    const code = entry.code.trim();
    const name = entry.name.trim();
    if (!code) return { success: false, error: 'Nomor GL Account wajib diisi.' };
    if (!name) return { success: false, error: 'Nama / Keterangan GL Account wajib diisi.' };
    if (
      code.toLowerCase() !== oldCode.toLowerCase() &&
      glAccounts.some((g) => g.code.toLowerCase() === code.toLowerCase())
    ) {
      return { success: false, error: `GL Account dengan nomor "${code}" sudah digunakan.` };
    }
    setGlAccounts((prev) =>
      prev.map((g) => (g.code === oldCode ? { code, name, description: entry.description?.trim() || '' } : g))
    );
    return { success: true };
  }, [glAccounts]);

  const deleteGLAccount = useCallback((code: string) => {
    setGlAccounts((prev) => prev.filter((g) => g.code !== code));
    return { success: true };
  }, []);

  const importGLAccountsBulk = useCallback(
    (entries: GLAccountEntry[], mode: 'upsert' | 'replace' = 'upsert') => {
      if (!entries || entries.length === 0) {
        return { success: false, added: 0, updated: 0, error: 'Tidak ada data GL Account yang valid untuk diimpor.' };
      }

      let added = 0;
      let updated = 0;

      if (mode === 'replace') {
        const cleaned: GLAccountEntry[] = [];
        const seenCodes = new Set<string>();
        for (const item of entries) {
          const code = (item.code || '').toString().trim();
          const name = (item.name || '').toString().trim();
          if (code && name && !seenCodes.has(code.toLowerCase())) {
            seenCodes.add(code.toLowerCase());
            cleaned.push({
              code,
              name,
              description: item.description ? item.description.toString().trim() : '',
            });
            added++;
          }
        }
        setGlAccounts(cleaned);
        setActiveToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Import Excel Berhasil',
          message: `${added} data GL Account berhasil diimpor (mode ganti semua).`,
        });
        return { success: true, added, updated: 0 };
      } else {
        // Upsert mode
        setGlAccounts((prev) => {
          const map = new Map<string, GLAccountEntry>();
          prev.forEach((g) => map.set(g.code.toLowerCase(), g));

          entries.forEach((item) => {
            const code = (item.code || '').toString().trim();
            const name = (item.name || '').toString().trim();
            if (code && name) {
              const key = code.toLowerCase();
              if (map.has(key)) {
                map.set(key, {
                  code,
                  name,
                  description: item.description ? item.description.toString().trim() : map.get(key)!.description || '',
                });
                updated++;
              } else {
                map.set(key, {
                  code,
                  name,
                  description: item.description ? item.description.toString().trim() : '',
                });
                added++;
              }
            }
          });

          return Array.from(map.values());
        });

        setActiveToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Import Excel Berhasil',
          message: `${added} GL Account baru ditambahkan, ${updated} diperbarui.`,
        });

        return { success: true, added, updated };
      }
    },
    []
  );

  // Storage Location & Rak Management
  const addStorageLocation = useCallback(
    (loc: Omit<StorageLocation, 'id'>) => {
      const code = loc.code.trim();
      const name = loc.name.trim();
      if (!code) return { success: false, error: 'Kode / Nomor Rak wajib diisi.' };
      if (!name) return { success: false, error: 'Nama Lokasi / Rak wajib diisi.' };
      if (storageLocations.some((s) => s.code.toLowerCase() === code.toLowerCase())) {
        return { success: false, error: `Lokasi dengan kode "${code}" sudah terdaftar.` };
      }
      const newLoc: StorageLocation = {
        id: `loc_${Date.now()}`,
        code,
        name,
        zone: loc.zone?.trim() || 'Zona Umum',
        description: loc.description?.trim() || '',
      };
      setStorageLocations((prev) => [...prev, newLoc]);
      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Lokasi Rak Ditambahkan',
        message: `Lokasi "${newLoc.code} - ${newLoc.name}" berhasil didaftarkan.`,
      });
      return { success: true, location: newLoc };
    },
    [storageLocations]
  );

  const updateStorageLocation = useCallback(
    (id: string, updates: Partial<StorageLocation>) => {
      const target = storageLocations.find((s) => s.id === id);
      if (!target) return { success: false, error: 'Lokasi tidak ditemukan.' };
      if (updates.code) {
        const codeTrimmed = updates.code.trim().toLowerCase();
        if (storageLocations.some((s) => s.id !== id && s.code.toLowerCase() === codeTrimmed)) {
          return { success: false, error: `Kode lokasi "${updates.code}" sudah digunakan.` };
        }
      }
      setStorageLocations((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      return { success: true };
    },
    [storageLocations]
  );

  const deleteStorageLocation = useCallback(
    (id: string) => {
      const target = storageLocations.find((s) => s.id === id);
      if (!target) return { success: false, error: 'Lokasi tidak ditemukan.' };
      const itemsInLocation = stockItems.filter(
        (i) => i.location.toLowerCase() === target.code.toLowerCase() || i.location.toLowerCase() === target.name.toLowerCase()
      );
      if (itemsInLocation.length > 0) {
        return {
          success: false,
          error: `Tidak dapat menghapus "${target.code}" karena masih digunakan oleh ${itemsInLocation.length} barang di katalog stok.`,
        };
      }
      setStorageLocations((prev) => prev.filter((s) => s.id !== id));
      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Lokasi Dihapus',
        message: `Rak / Lokasi "${target.code}" telah dihapus.`,
      });
      return { success: true };
    },
    [storageLocations, stockItems]
  );

  // Bulk Import Stock Items via Excel
  const importStockItemsBulk = useCallback(
    (
      newItemsList: Array<{
        sku: string;
        name: string;
        category: string;
        unit: string;
        currentStock: number;
        minStock: number;
        location: string;
        description?: string;
      }>,
      mode: 'upsert' | 'add_only' = 'upsert'
    ) => {
      if (!newItemsList || newItemsList.length === 0) {
        return { success: false, added: 0, updated: 0, error: 'Tidak ada data barang yang valid untuk diimpor.' };
      }

      let added = 0;
      let updated = 0;
      const nowStr = new Date().toISOString();

      setStockItems((prev) => {
        const itemMap = new Map<string, StockItem>();
        prev.forEach((i) => itemMap.set(i.sku.toUpperCase(), i));

        newItemsList.forEach((raw) => {
          const sku = (raw.sku || '').toString().trim().toUpperCase();
          const name = (raw.name || '').toString().trim();
          if (sku && name) {
            if (itemMap.has(sku)) {
              if (mode === 'upsert') {
                const existing = itemMap.get(sku)!;
                const updatedItem: StockItem = {
                  ...existing,
                  name,
                  category: raw.category ? raw.category.trim() : existing.category,
                  unit: raw.unit ? raw.unit.trim() : existing.unit,
                  currentStock: Number(raw.currentStock) >= 0 ? Number(raw.currentStock) : existing.currentStock,
                  minStock: Number(raw.minStock) >= 0 ? Number(raw.minStock) : existing.minStock,
                  location: raw.location ? raw.location.trim() : existing.location,
                  description: raw.description ? raw.description.trim() : existing.description,
                  updatedAt: nowStr,
                };
                itemMap.set(sku, updatedItem);
                updated++;
              }
            } else {
              const newItem: StockItem = {
                id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                sku,
                name,
                category: raw.category ? raw.category.trim() : 'Sparepart Mesin',
                unit: raw.unit ? raw.unit.trim() : 'Pcs',
                currentStock: Number(raw.currentStock) >= 0 ? Number(raw.currentStock) : 0,
                allocatedStock: 0,
                minStock: Number(raw.minStock) >= 0 ? Number(raw.minStock) : 10,
                location: raw.location ? raw.location.trim() : 'Rak A-01',
                description: raw.description ? raw.description.trim() : '',
                updatedAt: nowStr,
              };
              itemMap.set(sku, newItem);
              added++;
            }
          }
        });

        return Array.from(itemMap.values());
      });

      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Impor Barang Berhasil',
        message: `${added} barang baru berhasil ditambahkan, ${updated} barang diperbarui dari Excel.`,
      });

      return { success: true, added, updated };
    },
    []
  );

  // Company Profile & Branding Management
  const updateCompanyProfile = useCallback((updates: Partial<CompanyProfile>) => {
    setCompanyProfile((prev) => ({ ...prev, ...updates }));
    setActiveToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Profil Perusahaan Diperbarui',
      message: 'Perubahan logo, nama aplikasi & identitas perusahaan telah disimpan dan berlaku di seluruh sistem.',
    });
  }, []);

  const resetCompanyProfile = useCallback(() => {
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.COMPANY_PROFILE);
    setActiveToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Profil Dikembalikan ke Default',
      message: 'Data nama dan logo perusahaan telah direset ke setelan awal.',
    });
  }, []);

  // 1. Create LPB (Penambahan Stok dari SJ Supplier)
  const createLPB = useCallback(
    (data: {
      sjNumber: string;
      sjDate: string;
      supplierName: string;
      receivedDate: string;
      poNumber?: string;
      driverName?: string;
      vehiclePlate?: string;
      usagePurpose?: string;
      storageLocation?: string;
      notes?: string;
      items: Omit<LPBItem, 'sku' | 'itemName' | 'unit'>[];
    }): LPBDocument => {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const count = lpbDocuments.length + 1;
      const lpbNumber = `LPB-${yearMonth}-${String(count).padStart(4, '0')}`;

      // Map item full details
      const resolvedItems: LPBItem[] = data.items.map((entry) => {
        const stockItem = stockItems.find((s) => s.id === entry.itemId);
        return {
          itemId: entry.itemId,
          sku: stockItem ? stockItem.sku : 'SKU-UNKNOWN',
          itemName: stockItem ? stockItem.name : 'Unknown Item',
          unit: stockItem ? stockItem.unit : 'Pcs',
          quantity: Number(entry.quantity),
          batchNo: entry.batchNo || '-',
          condition: entry.condition,
          notes: entry.notes || '',
          storageLocation: entry.storageLocation || (stockItem ? stockItem.location : 'Rak A-01'),
        };
      });

      const newLPB: LPBDocument = {
        id: `lpb_${Date.now()}`,
        lpbNumber,
        sjNumber: data.sjNumber,
        sjDate: data.sjDate,
        supplierName: data.supplierName,
        receivedDate: data.receivedDate,
        poNumber: data.poNumber || '-',
        driverName: data.driverName || '-',
        vehiclePlate: data.vehiclePlate || '-',
        usagePurpose: data.usagePurpose || 'Pemenuhan Stok Logistik Gudang',
        storageLocation: data.storageLocation || (resolvedItems[0]?.storageLocation || 'Rak A-01'),
        notes: data.notes || '',
        receivedByAdmin: currentUser ? currentUser.name : 'Admin Gudang',
        verifiedBy: 'Suryadi (Kepala Gudang)',
        items: resolvedItems,
        createdAt: now.toISOString(),
      };

      // Increase currentStock for each received item & generate ledger movement
      const newMovements: StockMovement[] = [];
      const updatedStockItems = stockItems.map((item) => {
        const incoming = resolvedItems.find((ri) => ri.itemId === item.id);
        if (incoming && incoming.quantity > 0) {
          const balanceBefore = item.currentStock;
          const balanceAfter = balanceBefore + incoming.quantity;

          newMovements.push({
            id: `mov_${Date.now()}_${item.id}`,
            itemId: item.id,
            sku: item.sku,
            itemName: item.name,
            type: 'IN',
            source: 'LPB_SUPPLIER',
            referenceNumber: lpbNumber,
            secondaryRef: `SJ: ${data.sjNumber} (${data.supplierName})`,
            quantity: incoming.quantity,
            balanceBefore,
            balanceAfter,
            date: now.toISOString(),
            actor: currentUser ? currentUser.name : 'Admin Gudang',
            notes: incoming.notes || `Penerimaan SJ Supplier ${data.supplierName}`,
          });

          return {
            ...item,
            currentStock: balanceAfter,
            location: incoming.storageLocation || item.location,
            updatedAt: now.toISOString(),
          };
        }
        return item;
      });

      // Update notifications
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        targetRole: 'all',
        type: 'lpb_created',
        title: 'Barang Masuk Diterima (LPB)',
        message: `LPB #${lpbNumber} diterbitkan untuk SJ: ${data.sjNumber} dari ${data.supplierName}. Total ${resolvedItems.reduce((acc, i) => acc + i.quantity, 0)} unit ditambahkan ke stok fisik.`,
        lpbId: newLPB.id,
        read: false,
        timestamp: now.toISOString(),
      };

      setStockItems(updatedStockItems);
      setLpbDocuments((prev) => [newLPB, ...prev]);
      setStockMovements((prev) => [...newMovements, ...prev]);
      setNotifications((prev) => [newNotif, ...prev]);

      // Broadcast
      realtimeService.notifyStockReceived(newLPB);

      setActiveToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'LPB Berhasil Diterbitkan',
        message: `Laporan Penerimaan Barang #${lpbNumber} berhasil disimpan dan stok fisik bertambah.`,
      });

      return newLPB;
    },
    [currentUser, lpbDocuments.length, stockItems]
  );

  // 2. Create Issue Voucher / Nota Pengambilan Barang (By User)
  // Stock does NOT leave warehouse yet! It is marked as allocated/pending.
  const createIssueVoucher = useCallback(
    (data: {
      purpose: string;
      notes?: string;
      department?: string;
      items: { itemId: string; requestedQty: number; costCenter?: string; glAcc?: string }[];
    }) => {
      // Validate items & stock availability
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Pilih minimal satu item barang untuk diambil.' };
      }

      for (const reqItem of data.items) {
        const item = stockItems.find((s) => s.id === reqItem.itemId);
        if (!item) {
          return { success: false, error: 'Barang yang dipilih tidak ditemukan di sistem.' };
        }
        const available = item.currentStock - item.allocatedStock;
        if (reqItem.requestedQty <= 0) {
          return { success: false, error: `Jumlah permintaan untuk ${item.name} harus lebih dari 0.` };
        }
        if (reqItem.requestedQty > available) {
          return {
            success: false,
            error: `Stok tersedia tidak mencukupi untuk ${item.name}. Tersedia: ${available} ${item.unit}, diminta: ${reqItem.requestedQty} ${item.unit}.`,
          };
        }
      }

      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const count = issueVouchers.length + 1;
      const voucherNumber = `NPB-${yearMonth}-${String(count).padStart(4, '0')}`;

      const voucherItems: IssueVoucherItem[] = data.items.map((i) => {
        const s = stockItems.find((item) => item.id === i.itemId)!;
        return {
          itemId: s.id,
          sku: s.sku,
          itemName: s.name,
          unit: s.unit,
          requestedQty: Number(i.requestedQty),
          availableStockSnapshot: s.currentStock,
          costCenter: i.costCenter || '60',
          glAcc: i.glAcc || '51010',
        };
      });

      const newVoucher: IssueVoucherDocument = {
        id: `voucher_${Date.now()}`,
        voucherNumber,
        requestedBy: currentUser ? currentUser.name : 'User',
        userId: currentUser ? currentUser.id : 'unknown',
        department: data.department || (currentUser ? currentUser.department : 'General'),
        requestDate: now.toISOString().split('T')[0],
        purpose: data.purpose,
        notes: data.notes || '',
        status: 'PENDING', // Menunggu ACC Admin
        items: voucherItems,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Reserve / allocate stock (stok fisik TETAP, tapi dialokasikan agar tidak diambil rangkap)
      const updatedStockItems = stockItems.map((item) => {
        const requested = voucherItems.find((vi) => vi.itemId === item.id);
        if (requested) {
          return {
            ...item,
            allocatedStock: item.allocatedStock + requested.requestedQty,
          };
        }
        return item;
      });

      // Notification to Admin
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        targetRole: 'admin',
        type: 'voucher_created',
        title: 'Nota Pengambilan Baru Menunggu ACC',
        message: `${currentUser ? currentUser.name : 'User'} (${newVoucher.department}) membuat nota #${voucherNumber} untuk keperluan: ${data.purpose}.`,
        voucherId: newVoucher.id,
        read: false,
        timestamp: now.toISOString(),
      };

      setStockItems(updatedStockItems);
      setIssueVouchers((prev) => [newVoucher, ...prev]);
      setNotifications((prev) => [newNotif, ...prev]);

      // Broadcast event
      realtimeService.notifyVoucherCreated(newVoucher);

      return { success: true, voucher: newVoucher };
    },
    [currentUser, issueVouchers.length, stockItems]
  );

  // 3. Approve Issue Voucher (Only Admin can do this)
  // Once approved:
  // - Physical stock is officially deducted (OUT)
  // - Allocated stock is freed
  // - Status = APPROVED
  // - User can no longer edit or delete this voucher!
  // - Real-time notification dispatched to user!
  const approveIssueVoucher = useCallback(
    (
      voucherId: string,
      handover: { handoverOfficer: string; recipientName: string; notes?: string }
    ) => {
      const voucher = issueVouchers.find((v) => v.id === voucherId);
      if (!voucher) {
        return { success: false, error: 'Nota pengambilan barang tidak ditemukan.' };
      }

      if (voucher.status === 'APPROVED') {
        return { success: false, error: 'Nota ini sudah disetujui sebelumnya!' };
      }

      const now = new Date();
      const adminName = currentUser ? currentUser.name : 'Admin Gudang';
      const updatedVoucher: IssueVoucherDocument = {
        ...voucher,
        status: 'APPROVED',
        approvedByAdmin: adminName,
        approvedAt: now.toISOString(),
        handoverOfficer: handover.handoverOfficer || adminName,
        recipientName: handover.recipientName || voucher.requestedBy,
        notes: handover.notes ? `${voucher.notes ? voucher.notes + ' | ' : ''}Catatan Admin: ${handover.notes}` : voucher.notes,
        updatedAt: now.toISOString(),
      };

      // Deduct physical stock & release allocation
      const newMovements: StockMovement[] = [];
      const updatedStockItems = stockItems.map((item) => {
        const vItem = voucher.items.find((vi) => vi.itemId === item.id);
        if (vItem) {
          const balanceBefore = item.currentStock;
          const balanceAfter = Math.max(0, balanceBefore - vItem.requestedQty);

          newMovements.push({
            id: `mov_${Date.now()}_${item.id}`,
            itemId: item.id,
            sku: item.sku,
            itemName: item.name,
            type: 'OUT',
            source: 'NOTA_PENGAMBILAN',
            referenceNumber: voucher.voucherNumber,
            secondaryRef: `${voucher.department} (${voucher.requestedBy})`,
            quantity: vItem.requestedQty,
            balanceBefore,
            balanceAfter,
            date: now.toISOString(),
            actor: adminName,
            notes: `Diserahkan kepada ${handover.recipientName || voucher.requestedBy} untuk: ${voucher.purpose}`,
          });

          return {
            ...item,
            currentStock: balanceAfter,
            allocatedStock: Math.max(0, item.allocatedStock - vItem.requestedQty),
            updatedAt: now.toISOString(),
          };
        }
        return item;
      });

      // Notification to the requester
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        targetUserId: voucher.userId,
        type: 'voucher_approved',
        title: 'Nota Pengambilan Disetujui & Barang Diserahkan',
        message: `Nota #${voucher.voucherNumber} telah disetujui oleh ${adminName}. Barang telah resmi diserahkan kepada ${handover.recipientName || voucher.requestedBy}.`,
        voucherId: voucher.id,
        read: false,
        timestamp: now.toISOString(),
      };

      setStockItems(updatedStockItems);
      setIssueVouchers((prev) =>
        prev.map((v) => (v.id === voucherId ? updatedVoucher : v))
      );
      setStockMovements((prev) => [...newMovements, ...prev]);
      setNotifications((prev) => [newNotif, ...prev]);

      // TRIGGER REAL-TIME EVENT
      realtimeService.notifyVoucherApproved(updatedVoucher);

      return { success: true };
    },
    [currentUser, issueVouchers, stockItems]
  );

  // 4. Reject Issue Voucher
  const rejectIssueVoucher = useCallback(
    (voucherId: string, reason: string) => {
      const voucher = issueVouchers.find((v) => v.id === voucherId);
      if (!voucher) return { success: false, error: 'Nota tidak ditemukan.' };
      if (voucher.status === 'APPROVED') {
        return { success: false, error: 'Nota yang sudah di-approve tidak dapat ditolak!' };
      }

      const now = new Date();
      const updatedVoucher: IssueVoucherDocument = {
        ...voucher,
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: now.toISOString(),
      };

      // Release allocated stock
      const updatedStockItems = stockItems.map((item) => {
        const vItem = voucher.items.find((vi) => vi.itemId === item.id);
        if (vItem) {
          return {
            ...item,
            allocatedStock: Math.max(0, item.allocatedStock - vItem.requestedQty),
          };
        }
        return item;
      });

      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        targetUserId: voucher.userId,
        type: 'voucher_rejected',
        title: 'Nota Pengambilan Ditolak',
        message: `Nota #${voucher.voucherNumber} ditolak oleh Admin. Alasan: ${reason}`,
        voucherId: voucher.id,
        read: false,
        timestamp: now.toISOString(),
      };

      setStockItems(updatedStockItems);
      setIssueVouchers((prev) =>
        prev.map((v) => (v.id === voucherId ? updatedVoucher : v))
      );
      setNotifications((prev) => [newNotif, ...prev]);

      realtimeService.notifyVoucherRejected(updatedVoucher);

      return { success: true };
    },
    [issueVouchers, stockItems]
  );

  // 5. Update Issue Voucher (Strictly locked if APPROVED!)
  const updateIssueVoucher = useCallback(
    (
      voucherId: string,
      data: {
        purpose: string;
        notes?: string;
        items: { itemId: string; requestedQty: number; costCenter?: string; glAcc?: string }[];
      }
    ) => {
      const voucher = issueVouchers.find((v) => v.id === voucherId);
      if (!voucher) return { success: false, error: 'Nota tidak ditemukan.' };

      // REQUIREMENT CHECK: Setelah status nota approved, user tidak bisa edit nota!
      if (voucher.status === 'APPROVED') {
        return {
          success: false,
          error: 'Nota sudah di-approve dan diserahkan! Dokumen telah terkunci secara permanen dan tidak dapat diubah.',
        };
      }

      // First, restore old allocated stock
      let tempStock = stockItems.map((item) => {
        const oldItem = voucher.items.find((vi) => vi.itemId === item.id);
        if (oldItem) {
          return {
            ...item,
            allocatedStock: Math.max(0, item.allocatedStock - oldItem.requestedQty),
          };
        }
        return item;
      });

      // Verify new requested items
      for (const reqItem of data.items) {
        const item = tempStock.find((s) => s.id === reqItem.itemId);
        if (!item) return { success: false, error: 'Barang tidak ditemukan.' };
        const available = item.currentStock - item.allocatedStock;
        if (reqItem.requestedQty > available) {
          return {
            success: false,
            error: `Stok tersedia tidak mencukupi untuk ${item.name} (${available} ${item.unit} tersedia).`,
          };
        }
      }

      // Re-allocate
      const newVoucherItems: IssueVoucherItem[] = data.items.map((i) => {
        const s = tempStock.find((item) => item.id === i.itemId)!;
        return {
          itemId: s.id,
          sku: s.sku,
          itemName: s.name,
          unit: s.unit,
          requestedQty: Number(i.requestedQty),
          availableStockSnapshot: s.currentStock,
          costCenter: i.costCenter || '60',
          glAcc: i.glAcc || '51010',
        };
      });

      tempStock = tempStock.map((item) => {
        const req = newVoucherItems.find((vi) => vi.itemId === item.id);
        if (req) {
          return {
            ...item,
            allocatedStock: item.allocatedStock + req.requestedQty,
          };
        }
        return item;
      });

      const updatedVoucher: IssueVoucherDocument = {
        ...voucher,
        purpose: data.purpose,
        notes: data.notes || '',
        items: newVoucherItems,
        updatedAt: new Date().toISOString(),
      };

      setStockItems(tempStock);
      setIssueVouchers((prev) =>
        prev.map((v) => (v.id === voucherId ? updatedVoucher : v))
      );

      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Nota Berhasil Diperbarui',
        message: `Nota #${voucher.voucherNumber} berhasil diperbarui.`,
      });

      return { success: true };
    },
    [issueVouchers, stockItems]
  );

  // 6. Delete Issue Voucher (Strictly locked if APPROVED!)
  const deleteIssueVoucher = useCallback(
    (voucherId: string) => {
      const voucher = issueVouchers.find((v) => v.id === voucherId);
      if (!voucher) return { success: false, error: 'Nota tidak ditemukan.' };

      // REQUIREMENT CHECK: Setelah status nota approved, user tidak bisa hapus nota!
      if (voucher.status === 'APPROVED') {
        return {
          success: false,
          error: 'Nota sudah di-approve dan diserahkan! Dokumen resmi tidak dapat dihapus.',
        };
      }

      // If pending, release allocated stock
      if (voucher.status === 'PENDING') {
        const updatedStockItems = stockItems.map((item) => {
          const vItem = voucher.items.find((vi) => vi.itemId === item.id);
          if (vItem) {
            return {
              ...item,
              allocatedStock: Math.max(0, item.allocatedStock - vItem.requestedQty),
            };
          }
          return item;
        });
        setStockItems(updatedStockItems);
      }

      setIssueVouchers((prev) => prev.filter((v) => v.id !== voucherId));

      setActiveToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Nota Dihapus',
        message: `Nota #${voucher.voucherNumber} berhasil dihapus/dibatalkan.`,
      });

      return { success: true };
    },
    [issueVouchers, stockItems]
  );

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNewStockItem = (itemData: Omit<StockItem, 'id' | 'allocatedStock' | 'updatedAt'>) => {
    const newItem: StockItem = {
      ...itemData,
      id: `item_${Date.now()}`,
      allocatedStock: 0,
      updatedAt: new Date().toISOString(),
    };
    setStockItems((prev) => [newItem, ...prev]);

    // Initial movement
    if (newItem.currentStock > 0) {
      const newMovement: StockMovement = {
        id: `mov_${Date.now()}_init`,
        itemId: newItem.id,
        sku: newItem.sku,
        itemName: newItem.name,
        type: 'IN',
        source: 'PENYESUAIAN_AWAL',
        referenceNumber: 'SALDO-AWAL',
        secondaryRef: 'Setup Barang Baru',
        quantity: newItem.currentStock,
        balanceBefore: 0,
        balanceAfter: newItem.currentStock,
        date: new Date().toISOString(),
        actor: currentUser ? currentUser.name : 'Admin Gudang',
        notes: 'Pencatatan saldo awal barang master baru',
      };
      setStockMovements((prev) => [newMovement, ...prev]);
    }

    return newItem;
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const deleteStockItem = (id: string): { success: boolean; error?: string } => {
    const item = stockItems.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: 'Barang tidak ditemukan.' };
    }
    if (item.allocatedStock > 0) {
      return {
        success: false,
        error: `Barang "${item.name}" tidak dapat dihapus karena sedang dialokasikan (${item.allocatedStock} ${item.unit}) dalam nota pengambilan pending!`,
      };
    }
    setStockItems((prev) => prev.filter((i) => i.id !== id));
    setActiveToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Barang Dihapus',
      message: `Master barang ${item.sku} - ${item.name} berhasil dihapus dari sistem.`,
    });
    return { success: true };
  };

  // Batas Stok Minimal Proposals & Actions
  const createMinStockProposal = (data: {
    itemId: string;
    proposedMinStock: number;
    reason: string;
  }) => {
    if (!currentUser) return { success: false, error: 'Silakan login terlebih dahulu' };
    const targetItem = stockItems.find((i) => i.id === data.itemId);
    if (!targetItem) return { success: false, error: 'Item barang tidak ditemukan' };
    if (data.proposedMinStock <= 0) return { success: false, error: 'Usulan batas stok minimal harus lebih dari 0' };
    if (!data.reason.trim()) return { success: false, error: 'Alasan/justifikasi pengajuan wajib diisi' };

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = minStockProposals.length + 1;
    const proposalNumber = `PROP-MIN-${yearMonth}-${String(count).padStart(4, '0')}`;

    const newProposal: MinStockProposal = {
      id: `prop_min_${Date.now()}`,
      proposalNumber,
      itemId: targetItem.id,
      sku: targetItem.sku,
      itemName: targetItem.name,
      unit: targetItem.unit,
      currentMinStock: targetItem.minStock,
      proposedMinStock: Number(data.proposedMinStock),
      reason: data.reason.trim(),
      requestedBy: currentUser.name,
      requestedByUserId: currentUser.id,
      requestedByRole: currentUser.role,
      requestDate: now.toISOString(),
      status: 'PENDING',
    };

    setMinStockProposals((prev) => [newProposal, ...prev]);

    // Send notification to admin
    const adminNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      targetRole: 'admin',
      type: 'min_stock_proposal',
      title: 'Pengajuan Batas Stok Minimal Baru',
      message: `${currentUser.name} mengajukan perubahan stok minimal untuk ${targetItem.name} (${targetItem.sku}) dari ${targetItem.minStock} menjadi ${data.proposedMinStock} ${targetItem.unit}.`,
      proposalId: newProposal.id,
      read: false,
      timestamp: now.toISOString(),
    };
    setNotifications((prev) => [adminNotif, ...prev]);

    setActiveToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Pengajuan Stok Minimal Terkirim',
      message: `Usulan stok minimal #${proposalNumber} berhasil diajukan dan menunggu persetujuan Admin.`,
    });

    return { success: true, proposal: newProposal };
  };

  const approveMinStockProposal = (proposalId: string, adminNotes?: string) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Hanya Admin yang berwenang menyetujui pengajuan stok minimal' };
    }
    const proposal = minStockProposals.find((p) => p.id === proposalId);
    if (!proposal) return { success: false, error: 'Pengajuan tidak ditemukan' };
    if (proposal.status !== 'PENDING') return { success: false, error: 'Pengajuan sudah diproses sebelumnya' };

    const now = new Date().toISOString();
    const newMinStock = proposal.proposedMinStock;

    // 1. Update proposal status
    setMinStockProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'APPROVED',
              reviewedByAdmin: currentUser.name,
              reviewedAt: now,
              adminNotes: adminNotes || 'Disetujui oleh Administrator Gudang',
            }
          : p
      )
    );

    // 2. IMMEDIATELY APPLY TO SYSTEM (update target item's minStock!)
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === proposal.itemId || item.sku === proposal.sku
          ? { ...item, minStock: newMinStock, updatedAt: now }
          : item
      )
    );

    // 3. Notification for requester
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      targetUserId: proposal.requestedByUserId,
      type: 'min_stock_approved',
      title: 'Pengajuan Stok Minimal Disetujui',
      message: `Pengajuan batas stok minimal untuk ${proposal.itemName} (${proposal.sku}) sebesar ${newMinStock} ${proposal.unit} telah di-ACC oleh Admin dan berlaku di sistem.`,
      proposalId: proposal.id,
      read: false,
      timestamp: now,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // 4. Toast
    setActiveToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Batas Stok Minimal Berhasil Di-ACC',
      message: `Batas stok ${proposal.itemName} resmi diubah menjadi ${newMinStock} ${proposal.unit} dan berlaku di sistem.`,
    });

    return { success: true };
  };

  const rejectMinStockProposal = (proposalId: string, adminNotes: string) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Hanya Admin yang berwenang menolak pengajuan stok minimal' };
    }
    const proposal = minStockProposals.find((p) => p.id === proposalId);
    if (!proposal) return { success: false, error: 'Pengajuan tidak ditemukan' };
    if (proposal.status !== 'PENDING') return { success: false, error: 'Pengajuan sudah diproses' };

    const now = new Date().toISOString();
    setMinStockProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: 'REJECTED',
              reviewedByAdmin: currentUser.name,
              reviewedAt: now,
              adminNotes: adminNotes || 'Ditolak oleh Administrator Gudang',
            }
          : p
      )
    );

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      targetUserId: proposal.requestedByUserId,
      type: 'min_stock_rejected',
      title: 'Pengajuan Stok Minimal Ditolak',
      message: `Pengajuan batas stok minimal untuk ${proposal.itemName} (${proposal.sku}) ditolak. Alasan: ${adminNotes}`,
      proposalId: proposal.id,
      read: false,
      timestamp: now,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    setActiveToast({
      id: Math.random().toString(),
      type: 'warning',
      title: 'Pengajuan Stok Minimal Ditolak',
      message: `Pengajuan untuk ${proposal.itemName} telah ditolak.`,
    });

    return { success: true };
  };

  // Stock alert item arrays
  const lowStockItems = stockItems.filter((i) => i.currentStock <= i.minStock);
  const nearMinStockItems = stockItems.filter(
    (i) => i.currentStock > i.minStock && i.currentStock <= i.minStock + Math.max(3, Math.round(i.minStock * 0.35))
  );

  const openPrintPreview = (type: 'LPB' | 'NPB', doc: LPBDocument | IssueVoucherDocument) => {
    setSelectedDocumentForPrint({ type, doc });
  };

  const closePrintPreview = () => {
    setSelectedDocumentForPrint(null);
  };

  const resetToDefaultData = () => {
    setStockItems(INITIAL_STOCK_ITEMS);
    setLpbDocuments(INITIAL_LPB_DOCUMENTS);
    setIssueVouchers(INITIAL_ISSUE_VOUCHERS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCostCenters(INITIAL_COST_CENTERS);
    setGlAccounts(INITIAL_GL_ACCOUNTS);
    setMinStockProposals(INITIAL_MIN_STOCK_PROPOSALS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.LPB_DOCS);
    localStorage.removeItem(STORAGE_KEYS.ISSUE_VOUCHERS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.COST_CENTERS);
    localStorage.removeItem(STORAGE_KEYS.GL_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.STORAGE_LOCATIONS);
    localStorage.removeItem(STORAGE_KEYS.COMPANY_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.MIN_STOCK_PROPOSALS);
    setStorageLocations(INITIAL_STORAGE_LOCATIONS);
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    setActiveToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Data Demo Direset',
      message: 'Seluruh data master stok, akun login, Cost Center, GL Account, lokasi rak, profil perusahaan, pengajuan stok minimal, LPB, dan nota dikembalikan ke kondisi awal.',
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        createUser,
        updateUser,
        resetUserPassword,
        deleteUser,
        toggleUserStatus,
        stockItems,
        lpbDocuments,
        issueVouchers,
        stockMovements,
        notifications,
        costCenters,
        glAccounts,
        addCostCenter,
        updateCostCenter,
        deleteCostCenter,
        importCostCentersBulk,
        addGLAccount,
        updateGLAccount,
        deleteGLAccount,
        importGLAccountsBulk,
        storageLocations,
        addStorageLocation,
        updateStorageLocation,
        deleteStorageLocation,
        importStockItemsBulk,
        companyProfile,
        updateCompanyProfile,
        resetCompanyProfile,
        minStockProposals,
        createMinStockProposal,
        approveMinStockProposal,
        rejectMinStockProposal,
        lowStockItems,
        nearMinStockItems,
        activeToast,
        dismissToast,
        createLPB,
        createIssueVoucher,
        approveIssueVoucher,
        rejectIssueVoucher,
        updateIssueVoucher,
        deleteIssueVoucher,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNewStockItem,
        updateStockItem,
        deleteStockItem,
        selectedDocumentForPrint,
        openPrintPreview,
        closePrintPreview,
        resetToDefaultData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
