import React, { createContext, useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { STEP_DEFINITIONS, TOTAL_STEPS } from '../constants/steps';
import type {
  Customer,
  PdfFile,
  StepStatus,
  WizardData,
} from '../types/SubmitBerkas';

/** Keys for the 5 form+upload steps (excludes previewPib, which has no StepRecord). */
type FormStepKey = keyof WizardData;

const FORM_STEP_KEYS: FormStepKey[] = [
  'billOfLading',
  'commercialInvoice',
  'packingList',
  'certificateOfOrigin',
  'insurance',
];

interface WizardContextValue {
  currentStepIndex: number;
  highestUnlockedIndex: number;
  wizardData: WizardData;
  stepStatuses: StepStatus[];
  assignmentNoRef: string | null;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => Promise<void>;
  saveStepData: <T, >(key: FormStepKey, data: T, pdf: PdfFile | null) => void;
  goNext: () => void;
  goBack: () => void;
  goToStep: (index: number) => void;
  isStepUnlocked: (index: number) => boolean;
  resetWizard: () => void;
  /** Hydrate seluruh step wizard dari data database penugasan yang sudah ada (untuk mode revisi/lanjutkan draft). */
  hydrateFromExisting: (existingDocs: any[], customer: Customer, assignmentRef: string) => void;
}

export const WizardContext = createContext<WizardContextValue | null>(null);

const EMPTY_WIZARD_DATA: WizardData = {
  billOfLading: null,
  commercialInvoice: null,
  packingList: null,
  certificateOfOrigin: null,
  insurance: null,
};

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [selectedCustomer, setSelectedCustomerState] = useState<Customer | null>(null);
  const [assignmentNoRef, setAssignmentNoRef] = useState<string | null>(null);

  /**
   * Mengatur customer aktif dan meminta `assignment_no_ref` baru ke backend.
   */
  const setSelectedCustomer = useCallback(async (customer: Customer | null) => {
    setSelectedCustomerState(customer);

    if (!customer) {
      setAssignmentNoRef(null);
      return;
    }

    try {
      const response = await axios.post('/submit-berkas/start', {
        customer_id: customer.id,
      });

      if (response.data && response.data.assignment_no_ref) {
        setAssignmentNoRef(response.data.assignment_no_ref);
      }
    } catch (error) {
      console.error('Gagal melakukan inisialisasi assignment:', error);
    }
  }, []);

  /**
   * Reset seluruh state wizard ke kondisi awal.
   */
  const resetWizard = useCallback(() => {
    setCurrentStepIndex(0);
    setWizardData(EMPTY_WIZARD_DATA);
    setSelectedCustomerState(null);
    setAssignmentNoRef(null);
  }, []);

  /**
   * Hydrate data dokumen dari database ke dalam WizardContext.
   */
  const hydrateFromExisting = useCallback((existingDocs: any[], customer: Customer, assignmentRef: string) => {
    setSelectedCustomerState(customer);
    setAssignmentNoRef(assignmentRef);

    const newWizardData: WizardData = {
      billOfLading: null,
      commercialInvoice: null,
      packingList: null,
      certificateOfOrigin: null,
      insurance: null,
    };

    existingDocs.forEach((doc) => {
      const typeId = Number(doc.document_type_id);
      const typeName = (doc.document_type?.name ?? doc.documentType?.name ?? '').toLowerCase();
      const record = {
        data: doc.document_data,
        pdf: doc.file_name ? { name: doc.file_name, sizeLabel: 'PDF', url: doc.file_path } : null,
        completed: true,
        remarks: doc.remarks ?? null,
      };

      if (typeId === 1 || typeName.includes('lading')) newWizardData.billOfLading = record as any;
      else if (typeId === 2 || typeName.includes('invoice')) newWizardData.commercialInvoice = record as any;
      else if (typeId === 3 || typeName.includes('packing')) newWizardData.packingList = record as any;
      else if (typeId === 4 || typeName.includes('origin')) newWizardData.certificateOfOrigin = record as any;
      else if (typeId === 5 || typeName.includes('insurance')) newWizardData.insurance = record as any;
    });

    setWizardData(newWizardData);
    setCurrentStepIndex(0);
  }, []);

  // Highest index reachable via the stepper (grows as steps are completed).
  const highestUnlockedIndex = useMemo(() => {
    let unlocked = 0;
    for (const key of FORM_STEP_KEYS) {
      if (wizardData[key]?.completed) {
        unlocked += 1;
      } else {
        break;
      }
    }
    return Math.min(unlocked, TOTAL_STEPS - 1);
  }, [wizardData]);

  const stepStatuses = useMemo<StepStatus[]>(() => {
    return STEP_DEFINITIONS.map((step, index) => {
      if (index === currentStepIndex) return 'active';
      const key = FORM_STEP_KEYS[index];
      if (key && wizardData[key]?.completed) return 'completed';
      return 'upcoming';
    });
  }, [currentStepIndex, wizardData]);

  const isStepUnlocked = useCallback(
    (index: number) => index <= highestUnlockedIndex,
    [highestUnlockedIndex],
  );

  const saveStepData = useCallback(<T,>(key: FormStepKey, data: T, pdf: PdfFile | null) => {
    setWizardData((prev) => ({
      ...prev,
      [key]: { data, pdf, completed: true, remarks: null, status: 'DRAFT' },
    }));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < TOTAL_STEPS && isStepUnlocked(index)) {
        setCurrentStepIndex(index);
      }
    },
    [isStepUnlocked],
  );

  const value: WizardContextValue = {
    currentStepIndex,
    highestUnlockedIndex,
    wizardData,
    stepStatuses,
    assignmentNoRef,
    selectedCustomer,
    setSelectedCustomer,
    saveStepData,
    goNext,
    goBack,
    goToStep,
    isStepUnlocked,
    resetWizard,
    hydrateFromExisting,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
