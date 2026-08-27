import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { WizardProvider } from './context/WizardContext';
import { useWizard } from './hooks/useWizard';
import { WizardHeader } from './components/WizardHeader';
import { Stepper } from './components/Stepper';
import { DocumentAssignmentTable } from './components/DocumentAssignmentTable';
import { CustomerActionPanel } from './components/CustomerActionPanel';
import CustomerSelectModal from './components/CustomerSelectModal';
import { BillOfLadingStep } from './components/steps/BillOfLadingStep';
import { CommercialInvoiceStep } from './components/steps/CommercialInvoiceStep';
import { PackingListStep } from './components/steps/PackingListStep';
import { CertificateOfOriginStep } from './components/steps/CertificateOfOriginStep';
import { InsuranceStep } from './components/steps/InsuranceStep';
import { PreviewPibStep } from './components/steps/PreviewPibStep';
import { STEP_DEFINITIONS } from './constants/steps';
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
    selectedCustomer,
    setSelectedCustomer,
    resetWizard,
  } = useWizard();

  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isStartingAssignment, setIsStartingAssignment] = useState(false);

  // Flash message dari backend
  const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

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
          <DocumentAssignmentTable assignments={assignments} />

          {/* Sisi Kanan (30%): Panel Aksi Customer */}
          <CustomerActionPanel
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(cust) => setSelectedCustomer(cust)}
            onOpenCreateModal={() => setIsCreateCustomerOpen(true)}
            onStartWizard={handleStartWizard}
            isLoading={isStartingAssignment}
          />
        </div>
      )}

      {/* Modal Tambah Customer Baru jika dipicu dari panel kanan */}
      {isCreateCustomerOpen && (
        <CustomerSelectModal
          onConfirm={(cust) => {
            setSelectedCustomer(cust);
            setIsCreateCustomerOpen(false);
          }}
          customers={customers}
        />
      )}
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
