import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { WizardProvider } from './context/WizardContext';
import { useWizard } from './hooks/useWizard';
import { WizardHeader } from './components/WizardHeader';
import { Stepper } from './components/Stepper';
import { BillOfLadingStep } from './components/steps/BillOfLadingStep';
import { CommercialInvoiceStep } from './components/steps/CommercialInvoiceStep';
import { PackingListStep } from './components/steps/PackingListStep';
import { STEP_DEFINITIONS } from './constants/steps';
import { CertificateOfOriginStep } from './components/steps/CertificateOfOriginStep';
import { InsuranceStep } from './components/steps/InsuranceStep';
import { PreviewPibStep } from './components/steps/PreviewPibStep';


function WizardContent() {
  const { currentStepIndex } = useWizard();
  const currentStep = STEP_DEFINITIONS[currentStepIndex];

  return (
    <div
      style={{
        padding: 24,
        background: '#F5F7FA',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxSizing: 'border-box',
      }}
    >
      <WizardHeader />
      <Stepper />

      {currentStepIndex === 0 && <BillOfLadingStep />}
      {currentStepIndex === 1 && <CommercialInvoiceStep />}
      {currentStepIndex === 2 && <PackingListStep />}
      {currentStepIndex === 3 && <CertificateOfOriginStep />}
      {currentStepIndex === 4 && <InsuranceStep />}
      {currentStepIndex === 5 && <PreviewPibStep />}

      {currentStepIndex > 5 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            padding: 40,
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: 14,
          }}
        >
          Step aktif: <strong style={{ color: '#06283A' }}>{currentStep.label}</strong>
          <br />
          (form step ini akan diisi di tahap berikutnya)
        </div>
      )}
    </div>
  );
}

export default function SubmitBerkas() {
  return (
    <DashboardLayout title="Submit Berkas">
      <Head title="Submit Berkas" />
      <WizardProvider>
        <WizardContent />
      </WizardProvider>
    </DashboardLayout>
  );
}