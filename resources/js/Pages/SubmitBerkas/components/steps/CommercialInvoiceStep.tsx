import React, { useEffect, useState } from 'react';
import { FileText, Users, Ship, Calculator, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { FormSection, FieldGroup, Field, FieldWithUnit } from '../FormSection';
import { RecommendedFieldHint } from '../RecommendedFieldHint';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_CI_DATA, MOCK_CI_PDF } from '../../Constants/Mockdata';
import type { CiCargoItem, CommercialInvoiceData, PdfFile, TermOfShipment } from '../../types/submitBerkas';

const CURRENCIES = ['USD', 'IDR', 'EUR', 'CNY', 'SGD'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];
const GOODS_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

const currencySelectStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 13,
  color: '#06283A',
  background: '#fff',
  cursor: 'pointer',
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#6B7280',
  marginBottom: 6,
  fontWeight: 500,
};

function ChangeWarningAlert({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 8,
        marginTop: 2,
      }}
    >
      <AlertCircle size={15} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.5 }}>{message}</span>
    </div>
  );
}

interface ChangedDataModalProps {
  sections: string[];
  onClose: () => void;
}

function ChangedDataModal({ sections, onClose }: ChangedDataModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderBottom: '1px solid #FCD34D',
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#92400E' }}>
                Ada Data yang Berubah!
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#B45309' }}>
                Data berikut berbeda dari Bill of Lading
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            Perubahan terdeteksi di section berikut. Pastikan perubahan ini{' '}
            <strong>disengaja</strong> agar tidak terjadi perbedaan data antara
            dokumen Commercial Invoice dan Bill of Lading.
          </p>

          <ul
            style={{
              listStyle: 'none',
              margin: '0 0 20px',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {sections.map((section) => (
              <li
                key={section}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                }}
              >
                <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
                  {section}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
            }}
          >
            Mengerti, Saya Akan Perbaiki
          </button>
        </div>
      </div>
    </div>
  );
}

function createEmptyCargoItem(): CiCargoItem {
  return {
    id: crypto.randomUUID(),
    descriptionOfGoods: '',
    quantityOfGoods: '',
    goodsUnitMeasurement: '',
    quantityOfPackage: '',
    packageUnitMeasurement: '',
    currency: '',
    priceOfGoods: '',
    type: '',
    brand: '',
    hsCodePol: '',
    hsCodePod: '',
  };
}

function createEmptyData(): CommercialInvoiceData {
  return {
    documentDetail: {
      number: '',
      date: '',
      shipmentContractNumber: '',
      termOfShipment: 'FOB',
      oceanFreightCurrency: '',
      oceanFreight: '',
      insuranceCurrency: '',
      insurance: '',
    },
    shipper: { name: '', address: '', taxId: '' },
    consignee: { name: '', address: '', taxId: '' },
    transportDetail: { portOfLoading: '', portOfDischarge: '', shippName: '', voyage: '' },
    cargoDetail: [createEmptyCargoItem()],
    totalQuantity: {
      totalPackages: '',
      totalPackagesUnit: 'Unit',
      totalGoods: '',
      totalGoodsUnit: 'Unit',
      totalPrice: '',
      totalPriceCurrency: 'USD',
    },
  };
}

function sumCargoField(items: CiCargoItem[], key: 'quantityOfPackage' | 'quantityOfGoods' | 'priceOfGoods'): string {
  const total = items.reduce((acc, item) => acc + (parseFloat(item[key]) || 0), 0);
  return total === 0 ? '' : String(total);
}

export function CommercialInvoiceStep() {
  const { wizardData, saveStepData, goNext, goBack } = useWizard();

  const bolData = wizardData.billOfLading?.data ?? null;
  const savedData = wizardData.commercialInvoice?.data;

  const [data, setData] = useState<CommercialInvoiceData>(() => {
    if (savedData) return savedData;

    const base = createEmptyData();
    if (bolData) {
      base.shipper = { ...bolData.shipper };
      base.consignee = { ...bolData.consignee };
      base.transportDetail = { ...bolData.transportDetail };

      if (bolData.cargoDetail?.length > 0) {
        base.cargoDetail = bolData.cargoDetail.map((bolItem) => ({
          ...createEmptyCargoItem(),
          descriptionOfGoods: bolItem.descriptionOfGoods,
          hsCodePol: bolItem.hsCodePol,
        }));
      }
    }
    return base;
  });

  const [pdf, setPdf] = useState<PdfFile | null>(wizardData.commercialInvoice?.pdf ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showChangedModal, setShowChangedModal] = useState(false);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  const update = <K extends keyof CommercialInvoiceData>(key: K, value: CommercialInvoiceData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const updateDocDetail = (patch: Partial<CommercialInvoiceData['documentDetail']>) =>
    update('documentDetail', { ...data.documentDetail, ...patch });

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      totalQuantity: {
        ...prev.totalQuantity,
        totalPackages: sumCargoField(prev.cargoDetail, 'quantityOfPackage'),
        totalGoods: sumCargoField(prev.cargoDetail, 'quantityOfGoods'),
        totalPrice: sumCargoField(prev.cargoDetail, 'priceOfGoods'),
      },
    }));
  }, [data.cargoDetail]);

  const isFob = data.documentDetail.termOfShipment === 'FOB';
  const wasRecommended = !!bolData && !savedData;

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!data.documentDetail.number.trim()) next.documentNumber = 'Nomor dokumen wajib diisi.';
    if (!data.shipper.name.trim()) next.shipperName = 'Nama shipper wajib diisi.';
    if (!data.consignee.name.trim()) next.consigneeName = 'Nama consignee wajib diisi.';
    if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';

    const changed: string[] = [];

    if (wasRecommended && bolData) {
      if (
        data.shipper.name !== bolData.shipper.name ||
        data.shipper.address !== bolData.shipper.address ||
        data.shipper.taxId !== bolData.shipper.taxId
      ) {
        next.shipperChanged = 'Data Shipper berbeda dari Bill of Lading. Pastikan perubahan ini disengaja.';
        changed.push('Shipper');
      }

      if (
        data.consignee.name !== bolData.consignee.name ||
        data.consignee.address !== bolData.consignee.address ||
        data.consignee.taxId !== bolData.consignee.taxId
      ) {
        next.consigneeChanged = 'Data Consignee berbeda dari Bill of Lading. Pastikan perubahan ini disengaja.';
        changed.push('Consignee');
      }

      if (
        data.transportDetail.portOfLoading !== bolData.transportDetail.portOfLoading ||
        data.transportDetail.portOfDischarge !== bolData.transportDetail.portOfDischarge ||
        data.transportDetail.shippName !== bolData.transportDetail.shippName ||
        data.transportDetail.voyage !== bolData.transportDetail.voyage
      ) {
        next.transportChanged = 'Data Transport Detail berbeda dari Bill of Lading. Pastikan perubahan ini disengaja.';
        changed.push('Transport Detail');
      }

      bolData.cargoDetail.forEach((bolItem, index) => {
        const ciItem = data.cargoDetail[index];
        if (!ciItem) return;
        if (
          ciItem.descriptionOfGoods !== bolItem.descriptionOfGoods ||
          ciItem.hsCodePol !== bolItem.hsCodePol
        ) {
          next[`cargoChanged_${index}`] =
            `Item ke-${index + 1}: Description of Goods atau HS Code POL berbeda dari Bill of Lading.`;
          changed.push(`Cargo Detail — Item ke-${index + 1}`);
        }
      });

      if (changed.length > 0) {
        setChangedSections(changed);
        setShowChangedModal(true);
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveContinue = async () => {
    if (!validate()) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    saveStepData('commercialInvoice', data, pdf);
    setIsSaving(false);
    goNext();
  };

  return (
    <>
      {showChangedModal && (
        <ChangedDataModal sections={changedSections} onClose={() => setShowChangedModal(false)} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <button
          type="button"
          onClick={() => {
            setData(MOCK_CI_DATA);
            setPdf(MOCK_CI_PDF);
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
              onChange={(v) => updateDocDetail({ number: v })}
              error={errors.documentNumber}
            />
            <Field
              label="Date"
              type="date"
              value={data.documentDetail.date}
              onChange={(v) => updateDocDetail({ date: v })}
            />
          </FieldGroup>

          <FieldGroup>
            <Field
              label="Shipment Contract Number"
              value={data.documentDetail.shipmentContractNumber}
              onChange={(v) => updateDocDetail({ shipmentContractNumber: v })}
            />
          </FieldGroup>

          <div style={{ marginBottom: 6 }}>
            <label style={fieldLabelStyle}>Term of Shipment</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['FOB', 'CIF'] as TermOfShipment[]).map((term) => {
                const active = data.documentDetail.termOfShipment === term;
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => updateDocDetail({ termOfShipment: term })}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 8,
                      border: active ? '2px solid #B7791F' : '1px solid #E2E8F0',
                      background: active ? '#FFF8EC' : '#fff',
                      color: active ? '#B7791F' : '#6B7280',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {term}
                  </button>
                );
              })}
            </div>
          </div>

          {isFob && (
            <FieldGroup>
              <div style={{ flex: 1, minWidth: 140, maxWidth: 180 }}>
                <label style={fieldLabelStyle}>Currency (Ocean Freight)</label>
                <select
                  value={data.documentDetail.oceanFreightCurrency ?? ''}
                  onChange={(e) => updateDocDetail({ oceanFreightCurrency: e.target.value })}
                  style={currencySelectStyle}
                >
                  <option value="">Pilih Currency</option>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160, opacity: data.documentDetail.oceanFreightCurrency ? 1 : 0.5 }}>
                <Field
                  label="Ocean Freight"
                  value={data.documentDetail.oceanFreight ?? ''}
                  onChange={(v) => updateDocDetail({ oceanFreight: v })}
                  placeholder={data.documentDetail.oceanFreightCurrency ? '' : 'Pilih currency dulu'}
                  numeric
                />
              </div>

              <div style={{ flex: 1, minWidth: 140, maxWidth: 180 }}>
                <label style={fieldLabelStyle}>Currency (Insurance)</label>
                <select
                  value={data.documentDetail.insuranceCurrency ?? ''}
                  onChange={(e) => updateDocDetail({ insuranceCurrency: e.target.value })}
                  style={currencySelectStyle}
                >
                  <option value="">Pilih Currency</option>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160, opacity: data.documentDetail.insuranceCurrency ? 1 : 0.5 }}>
                <Field
                  label="Insurance"
                  value={data.documentDetail.insurance ?? ''}
                  onChange={(v) => updateDocDetail({ insurance: v })}
                  placeholder={data.documentDetail.insuranceCurrency ? '' : 'Pilih currency dulu'}
                  numeric
                />
              </div>
            </FieldGroup>
          )}
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
          {wasRecommended && !errors.shipperChanged && (
            <RecommendedFieldHint sourceLabel="Bill of Lading" />
          )}
          {errors.shipperChanged && <ChangeWarningAlert message={errors.shipperChanged} />}
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
          {wasRecommended && !errors.consigneeChanged && (
            <RecommendedFieldHint sourceLabel="Bill of Lading" />
          )}
          {errors.consigneeChanged && <ChangeWarningAlert message={errors.consigneeChanged} />}
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
          {wasRecommended && !errors.transportChanged && (
            <RecommendedFieldHint sourceLabel="Bill of Lading" />
          )}
          {errors.transportChanged && <ChangeWarningAlert message={errors.transportChanged} />}
        </FormSection>

        <CargoDetailList<CiCargoItem>
          title="Cargo Detail"
          items={data.cargoDetail}
          onChange={(items) => update('cargoDetail', items)}
          createEmptyItem={createEmptyCargoItem}
          renderItem={(item, index, updateItem) => (
            <>
              <FieldGroup>
                <Field
                  label="Description of Goods"
                  value={item.descriptionOfGoods}
                  onChange={(v) => updateItem({ descriptionOfGoods: v })}
                />
                <Field label="Type" value={item.type} onChange={(v) => updateItem({ type: v })} />
                <Field label="Brand" value={item.brand} onChange={(v) => updateItem({ brand: v })} />
              </FieldGroup>

              <FieldGroup>
                <Field
                  label="Quantity of Goods"
                  value={item.quantityOfGoods}
                  onChange={(v) => updateItem({ quantityOfGoods: v })}
                  numeric
                />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={fieldLabelStyle}>Goods Unit Measurement</label>
                  <select
                    value={item.goodsUnitMeasurement}
                    onChange={(e) => updateItem({ goodsUnitMeasurement: e.target.value })}
                    style={currencySelectStyle}
                  >
                    <option value="">Pilih Satuan</option>
                    {GOODS_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Quantity of Package"
                  value={item.quantityOfPackage}
                  onChange={(v) => updateItem({ quantityOfPackage: v })}
                  numeric
                />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={fieldLabelStyle}>Package Unit Measurement</label>
                  <select
                    value={item.packageUnitMeasurement}
                    onChange={(e) => updateItem({ packageUnitMeasurement: e.target.value })}
                    style={currencySelectStyle}
                  >
                    <option value="">Pilih Satuan</option>
                    {PACKAGE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </FieldGroup>

              <FieldGroup>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={fieldLabelStyle}>Currency</label>
                  <select
                    value={item.currency}
                    onChange={(e) => updateItem({ currency: e.target.value })}
                    style={currencySelectStyle}
                  >
                    <option value="">Pilih Currency</option>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200, opacity: item.currency ? 1 : 0.5 }}>
                  <Field
                    label="Price of Goods"
                    value={item.priceOfGoods}
                    onChange={(v) => updateItem({ priceOfGoods: v })}
                    placeholder={item.currency ? '' : 'Pilih currency dulu'}
                    numeric
                  />
                </div>
              </FieldGroup>

              <FieldGroup>
                <Field label="HS Code POL" value={item.hsCodePol} onChange={(v) => updateItem({ hsCodePol: v })} />
                <Field label="HS Code POD" value={item.hsCodePod} onChange={(v) => updateItem({ hsCodePod: v })} />
              </FieldGroup>

              {wasRecommended && !errors[`cargoChanged_${index}`] && (
                <RecommendedFieldHint sourceLabel="Bill of Lading" />
              )}
              {errors[`cargoChanged_${index}`] && (
                <ChangeWarningAlert message={errors[`cargoChanged_${index}`]} />
              )}
            </>
          )}
        />

        <FormSection title="Total Quantity (Otomatis Terhitung)" icon={<Calculator size={17} />}>
          <FieldGroup>
            <FieldWithUnit
              label="Total of Packages"
              value={data.totalQuantity.totalPackages}
              unit={data.totalQuantity.totalPackagesUnit}
              unitOptions={PACKAGE_UNITS}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalPackagesUnit: unit })}
            />
            <FieldWithUnit
              label="Total of Goods"
              value={data.totalQuantity.totalGoods}
              unit={data.totalQuantity.totalGoodsUnit}
              unitOptions={GOODS_UNITS}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalGoodsUnit: unit })}
            />
            <FieldWithUnit
              label="Total Price"
              value={data.totalQuantity.totalPrice}
              unit={data.totalQuantity.totalPriceCurrency}
              unitOptions={CURRENCIES}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalPriceCurrency: unit })}
            />
          </FieldGroup>
        </FormSection>

        <PdfUploadCard file={pdf} onFileSelect={setPdf} onRemove={() => setPdf(null)} error={errors.pdf} />

        <StepNavigation onBack={goBack} onSaveContinue={handleSaveContinue} isSaving={isSaving} />
      </div>
    </>
  );
}