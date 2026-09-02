import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle2, Lock } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { WizardProvider } from './context/WizardContext';
import { useWizard } from './hooks/useWizard';
import { WizardHeader } from './components/WizardHeader';
import { Stepper } from './components/Stepper';
import { DocumentAssignmentTable } from './components/DocumentAssignmentTable';
import { CustomerActionPanel } from './components/CustomerActionPanel';
import { RevisionRemarksBanner } from './components/RevisionRemarksBanner';
import { BillOfLadingStep } from './components/steps/BillOfLadingStep';
import { CommercialInvoiceStep } from './components/steps/CommercialInvoiceStep';
import { PackingListStep } from './components/steps/PackingListStep';
import { CertificateOfOriginStep } from './components/steps/CertificateOfOriginStep';
import { InsuranceStep } from './components/steps/InsuranceStep';
import { PreviewPibStep } from './components/steps/PreviewPibStep';
import type { Customer, AssignmentSummary } from './types/SubmitBerkas';
import { AddCustomerModal } from './components/AddCustomerModal';

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
    isReadOnly,
    setSelectedCustomer,
    resetWizard,
    hydrateFromExisting,
  } = useWizard();

  // State daftar customer lokal agar update realtime saat ada customer baru dibuat
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isStartingAssignment, setIsStartingAssignment] = useState(false);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);

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

  // Handler saat baris tabel diklik untuk membuka/merevisi/melihat dokumen
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

      hydrateFromExisting(docs, targetCustomer, assignment.assignment_no_ref, assignment.status);
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
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box',
      }}
    >

      {/* ── KONDISI 1: FORM WIZARD (Step 1 s/d 6) ── */}
      {isWizardActive && selectedCustomer ? (
        <>
          <WizardHeader
            customerName={selectedCustomer.companyName}
            onCancelWizard={handleCancelWizard}
          />

          {isReadOnly && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderRadius: 10,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D',
              }}
            >
              <CheckCircle2 size={18} color="#16A34A" />
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>
                  Documents Verified (Read-Only)
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#166534' }}>
                  Seluruh data penugasan ini sudah fix dan tidak dapat diedit kembali. Anda dapat meninjau setiap dokumen melalui navigasi step.
                </p>
              </div>
            </div>
          )}

          <Stepper />

          {/* Banner Catatan Revisi jika ada */}
          {!isReadOnly && currentStepRemarks && (
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
      <AddCustomerModal
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
    <DashboardLayout title="Submit Documents">
      <Head title="Submit Documents" />
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