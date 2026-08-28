import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { WizardProvider } from './context/WizardContext';
import { useWizard } from './hooks/useWizard';
import { WizardHeader } from './components/WizardHeader';
import { Stepper } from './components/Stepper';
import { DocumentAssignmentTable } from './components/DocumentAssignmentTable';
import { CustomerActionPanel } from './components/CustomerActionPanel';
import { RevisionRemarksBanner } from './components/RevisionRemarksBanner';
import CustomerSelectModal from './components/CustomerSelectModal';
import { BillOfLadingStep } from './components/steps/BillOfLadingStep';
import { CommercialInvoiceStep } from './components/steps/CommercialInvoiceStep';
import { PackingListStep } from './components/steps/PackingListStep';
import { CertificateOfOriginStep } from './components/steps/CertificateOfOriginStep';
import { InsuranceStep } from './components/steps/InsuranceStep';
import { PreviewPibStep } from './components/steps/PreviewPibStep';
import type { Customer, AssignmentSummary } from './types/SubmitBerkas';

interface SubmitBerkasPageProps {
  customers: Customer[];
  assignments: AssignmentSummary[];
}

interface HubContentProps extends SubmitBerkasPageProps {
  isWizardActive: boolean;
  setIsWizardActive: (v: boolean) => void;
}

function SubmitBerkasHubContent({
  customers = [],
  assignments = [],
  isWizardActive,
  setIsWizardActive,
}: HubContentProps) {
  const {
    currentStepIndex,
    wizardData,
    selectedCustomer,
    setSelectedCustomer,
    resetWizard,
    hydrateFromExisting,
  } = useWizard();

  // State daftar customer lokal agar update realtime saat ada customer baru dibuat
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isStartingAssignment, setIsStartingAssignment] = useState(false);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);

  // Flash message dari backend
  const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

  // Mendapatkan remarks aktif untuk step saat ini (jika ada)
  const currentStepKey = ['billOfLading', 'commercialInvoice', 'packingList', 'certificateOfOrigin', 'insurance'][currentStepIndex] as keyof typeof wizardData;
  const currentStepRecord = wizardData[currentStepKey];
  const currentStepRemarks = currentStepRecord?.remarks;

  const handleStartWizard = async () => {
    if (!selectedCustomer) return;
    setIsStartingAssignment(true);
    try {
      await setSelectedCustomer(selectedCustomer);
      setIsWizardActive(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsStartingAssignment(false);
    }
  };

  const handleCancelWizard = () => {
    setIsWizardActive(false);
    resetWizard();
  };

  // Handler saat baris tabel diklik untuk membuka/merevisi dokumen
  const handleOpenAssignment = async (assignment: AssignmentSummary) => {
    setIsLoadingAssignment(true);
    try {
      const response = await axios.get(`/submit-berkas/${assignment.assignment_no_ref}`);
      const docs = response.data;

      const targetCustomer: Customer = {
        id: assignment.customer_id,
        companyName: assignment.customer_name,
        picName: assignment.customer_pic || '',
        address: '',
        phone: '',
        email: '',
      };

      hydrateFromExisting(docs, targetCustomer, assignment.assignment_no_ref);
      setIsWizardActive(true);
    } catch (error) {
      console.error('Gagal memuat dokumen penugasan:', error);
    } finally {
      setIsLoadingAssignment(false);
    }
  };

  // Handler saat customer baru selesai dibuat -> tambahkan ke list, jangan otomatis terpilih
  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomerList((prev) => [newCustomer, ...prev]);
  };

  return (
    <div
      style={{
        padding: 24,
        background: '#F8FAFC',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
      }}
    >
      {/* Alert Flash Success jika baru kembali dari finalisasi */}
      {flash?.success && (
        <div style={{
          padding: '12px 18px',
          background: '#DCFCE7',
          color: '#166534',
          border: '1px solid #BBF7D0',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600
        }}>
          {flash.success}
        </div>
      )}

      {/* ── KONDISI 1: FORM WIZARD (Step 1 s/d 6) ── */}
      {isWizardActive && selectedCustomer ? (
        <>
          <WizardHeader
            customerName={selectedCustomer.companyName}
            onCancelWizard={handleCancelWizard}
          />
          <Stepper />

          {/* Banner Catatan Revisi jika ada */}
          {currentStepRemarks && (
            <RevisionRemarksBanner
              remarks={currentStepRemarks}
              stepName={['Bill of Lading', 'Commercial Invoice', 'Packing List', 'Certificate of Origin (COO)', 'Insurance'][currentStepIndex]}
            />
          )}

          {currentStepIndex === 0 && <BillOfLadingStep />}
          {currentStepIndex === 1 && <CommercialInvoiceStep />}
          {currentStepIndex === 2 && <PackingListStep />}
          {currentStepIndex === 3 && <CertificateOfOriginStep />}
          {currentStepIndex === 4 && <InsuranceStep />}
          {currentStepIndex === 5 && (
            <PreviewPibStep
              onFinished={() => {
                resetWizard();
                setIsWizardActive(false);
              }}
            />
          )}
        </>
      ) : (
        /* ── KONDISI 2: HUB UTAMA DASHBOARD (LAYOUT 70 - 30) ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 24,
          alignItems: 'start'
        }}>
          {/* Sisi Kiri (70%): Tabel Riwayat Berkas */}
          <DocumentAssignmentTable
            assignments={assignments}
            onOpenAssignment={handleOpenAssignment}
          />

          {/* Sisi Kanan (30%): Panel Aksi Customer */}
          <CustomerActionPanel
            customers={customerList}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(cust) => setSelectedCustomer(cust)}
            onOpenCreateModal={() => setIsCreateCustomerOpen(true)}
            onStartWizard={handleStartWizard}
            isLoading={isStartingAssignment || isLoadingAssignment}
          />
        </div>
      )}

      {/* Modal Tambah Customer Baru */}
      <CustomerSelectModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}

export default function SubmitBerkas({ customers = [], assignments = [] }: SubmitBerkasPageProps) {
  const [isWizardActive, setIsWizardActive] = useState(false);

  return (
    <DashboardLayout title="Submit Berkas">
      <Head title="Submit Berkas" />
      <WizardProvider>
        <SubmitBerkasHubContent
          customers={customers}
          assignments={assignments}
          isWizardActive={isWizardActive}
          setIsWizardActive={setIsWizardActive}
        />
      </WizardProvider>
    </DashboardLayout>
  );
}
