import type { StepDefinition } from '../types/SubmitBerkas';

export const STEP_DEFINITIONS: StepDefinition[] = [
  { key: 'billOfLading', order: 0, label: 'Bill of Lading' },
  { key: 'commercialInvoice', order: 1, label: 'Commercial Invoice' },
  { key: 'packingList', order: 2, label: 'Packing List' },
  { key: 'certificateOfOrigin', order: 3, label: 'COO' },
  { key: 'insurance', order: 4, label: 'Insurance' },
  { key: 'previewPib', order: 5, label: 'Preview PIB' },
];

export const TOTAL_STEPS = STEP_DEFINITIONS.length;

/** Steps 0–4 are form+upload steps; the last step (index 5) is preview-only. */
export const LAST_FORM_STEP_INDEX = TOTAL_STEPS - 2;
