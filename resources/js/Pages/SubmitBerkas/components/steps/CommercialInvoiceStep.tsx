import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Users, Ship, Calculator, AlertCircle } from 'lucide-react';
import { FormSection, FieldGroup, Field, FieldWithUnit } from '../FormSection';
import { ChangedDataModal } from '../ChangedDataModal';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_CI_DATA, MOCK_CI_PDF } from '../../constants/mockData';
import type { CiCargoItem, CommercialInvoiceData, PdfFile, TermOfShipment } from '../../types/SubmitBerkas';

const CURRENCIES = ['USD', 'IDR', 'EUR', 'CNY', 'SGD'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];
const GOODS_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

/** ID tipe dokumen untuk Commercial Invoice (CI) di database */
const DOCUMENT_TYPE_ID_CI = "2";

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

function createEmptyCargoItem(): CiCargoItem {
  return {
    id: crypto.randomUUID(),
    descriptionOfGoods: '',
    type: '',
    brand: '',
    quantityOfGoods: '',
    goodsUnitMeasurement: 'Unit',
    quantityOfPackage: '',
    packageUnitMeasurement: 'Unit',
    priceOfGoods: '',
    currency: 'USD',
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
  const { wizardData, saveStepData, goNext, goBack, assignmentNoRef, selectedCustomer, isReadOnly } = useWizard();

  const bolData = wizardData.billOfLading?.data ?? null;
  const savedData = wizardData.commercialInvoice?.data;

  const [data, setData] = useState<CommercialInvoiceData>(() => {
    if (savedData) return savedData;
    return createEmptyData();
  });

  const [pdf, setPdf] = useState<PdfFile | null>(wizardData.commercialInvoice?.pdf ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changeWarnings, setChangeWarnings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showChangedModal, setShowChangedModal] = useState(false);
  const [changedSections, setChangedSections] = useState<string[]>([]);

  const update = <K extends keyof CommercialInvoiceData>(key: K, value: CommercialInvoiceData[K]) => {
    if (isReadOnly) return;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateDocDetail = (patch: Partial<CommercialInvoiceData['documentDetail']>) => {
    if (isReadOnly) return;
    update('documentDetail', { ...data.documentDetail, ...patch });
  };

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

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!data.documentDetail.number.trim()) next.documentNumber = 'Nomor dokumen wajib diisi.';
    if (!data.shipper.name.trim()) next.shipperName = 'Nama shipper wajib diisi.';
    if (!data.consignee.name.trim()) next.consigneeName = 'Nama consignee wajib diisi.';
    if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';
    if (!selectedCustomer?.id) next.general = 'Customer wajib dipilih terlebih dahulu.';
    if (!assignmentNoRef) next.general = 'Assignment Reference tidak ditemukan.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const detectChanges = (): string[] => {
    const changed: string[] = [];
    const warnings: Record<string, string> = {};

    if (bolData) {
      if (
        (data.shipper.name && data.shipper.name !== bolData.shipper?.name) ||
        (data.shipper.address && data.shipper.address !== bolData.shipper?.address) ||
        (data.shipper.taxId && data.shipper.taxId !== bolData.shipper?.taxId)
      ) {
        warnings.shipperChanged = 'Data Shipper berbeda dari Bill of Lading.';
        changed.push('Shipper');
      }

      if (
        (data.consignee.name && data.consignee.name !== bolData.consignee?.name) ||
        (data.consignee.address && data.consignee.address !== bolData.consignee?.address) ||
        (data.consignee.taxId && data.consignee.taxId !== bolData.consignee?.taxId)
      ) {
        warnings.consigneeChanged = 'Data Consignee berbeda dari Bill of Lading.';
        changed.push('Consignee');
      }

      if (
        (data.transportDetail.portOfLoading && data.transportDetail.portOfLoading !== bolData.transportDetail?.portOfLoading) ||
        (data.transportDetail.portOfDischarge && data.transportDetail.portOfDischarge !== bolData.transportDetail?.portOfDischarge) ||
        (data.transportDetail.shippName && data.transportDetail.shippName !== bolData.transportDetail?.shippName) ||
        (data.transportDetail.voyage && data.transportDetail.voyage !== bolData.transportDetail?.voyage)
      ) {
        warnings.transportChanged = 'Data Transport Detail berbeda dari Bill of Lading.';
        changed.push('Transport Detail');
      }

      bolData.cargoDetail?.forEach((bolItem, index) => {
        const ciItem = data.cargoDetail[index];
        if (!ciItem) return;
        if (
          (ciItem.descriptionOfGoods && ciItem.descriptionOfGoods !== bolItem.descriptionOfGoods) ||
          (ciItem.hsCodePol && ciItem.hsCodePol !== bolItem.hsCodePol)
        ) {
          warnings[`cargoChanged_${index}`] =
            `Item ke-${index + 1}: Description of Goods atau HS Code POL berbeda dari Bill of Lading.`;
          changed.push(`Cargo Detail — Item ke-${index + 1}`);
        }
      });
    }

    setChangeWarnings(warnings);
    return changed;
  };

  const executeSave = async () => {
    setShowChangedModal(false);
    setIsSaving(true);
    try {
      await axios.post('/submit-berkas/step', {
        assignment_no_ref: assignmentNoRef,
        customer_id: selectedCustomer?.id,
        document_type_id: DOCUMENT_TYPE_ID_CI,
        document_data: data,
        file_name: pdf?.name ?? null,
        file_path: pdf?.url ?? null,
      });

      saveStepData('commercialInvoice', data, pdf);
      goNext();
    } catch (error: any) {
      console.error('Gagal menyimpan step Commercial Invoice:', error);
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || 'Gagal menyimpan data ke server. Silakan coba lagi.',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContinue = async () => {
    if (isReadOnly) {
      goNext();
      return;
    }

    if (!validate()) return;

    const changed = detectChanges();
    if (changed.length > 0) {
      setChangedSections(changed);
      setShowChangedModal(true);
      return;
    }

    await executeSave();
  };

  return (
    <>
      {showChangedModal && (
        <ChangedDataModal
          sections={changedSections}
          sourceLabel="Bill of Lading"
          onClose={() => setShowChangedModal(false)}
          onConfirm={executeSave}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {errors.general && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontSize: 13 }}>
            {errors.general}
          </div>
        )}

        {!isReadOnly && (
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
        )}

        <FormSection title="Document Detail" icon={<FileText size={17} />}>
          <FieldGroup>
            <Field
              label="Number"
              value={data.documentDetail.number}
              readOnly={isReadOnly}
              onChange={(v) => updateDocDetail({ number: v })}
              error={errors.documentNumber}
            />
            <Field
              label="Date"
              type="date"
              value={data.documentDetail.date}
              readOnly={isReadOnly}
              onChange={(v) => updateDocDetail({ date: v })}
            />
            <Field
              label="Shipment Contract Number"
              value={data.documentDetail.shipmentContractNumber}
              readOnly={isReadOnly}
              onChange={(v) => updateDocDetail({ shipmentContractNumber: v })}
            />
          </FieldGroup>

          <FieldGroup>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={fieldLabelStyle}>Term of Shipment</label>
              <select
                value={data.documentDetail.termOfShipment}
                disabled={isReadOnly}
                onChange={(e) => updateDocDetail({ termOfShipment: e.target.value as TermOfShipment })}
                style={{
                  ...currencySelectStyle,
                  background: isReadOnly ? '#F8FAFB' : '#fff',
                  color: isReadOnly ? '#4B5563' : '#06283A',
                  cursor: isReadOnly ? 'default' : 'pointer',
                }}
              >
                <option value="FOB">FOB</option>
                <option value="CNF">CNF</option>
                <option value="CIF">CIF</option>
              </select>
            </div>
          </FieldGroup>

          {isFob && (
            <FieldGroup>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={fieldLabelStyle}>Ocean Freight Currency</label>
                <select
                  value={data.documentDetail.oceanFreightCurrency ?? ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateDocDetail({ oceanFreightCurrency: e.target.value })}
                  style={{
                    ...currencySelectStyle,
                    background: isReadOnly ? '#F8FAFB' : '#fff',
                    color: isReadOnly ? '#4B5563' : '#06283A',
                    cursor: isReadOnly ? 'default' : 'pointer',
                  }}
                >
                  <option value="">Pilih Currency</option>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 200,
                  opacity: data.documentDetail.oceanFreightCurrency ? 1 : 0.5,
                }}
              >
                <Field
                  label="Ocean Freight"
                  value={data.documentDetail.oceanFreight ?? ''}
                  readOnly={isReadOnly}
                  onChange={(v) => updateDocDetail({ oceanFreight: v })}
                  placeholder={data.documentDetail.oceanFreightCurrency ? '0.00' : 'Pilih currency dulu'}
                  numeric
                />
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={fieldLabelStyle}>Insurance Currency</label>
                <select
                  value={data.documentDetail.insuranceCurrency ?? ''}
                  disabled={isReadOnly}
                  onChange={(e) => updateDocDetail({ insuranceCurrency: e.target.value })}
                  style={{
                    ...currencySelectStyle,
                    background: isReadOnly ? '#F8FAFB' : '#fff',
                    color: isReadOnly ? '#4B5563' : '#06283A',
                    cursor: isReadOnly ? 'default' : 'pointer',
                  }}
                >
                  <option value="">Pilih Currency</option>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 200,
                  opacity: data.documentDetail.insuranceCurrency ? 1 : 0.5,
                }}
              >
                <Field
                  label="Insurance"
                  value={data.documentDetail.insurance ?? ''}
                  readOnly={isReadOnly}
                  onChange={(v) => updateDocDetail({ insurance: v })}
                  placeholder={data.documentDetail.insuranceCurrency ? '0.00' : 'Pilih currency dulu'}
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
              readOnly={isReadOnly}
              placeholder={bolData?.shipper?.name || 'Nama Shipper'}
              onChange={(v) => update('shipper', { ...data.shipper, name: v })}
              error={errors.shipperName}
            />
            <Field
              label="Tax ID"
              value={data.shipper.taxId}
              readOnly={isReadOnly}
              placeholder={bolData?.shipper?.taxId || 'Tax ID'}
              onChange={(v) => update('shipper', { ...data.shipper, taxId: v })}
            />
          </FieldGroup>
          <FieldGroup>
            <Field
              label="Address"
              value={data.shipper.address}
              readOnly={isReadOnly}
              placeholder={bolData?.shipper?.address || 'Alamat Shipper'}
              onChange={(v) => update('shipper', { ...data.shipper, address: v })}
            />
          </FieldGroup>
          {!isReadOnly && changeWarnings.shipperChanged && <ChangeWarningAlert message={changeWarnings.shipperChanged} />}
        </FormSection>

        <FormSection title="Consignee" icon={<Users size={17} />}>
          <FieldGroup>
            <Field
              label="Name"
              value={data.consignee.name}
              readOnly={isReadOnly}
              placeholder={bolData?.consignee?.name || 'Nama Consignee'}
              onChange={(v) => update('consignee', { ...data.consignee, name: v })}
              error={errors.consigneeName}
            />
            <Field
              label="Tax ID"
              value={data.consignee.taxId}
              readOnly={isReadOnly}
              placeholder={bolData?.consignee?.taxId || 'Tax ID'}
              onChange={(v) => update('consignee', { ...data.consignee, taxId: v })}
            />
          </FieldGroup>
          <FieldGroup>
            <Field
              label="Address"
              value={data.consignee.address}
              readOnly={isReadOnly}
              placeholder={bolData?.consignee?.address || 'Alamat Consignee'}
              onChange={(v) => update('consignee', { ...data.consignee, address: v })}
            />
          </FieldGroup>
          {!isReadOnly && changeWarnings.consigneeChanged && <ChangeWarningAlert message={changeWarnings.consigneeChanged} />}
        </FormSection>

        <FormSection title="Transport Detail" icon={<Ship size={17} />}>
          <FieldGroup>
            <Field
              label="Port of Loading"
              value={data.transportDetail.portOfLoading}
              readOnly={isReadOnly}
              placeholder={bolData?.transportDetail?.portOfLoading || 'Port of Loading'}
              onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfLoading: v })}
            />
            <Field
              label="Port of Discharge"
              value={data.transportDetail.portOfDischarge}
              readOnly={isReadOnly}
              placeholder={bolData?.transportDetail?.portOfDischarge || 'Port of Discharge'}
              onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfDischarge: v })}
            />
          </FieldGroup>
          <FieldGroup>
            <Field
              label="Shipp Name"
              value={data.transportDetail.shippName}
              readOnly={isReadOnly}
              placeholder={bolData?.transportDetail?.shippName || 'Shipp Name'}
              onChange={(v) => update('transportDetail', { ...data.transportDetail, shippName: v })}
            />
            <Field
              label="Voyage"
              value={data.transportDetail.voyage}
              readOnly={isReadOnly}
              placeholder={bolData?.transportDetail?.voyage || 'Voyage'}
              onChange={(v) => update('transportDetail', { ...data.transportDetail, voyage: v })}
            />
          </FieldGroup>
          {!isReadOnly && changeWarnings.transportChanged && <ChangeWarningAlert message={changeWarnings.transportChanged} />}
        </FormSection>

        <CargoDetailList<CiCargoItem>
          title="Cargo Detail"
          items={data.cargoDetail}
          readOnly={isReadOnly}
          onChange={(items) => update('cargoDetail', items)}
          createEmptyItem={createEmptyCargoItem}
          renderItem={(item, index, updateItem) => {
            const bolCargo = bolData?.cargoDetail?.[index];
            return (
              <>
                <FieldGroup>
                  <Field
                    label="Description of Goods"
                    value={item.descriptionOfGoods}
                    readOnly={isReadOnly}
                    placeholder={bolCargo?.descriptionOfGoods || 'Description of Goods'}
                    onChange={(v) => updateItem({ descriptionOfGoods: v })}
                  />
                  <Field label="Type" value={item.type} readOnly={isReadOnly} onChange={(v) => updateItem({ type: v })} />
                  <Field label="Brand" value={item.brand} readOnly={isReadOnly} onChange={(v) => updateItem({ brand: v })} />
                </FieldGroup>

                <FieldGroup>
                  <Field
                    label="Quantity of Goods"
                    value={item.quantityOfGoods}
                    readOnly={isReadOnly}
                    onChange={(v) => updateItem({ quantityOfGoods: v })}
                    numeric
                  />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={fieldLabelStyle}>Goods Unit Measurement</label>
                    <select
                      value={item.goodsUnitMeasurement}
                      disabled={isReadOnly}
                      onChange={(e) => updateItem({ goodsUnitMeasurement: e.target.value })}
                      style={{
                        ...currencySelectStyle,
                        background: isReadOnly ? '#F8FAFB' : '#fff',
                        color: isReadOnly ? '#4B5563' : '#06283A',
                        cursor: isReadOnly ? 'default' : 'pointer',
                      }}
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
                    readOnly={isReadOnly}
                    onChange={(v) => updateItem({ quantityOfPackage: v })}
                    numeric
                  />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={fieldLabelStyle}>Package Unit Measurement</label>
                    <select
                      value={item.packageUnitMeasurement}
                      disabled={isReadOnly}
                      onChange={(e) => updateItem({ packageUnitMeasurement: e.target.value })}
                      style={{
                        ...currencySelectStyle,
                        background: isReadOnly ? '#F8FAFB' : '#fff',
                        color: isReadOnly ? '#4B5563' : '#06283A',
                        cursor: isReadOnly ? 'default' : 'pointer',
                      }}
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
                      disabled={isReadOnly}
                      onChange={(e) => updateItem({ currency: e.target.value })}
                      style={{
                        ...currencySelectStyle,
                        background: isReadOnly ? '#F8FAFB' : '#fff',
                        color: isReadOnly ? '#4B5563' : '#06283A',
                        cursor: isReadOnly ? 'default' : 'pointer',
                      }}
                    >
                      <option value="">Pilih Currency</option>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, opacity: item.currency ? 1 : 0.5 }}>
                    <Field
                      label="Price of Goods"
                      value={item.priceOfGoods}
                      readOnly={isReadOnly}
                      onChange={(v) => updateItem({ priceOfGoods: v })}
                      placeholder={item.currency ? '' : 'Pilih currency dulu'}
                      numeric
                    />
                  </div>
                </FieldGroup>

                <FieldGroup>
                  <Field
                    label="HS Code POL"
                    value={item.hsCodePol}
                    readOnly={isReadOnly}
                    placeholder={bolCargo?.hsCodePol || 'HS Code POL'}
                    onChange={(v) => updateItem({ hsCodePol: v })}
                  />
                  <Field label="HS Code POD" value={item.hsCodePod} readOnly={isReadOnly} onChange={(v) => updateItem({ hsCodePod: v })} />
                </FieldGroup>

                {!isReadOnly && changeWarnings[`cargoChanged_${index}`] && (
                  <ChangeWarningAlert message={changeWarnings[`cargoChanged_${index}`]} />
                )}
              </>
            );
          }}
        />

        <FormSection title="Total Quantity (Otomatis Terhitung)" icon={<Calculator size={17} />}>
          <FieldGroup>
            <FieldWithUnit
              label="Total of Packages"
              value={data.totalQuantity.totalPackages}
              unit={data.totalQuantity.totalPackagesUnit}
              unitOptions={PACKAGE_UNITS}
              readOnly={true}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalPackagesUnit: unit })}
            />
            <FieldWithUnit
              label="Total of Goods"
              value={data.totalQuantity.totalGoods}
              unit={data.totalQuantity.totalGoodsUnit}
              unitOptions={GOODS_UNITS}
              readOnly={true}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalGoodsUnit: unit })}
            />
            <FieldWithUnit
              label="Total Price"
              value={data.totalQuantity.totalPrice}
              unit={data.totalQuantity.totalPriceCurrency}
              unitOptions={CURRENCIES}
              readOnly={true}
              onUnitChange={(unit) => update('totalQuantity', { ...data.totalQuantity, totalPriceCurrency: unit })}
            />
          </FieldGroup>
        </FormSection>

        <PdfUploadCard
          file={pdf}
          onFileSelect={setPdf}
          onRemove={() => setPdf(null)}
          error={errors.pdf}
          readOnly={isReadOnly}
        />

        <StepNavigation
          onBack={goBack}
          onSaveContinue={handleSaveContinue}
          isSaving={isSaving}
          readOnly={isReadOnly}
        />
      </div>
    </>
  );
}