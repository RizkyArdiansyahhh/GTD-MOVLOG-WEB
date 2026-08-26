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
  /** Highest step index the user is allowed to jump to (based on completion so far). */
  highestUnlockedIndex: number;
  wizardData: WizardData;
  stepStatuses: StepStatus[];

  /**
   * Assignment reference code dari backend (misal: ASG-20260824-A1B2C3).
   */
  assignmentNoRef: string | null;

  /**
   * Customer yang menjadi acuan seluruh proses submit (BL–Insurance).
   * Wajib dipilih/dibuat sebelum wizard step form dapat diakses.
   */
  selectedCustomer: Customer | null;
  /** Set customer aktif dan generate assignment_no_ref dari backend. */
  setSelectedCustomer: (customer: Customer | null) => Promise<void>;

  /** Save the given step's form data + pdf, mark it completed, and unlock the next step. */
  saveStepData: <T, >(key: FormStepKey, data: T, pdf: PdfFile | null) => void;

  /** Move to the next step (only works if the current step is completed). */
  goNext: () => void;
  /** Move to the previous step (always allowed). */
  goBack: () => void;
  /** Jump directly to a step, only if it's unlocked. */
  goToStep: (index: number) => void;

  isStepUnlocked: (index: number) => boolean;
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
      [key]: { data, pdf, completed: true },
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
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}