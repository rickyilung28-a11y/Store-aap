/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { ToastNotification } from './components/ToastNotification';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { ApprovalModal } from './components/ApprovalModal';
import { CreateLPBModal } from './components/CreateLPBModal';
import { CreateIssueVoucherModal } from './components/CreateIssueVoucherModal';
import { EditIssueVoucherModal } from './components/EditIssueVoucherModal';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { LPBView } from './views/LPBView';
import { IssueVoucherListView } from './views/IssueVoucherListView';
import { StockMasterView } from './views/StockMasterView';
import { StockMovementView } from './views/StockMovementView';
import { UserManagementView } from './views/UserManagementView';
import { CostCenterGLView } from './views/CostCenterGLView';
import { StorageLocationsView } from './views/StorageLocationsView';
import { CompanySettingsView } from './views/CompanySettingsView';
import { MinStockManagementView } from './views/MinStockManagementView';
import { IssueVoucherDocument, LPBDocument } from './types/inventory';
import { BellRing, Shield, Users } from 'lucide-react';

function InventoryAppContent() {
  const {
    currentUser,
    users,
    login,
    logout,
    stockItems,
    lpbDocuments,
    issueVouchers,
    stockMovements,
    notifications,
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
  } = useInventory();

  // If user is not logged in, show clean Login View
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastNotification
          toast={activeToast}
          onDismiss={dismissToast}
        />
      </>
    );
  }

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [ledgerSkuFilter, setLedgerSkuFilter] = useState<string>('');

  // Modals state
  const [isCreateLPBOpen, setIsCreateLPBOpen] = useState(false);
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<IssueVoucherDocument | null>(null);
  const [voucherToApprove, setVoucherToApprove] = useState<IssueVoucherDocument | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const pendingApprovalsCount = issueVouchers.filter((v) => v.status === 'PENDING').length;

  const handleNavigateToLedgerItem = (sku: string) => {
    setLedgerSkuFilter(sku);
    setCurrentTab('ledger');
  };

  const handleViewVoucherFromToast = (voucherNumber: string) => {
    const voucher = issueVouchers.find((v) => v.voucherNumber === voucherNumber);
    if (voucher) {
      openPrintPreview('NPB', voucher);
    } else {
      setCurrentTab('vouchers');
    }
  };

  const handleSelectVoucherFromNotif = (voucherId: string) => {
    const v = issueVouchers.find((item) => item.id === voucherId);
    if (v) {
      openPrintPreview('NPB', v);
    }
  };

  const handleSelectLPBFromNotif = (lpbId: string) => {
    const l = lpbDocuments.find((item) => item.id === lpbId);
    if (l) {
      openPrintPreview('LPB', l);
    }
  };

  const handleSwitchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      login(target.username, target.password);
    }
  };

  // Quick Simulation Helper for Real-Time Approval
  const handleQuickSimulateApproval = () => {
    const firstPending = issueVouchers.find((v) => v.status === 'PENDING');
    if (firstPending) {
      // Ensure admin executes the approval
      approveIssueVoucher(firstPending.id, {
        handoverOfficer: 'Hendra Gunawan (Gudang)',
        recipientName: firstPending.requestedBy,
        notes: 'Simulasi Approval Cepat: Disetujui & diserahkan fisik.',
      });
    } else {
      // Create a quick voucher first, then approve it
      const res = createIssueVoucher({
        purpose: 'Simulasi Kebutuhan Mendesak Sparepart Maintenance',
        department: 'Dept. Pemeliharaan & Workshop',
        notes: 'Dibuat untuk demonstrasi notifikasi real-time.',
        items: [{ itemId: stockItems[0].id, requestedQty: 1 }],
      });
      if (res.success && res.voucher) {
        setTimeout(() => {
          approveIssueVoucher(res.voucher!.id, {
            handoverOfficer: 'Hendra Gunawan (Gudang)',
            recipientName: res.voucher!.requestedBy,
            notes: 'Barang telah diserahkan di loket gudang.',
          });
        }, 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setLedgerSkuFilter('');
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onLogout={logout}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onResetData={resetToDefaultData}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Real-time interactive simulation guidance bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs py-2 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">
              Pengguna Aktif: <strong className="text-white">{currentUser.name}</strong> (@{currentUser.username}) &middot;{' '}
              <span className={currentUser.role === 'admin' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {currentUser.role === 'admin' ? 'Administrator Gudang' : currentUser.department}
              </span>
            </span>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('users')}
                className="hidden lg:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] transition-colors"
              >
                <Users className="w-3 h-3" />
                <span>Atur User & Password</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleQuickSimulateApproval}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-colors shadow-2xs"
              title="Memicu ACC nota langsung untuk mendemokan notifikasi real-time & pemotongan stok"
            >
              <BellRing className="w-3.5 h-3.5 text-white" />
              <span>Simulasi Cepat ACC & Real-Time Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            stockItems={stockItems}
            lpbDocuments={lpbDocuments}
            issueVouchers={issueVouchers}
            stockMovements={stockMovements}
            onOpenCreateLPB={() => setIsCreateLPBOpen(true)}
            onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
            onOpenApproval={(v) => setVoucherToApprove(v)}
            onPrintDocument={(type, doc) => openPrintPreview(type, doc)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'lpb' && (
          <LPBView
            currentUser={currentUser}
            lpbDocuments={lpbDocuments}
            onOpenCreateLPB={() => setIsCreateLPBOpen(true)}
            onPrintLPB={(doc) => openPrintPreview('LPB', doc)}
          />
        )}

        {currentTab === 'vouchers' && (
          <IssueVoucherListView
            currentUser={currentUser}
            issueVouchers={issueVouchers}
            onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
            onOpenEditVoucher={(v) => setVoucherToEdit(v)}
            onOpenApproval={(v) => setVoucherToApprove(v)}
            onDeleteVoucher={(id) => deleteIssueVoucher(id)}
            onPrintVoucher={(doc) => openPrintPreview('NPB', doc)}
          />
        )}

        {currentTab === 'items' && (
          <StockMasterView
            currentUser={currentUser}
            stockItems={stockItems}
            onAddNewItem={addNewStockItem}
            onUpdateItem={updateStockItem}
            onDeleteItem={deleteStockItem}
            onViewLedgerItem={handleNavigateToLedgerItem}
            onOpenCreateLPB={() => setIsCreateLPBOpen(true)}
            onNavigateToLocations={() => setCurrentTab('locations')}
          />
        )}

        {currentTab === 'min-stock' && (
          <MinStockManagementView
            onNavigateToLPB={() => setIsCreateLPBOpen(true)}
            onNavigateToStockMaster={() => setCurrentTab('items')}
          />
        )}

        {currentTab === 'ledger' && (
          <StockMovementView
            stockMovements={stockMovements}
            stockItems={stockItems}
            preselectedSku={ledgerSkuFilter}
          />
        )}

        {currentTab === 'locations' && (
          <StorageLocationsView
            onSelectRackForFilter={() => {
              setCurrentTab('items');
            }}
          />
        )}

        {currentTab === 'company' && currentUser.role === 'admin' && (
          <CompanySettingsView />
        )}

        {currentTab === 'users' && currentUser.role === 'admin' && (
          <UserManagementView />
        )}

        {currentTab === 'accounting' && currentUser.role === 'admin' && (
          <CostCenterGLView />
        )}
      </main>

      {/* Modals & Drawers */}
      {/* 1. Modal Buat LPB (Penambahan Stok dari SJ Supplier) */}
      {isCreateLPBOpen && (
        <CreateLPBModal
          stockItems={stockItems}
          onClose={() => setIsCreateLPBOpen(false)}
          onSubmit={createLPB}
          onSuccessPrint={(doc) => openPrintPreview('LPB', doc)}
        />
      )}

      {/* 2. Modal Buat Nota Pengambilan Barang (User SIV) */}
      {isCreateVoucherOpen && (
        <CreateIssueVoucherModal
          stockItems={stockItems}
          currentUser={currentUser}
          onClose={() => setIsCreateVoucherOpen(false)}
          onSubmit={createIssueVoucher}
          onSuccessPrint={(doc) => openPrintPreview('NPB', doc)}
        />
      )}

      {/* 3. Modal Edit Nota Pengambilan Barang */}
      {voucherToEdit && (
        <EditIssueVoucherModal
          voucher={voucherToEdit}
          stockItems={stockItems}
          onClose={() => setVoucherToEdit(null)}
          onSubmit={updateIssueVoucher}
        />
      )}

      {/* 4. Modal Approval Admin & Penyerahan Barang */}
      {voucherToApprove && (
        <ApprovalModal
          voucher={voucherToApprove}
          stockItems={stockItems}
          currentAdminName={currentUser.name}
          onClose={() => setVoucherToApprove(null)}
          onApprove={(handover) => {
            approveIssueVoucher(voucherToApprove.id, handover);
            setVoucherToApprove(null);
          }}
          onReject={(reason) => {
            rejectIssueVoucher(voucherToApprove.id, reason);
            setVoucherToApprove(null);
          }}
        />
      )}

      {/* 5. Printable Document Modal (LPB & NPB) */}
      {selectedDocumentForPrint && (
        <PrintDocumentModal
          documentData={selectedDocumentForPrint}
          onClose={closePrintPreview}
        />
      )}

      {/* 6. Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onSelectVoucher={handleSelectVoucherFromNotif}
        onSelectLPB={handleSelectLPBFromNotif}
      />

      {/* 7. Real-Time Toast Alert */}
      <ToastNotification
        toast={activeToast}
        onDismiss={dismissToast}
        onViewVoucher={handleViewVoucherFromToast}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 PT Indo Manufaktur Logistik Utama. Sistem Manajemen Pergudangan & Inventaris.</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Standar ISO 9001:2015</span>
            <span>&middot;</span>
            <span>Autentikasi Terproteksi & RBAC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <InventoryAppContent />
    </InventoryProvider>
  );
}
