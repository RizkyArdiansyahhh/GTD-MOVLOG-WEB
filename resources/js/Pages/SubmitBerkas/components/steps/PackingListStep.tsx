import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Users, Ship, AlertCircle } from 'lucide-react';
import { FormSection, FieldGroup, Field } from '../FormSection';
import { ChangedDataModal } from '../ChangedDataModal';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_PL_DATA, MOCK_PL_PDF } from '../../constants/mockData';
import type { PackingListData, PlCargoItem, PdfFile, TermOfShipment } from '../../types/SubmitBerkas';

const CURRENCIES = ['USD', 'IDR', 'EUR', 'CNY', 'SGD'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];
const GOODS_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

/** ID tipe dokumen untuk Packing List (PL) di database */
const DOCUMENT_TYPE_ID_PL = "3";

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

function createEmptyCargoItem(): PlCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        type: '',
        brand: '',
        quantityOfGoods: '',
        goodsUnitMeasurement: 'Unit',
        quantityOfPackage: '',
        packageUnitMeasurement: 'Unit',
        netWeight: '',
        grossWeight: '',
        volumeDimension: '',
    };
}

function createEmptyData(): PackingListData {
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
    };
}

export function PackingListStep() {
    const { wizardData, saveStepData, goNext, goBack, assignmentNoRef, selectedCustomer, isReadOnly } = useWizard();

    const ciData = wizardData.commercialInvoice?.data ?? null;
    const bolData = wizardData.billOfLading?.data ?? null;
    const savedData = wizardData.packingList?.data;
    const refData = ciData || bolData;
    const recommendationSource = ciData ? 'Commercial Invoice' : 'Bill of Lading';

    const [data, setData] = useState<PackingListData>(() => {
        if (savedData) return savedData;
        return createEmptyData();
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.packingList?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [changeWarnings, setChangeWarnings] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof PackingListData>(key: K, value: PackingListData[K]) => {
        if (isReadOnly) return;
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateDocDetail = (patch: Partial<PackingListData['documentDetail']>) => {
        if (isReadOnly) return;
        update('documentDetail', { ...data.documentDetail, ...patch });
    };

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

        if (refData) {
            if (
                (data.shipper.name && data.shipper.name !== refData.shipper?.name) ||
                (data.shipper.address && data.shipper.address !== refData.shipper?.address) ||
                (data.shipper.taxId && data.shipper.taxId !== refData.shipper?.taxId)
            ) {
                warnings.shipperChanged = `Data Shipper berbeda dari ${recommendationSource}.`;
                changed.push('Shipper');
            }

            if (
                (data.consignee.name && data.consignee.name !== refData.consignee?.name) ||
                (data.consignee.address && data.consignee.address !== refData.consignee?.address) ||
                (data.consignee.taxId && data.consignee.taxId !== refData.consignee?.taxId)
            ) {
                warnings.consigneeChanged = `Data Consignee berbeda dari ${recommendationSource}.`;
                changed.push('Consignee');
            }

            if (
                (data.transportDetail.portOfLoading && data.transportDetail.portOfLoading !== refData.transportDetail?.portOfLoading) ||
                (data.transportDetail.portOfDischarge && data.transportDetail.portOfDischarge !== refData.transportDetail?.portOfDischarge) ||
                (data.transportDetail.shippName && data.transportDetail.shippName !== refData.transportDetail?.shippName) ||
                (data.transportDetail.voyage && data.transportDetail.voyage !== refData.transportDetail?.voyage)
            ) {
                warnings.transportChanged = `Data Transport Detail berbeda dari ${recommendationSource}.`;
                changed.push('Transport Detail');
            }

            if (ciData) {
                if (
                    (data.documentDetail.shipmentContractNumber && data.documentDetail.shipmentContractNumber !== ciData.documentDetail?.shipmentContractNumber) ||
                    (data.documentDetail.termOfShipment && data.documentDetail.termOfShipment !== ciData.documentDetail?.termOfShipment) ||
                    (data.documentDetail.oceanFreight && data.documentDetail.oceanFreight !== ciData.documentDetail?.oceanFreight) ||
                    (data.documentDetail.insurance && data.documentDetail.insurance !== ciData.documentDetail?.insurance)
                ) {
                    warnings.documentDetailChanged = 'Detail Dokumen berbeda dari Commercial Invoice.';
                    changed.push('Document Detail');
                }

                ciData.cargoDetail?.forEach((ciItem, index) => {
                    const plItem = data.cargoDetail[index];
                    if (!plItem) return;
                    if (
                        (plItem.descriptionOfGoods && plItem.descriptionOfGoods !== ciItem.descriptionOfGoods) ||
                        (plItem.quantityOfGoods && plItem.quantityOfGoods !== ciItem.quantityOfGoods) ||
                        (plItem.quantityOfPackage && plItem.quantityOfPackage !== ciItem.quantityOfPackage) ||
                        (plItem.type && plItem.type !== ciItem.type) ||
                        (plItem.brand && plItem.brand !== ciItem.brand)
                    ) {
                        warnings[`cargoChanged_${index}`] =
                            `Item ke-${index + 1}: Detail barang berbeda dari Commercial Invoice.`;
                        changed.push(`Cargo Detail — Item ke-${index + 1}`);
                    }
                });
            }
        }

        setChangeWarnings(warnings);
        return changed;
    };

    const executeSave = async () => {
        setShowChangedModal(false);
        setIsSaving(true);
        try {
            const formData = new FormData();
      formData.append('assignment_no_ref', assignmentNoRef);
      formData.append('customer_id', String(selectedCustomer?.id));
      formData.append('document_type_id', '3');
      formData.append('document_data', JSON.stringify(data));
      const fName = pdf?.name ?? null;
      if (fName) formData.append('file_name', fName);
      const fPath = pdf?.url ?? null;
      if (fPath) formData.append('file_path', fPath);
      if (pdf?.file) formData.append('pdf', pdf.file);
      await axios.post('/submit-berkas/step', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

            saveStepData('packingList', data, pdf);
            goNext();
        } catch (error: any) {
            console.error('Gagal menyimpan step Packing List:', error);
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
                    sourceLabel={recommendationSource}
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
                        setData(MOCK_PL_DATA);
                        setPdf(MOCK_PL_PDF);
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

                {/* Document Detail */}
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
                        <Field
                            label="Shipment Contract Number"
                            value={data.documentDetail.shipmentContractNumber}
                            placeholder={ciData?.documentDetail?.shipmentContractNumber || 'Shipment Contract Number'}
                            onChange={(v) => updateDocDetail({ shipmentContractNumber: v })}
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={fieldLabelStyle}>Term of Shipment</label>
                            <select
                                value={data.documentDetail.termOfShipment}
                                onChange={(e) => updateDocDetail({ termOfShipment: e.target.value as TermOfShipment })}
                                style={currencySelectStyle}
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
                                    onChange={(e) => updateDocDetail({ oceanFreightCurrency: e.target.value })}
                                    style={currencySelectStyle}
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
                                    onChange={(v) => updateDocDetail({ oceanFreight: v })}
                                    placeholder={ciData?.documentDetail?.oceanFreight || (data.documentDetail.oceanFreightCurrency ? '0.00' : 'Pilih currency dulu')}
                                    numeric
                                />
                            </div>

                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={fieldLabelStyle}>Insurance Currency</label>
                                <select
                                    value={data.documentDetail.insuranceCurrency ?? ''}
                                    onChange={(e) => updateDocDetail({ insuranceCurrency: e.target.value })}
                                    style={currencySelectStyle}
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
                                    onChange={(v) => updateDocDetail({ insurance: v })}
                                    placeholder={ciData?.documentDetail?.insurance || (data.documentDetail.insuranceCurrency ? '0.00' : 'Pilih currency dulu')}
                                    numeric
                                />
                            </div>
                        </FieldGroup>
                    )}

                    {changeWarnings.documentDetailChanged && (
                        <ChangeWarningAlert message={changeWarnings.documentDetailChanged} />
                    )}
                </FormSection>

                {/* Shipper */}
                <FormSection title="Shipper" icon={<Users size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Name"
                            value={data.shipper.name}
                            placeholder={refData?.shipper?.name || 'Nama Shipper'}
                            onChange={(v) => update('shipper', { ...data.shipper, name: v })}
                            error={errors.shipperName}
                        />
                        <Field
                            label="Tax ID"
                            value={data.shipper.taxId}
                            placeholder={refData?.shipper?.taxId || 'Tax ID'}
                            onChange={(v) => update('shipper', { ...data.shipper, taxId: v })}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Field
                            label="Address"
                            value={data.shipper.address}
                            placeholder={refData?.shipper?.address || 'Alamat Shipper'}
                            onChange={(v) => update('shipper', { ...data.shipper, address: v })}
                        />
                    </FieldGroup>
                    {changeWarnings.shipperChanged && <ChangeWarningAlert message={changeWarnings.shipperChanged} />}
                </FormSection>

                {/* Consignee */}
                <FormSection title="Consignee" icon={<Users size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Name"
                            value={data.consignee.name}
                            placeholder={refData?.consignee?.name || 'Nama Consignee'}
                            onChange={(v) => update('consignee', { ...data.consignee, name: v })}
                            error={errors.consigneeName}
                        />
                        <Field
                            label="Tax ID"
                            value={data.consignee.taxId}
                            placeholder={refData?.consignee?.taxId || 'Tax ID'}
                            onChange={(v) => update('consignee', { ...data.consignee, taxId: v })}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Field
                            label="Address"
                            value={data.consignee.address}
                            placeholder={refData?.consignee?.address || 'Alamat Consignee'}
                            onChange={(v) => update('consignee', { ...data.consignee, address: v })}
                        />
                    </FieldGroup>
                    {changeWarnings.consigneeChanged && <ChangeWarningAlert message={changeWarnings.consigneeChanged} />}
                </FormSection>

                {/* Transport Detail */}
                <FormSection title="Transport Detail" icon={<Ship size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Port of Loading"
                            value={data.transportDetail.portOfLoading}
                            placeholder={refData?.transportDetail?.portOfLoading || 'Port of Loading'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfLoading: v })}
                        />
                        <Field
                            label="Port of Discharge"
                            value={data.transportDetail.portOfDischarge}
                            placeholder={refData?.transportDetail?.portOfDischarge || 'Port of Discharge'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfDischarge: v })}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Field
                            label="Shipp Name"
                            value={data.transportDetail.shippName}
                            placeholder={refData?.transportDetail?.shippName || 'Shipp Name'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, shippName: v })}
                        />
                        <Field
                            label="Voyage"
                            value={data.transportDetail.voyage}
                            placeholder={refData?.transportDetail?.voyage || 'Voyage'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, voyage: v })}
                        />
                    </FieldGroup>
                    {changeWarnings.transportChanged && <ChangeWarningAlert message={changeWarnings.transportChanged} />}
                </FormSection>

                {/* Cargo Detail */}
                <CargoDetailList<PlCargoItem>
                    title="Cargo Detail"
                    readOnly={isReadOnly}
                    items={data.cargoDetail}
                    onChange={(items) => update('cargoDetail', items)}
                    createEmptyItem={createEmptyCargoItem}
                    renderItem={(item, index, updateItem) => {
                        const ciCargo = ciData?.cargoDetail?.[index];
                        const bolCargo = bolData?.cargoDetail?.[index];
                        return (
                            <>
                                <FieldGroup>
                                    <Field
                                        label="Description of Goods"
                                        value={item.descriptionOfGoods}
                                        placeholder={ciCargo?.descriptionOfGoods || bolCargo?.descriptionOfGoods || 'Description of Goods'}
                                        onChange={(v) => updateItem({ descriptionOfGoods: v })}
                                    />
                                    <Field
                                        label="Type"
                                        value={item.type}
                                        placeholder={ciCargo?.type || 'Type'}
                                        onChange={(v) => updateItem({ type: v })}
                                    />
                                    <Field
                                        label="Brand"
                                        value={item.brand}
                                        placeholder={ciCargo?.brand || 'Brand'}
                                        onChange={(v) => updateItem({ brand: v })}
                                    />
                                </FieldGroup>

                                <FieldGroup>
                                    <Field
                                        label="Quantity of Goods"
                                        value={item.quantityOfGoods}
                                        placeholder={ciCargo?.quantityOfGoods || '0'}
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
                                        placeholder={ciCargo?.quantityOfPackage || bolCargo?.packages || '0'}
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
                                    <Field
                                        label="Net Weight"
                                        value={item.netWeight}
                                        onChange={(v) => updateItem({ netWeight: v })}
                                        numeric
                                    />
                                    <Field
                                        label="Gross Weight"
                                        value={item.grossWeight}
                                        placeholder={bolCargo?.grossWeight || ''}
                                        onChange={(v) => updateItem({ grossWeight: v })}
                                        numeric
                                    />
                                    <Field
                                        label="Volume / Dimension"
                                        value={item.volumeDimension}
                                        placeholder={bolCargo?.volume || ''}
                                        onChange={(v) => updateItem({ volumeDimension: v })}
                                        numeric
                                    />
                                </FieldGroup>

                                {changeWarnings[`cargoChanged_${index}`] && (
                                    <ChangeWarningAlert message={changeWarnings[`cargoChanged_${index}`]} />
                                )}
                            </>
                        );
                    }}
                />

                <PdfUploadCard file={pdf} readOnly={isReadOnly} onFileSelect={setPdf} onRemove={() => setPdf(null)} error={errors.pdf} />

                <StepNavigation onBack={goBack} onSaveContinue={handleSaveContinue} isSaving={isSaving} readOnly={isReadOnly} />
            </div>
        </>
    );
}