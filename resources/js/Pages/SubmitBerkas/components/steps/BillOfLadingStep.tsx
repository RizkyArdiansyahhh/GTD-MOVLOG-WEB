import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { FileText, Users, Bell, Ship, Boxes, Scale } from 'lucide-react';
import { FormSection, FieldGroup, Field, FieldWithUnit } from '../FormSection';
import { MOCK_BOL_DATA, MOCK_BOL_PDF } from '../../constants/mockData';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import type { BillOfLadingData, BolCargoItem, PdfFile } from '../../types/SubmitBerkas';

const WEIGHT_UNITS = ['kg', 'ton'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];
const VOLUME_UNITS = ['m³', 'ft³'];

const EMPTY_PARTY = { name: '', address: '', taxId: '' };

function createEmptyCargoItem(): BolCargoItem {
  return {
    id: crypto.randomUUID(),
    descriptionOfGoods: '',
    hsCodePol: '',
    grossWeight: '',
    packages: '',
    volume: '',
  };
}

function sumField(items: BolCargoItem[], key: 'grossWeight' | 'packages' | 'volume'): string {
  const total = items.reduce((acc, item) => acc + (parseFloat(item[key]) || 0), 0);
  return total === 0 ? '' : String(total);
}

function createEmptyData(): BillOfLadingData {
  return {
    documentDetail: { number: '', date: '' },
    shipper: { ...EMPTY_PARTY },
    consignee: { ...EMPTY_PARTY },
    notifyParty: { ...EMPTY_PARTY },
    transportDetail: { portOfLoading: '', portOfDischarge: '', shippName: '', voyage: '' },
    cargoDetail: [createEmptyCargoItem()],
    quantity: {
      totalGrossWeight: '',
      totalGrossWeightUnit: 'kg',
      totalPackages: '',
      totalPackagesUnit: 'Unit',
      totalVolume: '',
      totalVolumeUnit: 'm³',
    },
  };
}

export function BillOfLadingStep() {
  // Ambil state dan helper termasuk assignmentNoRef & selectedCustomer langsung dari useWizard()
  const { wizardData, saveStepData, goNext, assignmentNoRef, selectedCustomer } = useWizard();

  const [data, setData] = useState<BillOfLadingData>(
    wizardData.billOfLading?.data ?? createEmptyData(),
  );
  const [pdf, setPdf] = useState<PdfFile | null>(wizardData.billOfLading?.pdf ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const update = <K extends keyof BillOfLadingData>(key: K, value: BillOfLadingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  // Total Quantity dihitung otomatis dari jumlah semua Cargo Item.
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      quantity: {
        ...prev.quantity,
        totalGrossWeight: sumField(prev.cargoDetail, 'grossWeight'),
        totalPackages: sumField(prev.cargoDetail, 'packages'),
        totalVolume: sumField(prev.cargoDetail, 'volume'),
      },
    }));
  }, [data.cargoDetail]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!data.documentDetail.number.trim()) next.documentNumber = 'Nomor dokumen wajib diisi.';
    if (!data.shipper.name.trim()) next.shipperName = 'Nama shipper wajib diisi.';
    if (!data.consignee.name.trim()) next.consigneeName = 'Nama consignee wajib diisi.';
    if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };


  const handleSaveContinue = async () => {
    if (!validate()) return;
    // Validasi context sebelum request dikirim
    if (!assignmentNoRef || !selectedCustomer?.id) {
      setErrors((prev) => ({
        ...prev,
        general: 'Data customer atau nomor assignment belum tersedia. Silakan pilih customer terlebih dahulu.',
      }));
      return;
    }
    setIsSaving(true);
    try {
      await axios.post('/submit-berkas/step', {
        assignment_no_ref: assignmentNoRef,
        customer_id: selectedCustomer?.id,
        document_type_id: '1',
        document_data: data,
        file_name: pdf?.name ?? 'Bill_of_Lading.pdf',
        file_path: pdf?.url ?? (pdf ? `/documents/${assignmentNoRef}/${pdf.name}` : '/documents/sample.pdf'), // <-- Fallback jika url kosong
      });

      saveStepData('billOfLading', data, pdf);
      goNext();
    } catch (error: any) {
      console.error('Gagal menyimpan step Bill of Lading:', error);

      // Ekstrak pesan detail error dari object errors Laravel
      const validationErrors = error.response?.data?.errors;
      let errorMessage = error.response?.data?.message || 'Gagal menyimpan data ke server.';
      if (validationErrors && typeof validationErrors === 'object') {
        const errorList = Object.values(validationErrors).flat();
        errorMessage = errorList.join(' | ');
      }
      setErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {errors.general && (
        <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
          {errors.general}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setData(MOCK_BOL_DATA);
          setPdf(MOCK_BOL_PDF);
        }}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px dashed #B7791F',
          background: '#FFF8EC',
          color: '#B7791F',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Isi Data Contoh
      </button>

      <FormSection title="Document Detail" icon={<FileText size={17} />}>
        <FieldGroup>
          <Field
            label="Number"
            value={data.documentDetail.number}
            onChange={(v) => update('documentDetail', { ...data.documentDetail, number: v })}
            error={errors.documentNumber}
          />
          <Field
            label="Date"
            type="date"
            value={data.documentDetail.date}
            onChange={(v) => update('documentDetail', { ...data.documentDetail, date: v })}
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Shipper" icon={<Users size={17} />}>
        <FieldGroup>
          <Field
            label="Name"
            value={data.shipper.name}
            onChange={(v) => update('shipper', { ...data.shipper, name: v })}
            error={errors.shipperName}
          />
          <Field
            label="Tax ID"
            value={data.shipper.taxId}
            onChange={(v) => update('shipper', { ...data.shipper, taxId: v })}
          />
        </FieldGroup>
        <FieldGroup>
          <Field
            label="Address"
            value={data.shipper.address}
            onChange={(v) => update('shipper', { ...data.shipper, address: v })}
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Consignee" icon={<Users size={17} />}>
        <FieldGroup>
          <Field
            label="Name"
            value={data.consignee.name}
            onChange={(v) => update('consignee', { ...data.consignee, name: v })}
            error={errors.consigneeName}
          />
          <Field
            label="Tax ID"
            value={data.consignee.taxId}
            onChange={(v) => update('consignee', { ...data.consignee, taxId: v })}
          />
        </FieldGroup>
        <FieldGroup>
          <Field
            label="Address"
            value={data.consignee.address}
            onChange={(v) => update('consignee', { ...data.consignee, address: v })}
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Notify Party" icon={<Bell size={17} />}>
        <FieldGroup>
          <Field
            label="Name"
            value={data.notifyParty.name}
            onChange={(v) => update('notifyParty', { ...data.notifyParty, name: v })}
          />
          <Field
            label="Tax ID"
            value={data.notifyParty.taxId}
            onChange={(v) => update('notifyParty', { ...data.notifyParty, taxId: v })}
          />
        </FieldGroup>
        <FieldGroup>
          <Field
            label="Address"
            value={data.notifyParty.address}
            onChange={(v) => update('notifyParty', { ...data.notifyParty, address: v })}
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Transport Detail" icon={<Ship size={17} />}>
        <FieldGroup>
          <Field
            label="Port of Loading"
            value={data.transportDetail.portOfLoading}
            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfLoading: v })}
          />
          <Field
            label="Port of Discharge"
            value={data.transportDetail.portOfDischarge}
            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfDischarge: v })}
          />
        </FieldGroup>
        <FieldGroup>
          <Field
            label="Shipp Name"
            value={data.transportDetail.shippName}
            onChange={(v) => update('transportDetail', { ...data.transportDetail, shippName: v })}
          />
          <Field
            label="Voyage"
            value={data.transportDetail.voyage}
            onChange={(v) => update('transportDetail', { ...data.transportDetail, voyage: v })}
          />
        </FieldGroup>
      </FormSection>

      <CargoDetailList<BolCargoItem>
        title="Cargo Detail"
        items={data.cargoDetail}
        onChange={(items) => update('cargoDetail', items)}
        createEmptyItem={createEmptyCargoItem}
        renderItem={(item, _index, updateItem) => (
          <>
            <FieldGroup>
              <Field
                label="Description of Goods"
                value={item.descriptionOfGoods}
                onChange={(v) => updateItem({ descriptionOfGoods: v })}
              />
              <Field
                label="HS Code POL"
                value={item.hsCodePol}
                onChange={(v) => updateItem({ hsCodePol: v })}
              />
            </FieldGroup>
            <FieldGroup>
              <Field
                label="Gross Weight"
                value={item.grossWeight}
                onChange={(v) => updateItem({ grossWeight: v })}
                numeric
              />
              <Field
                label="Packages"
                value={item.packages}
                onChange={(v) => updateItem({ packages: v })}
                numeric
              />
              <Field
                label="Volume"
                value={item.volume}
                onChange={(v) => updateItem({ volume: v })}
                numeric
              />
            </FieldGroup>
          </>
        )}
      />

      <FormSection title="Quantity (Otomatis Terhitung)" icon={<Scale size={17} />}>
        <FieldGroup>
          <FieldWithUnit
            label="Total of Gross Weight"
            value={data.quantity.totalGrossWeight}
            unit={data.quantity.totalGrossWeightUnit}
            unitOptions={WEIGHT_UNITS}
            onUnitChange={(unit) => update('quantity', { ...data.quantity, totalGrossWeightUnit: unit })}
          />
          <FieldWithUnit
            label="Total of Packages"
            value={data.quantity.totalPackages}
            unit={data.quantity.totalPackagesUnit}
            unitOptions={PACKAGE_UNITS}
            onUnitChange={(unit) => update('quantity', { ...data.quantity, totalPackagesUnit: unit })}
          />
          <FieldWithUnit
            label="Total Volume"
            value={data.quantity.totalVolume}
            unit={data.quantity.totalVolumeUnit}
            unitOptions={VOLUME_UNITS}
            onUnitChange={(unit) => update('quantity', { ...data.quantity, totalVolumeUnit: unit })}
          />
        </FieldGroup>
      </FormSection>

      <PdfUploadCard
        file={pdf}
        onFileSelect={setPdf}
        onRemove={() => setPdf(null)}
        error={errors.pdf}
      />

      <StepNavigation
        backLabel="Kembali"
        onBack={() => router.visit('/')}
        onSaveContinue={handleSaveContinue}
        isSaving={isSaving}
      />
    </div>
  );
}