import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Users, Ship, AlertCircle } from 'lucide-react';
import { FormSection, FieldGroup, Field } from '../FormSection';
import { ChangedDataModal } from '../ChangedDataModal';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_COO_DATA, MOCK_COO_PDF } from '../../constants/mockData';
import type { CertificateOfOriginData, CooCargoItem, PdfFile } from '../../types/SubmitBerkas';

const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

/** ID tipe dokumen untuk Surat Keterangan Asal (SKA/COO) di database */
const DOCUMENT_TYPE_ID_COO = "4";

const selectStyle: React.CSSProperties = {
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

function createEmptyCargoItem(): CooCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        type: '',
        hsCodePol: '',
        quantityOfPackage: '',
        packageUnitMeasurement: 'Unit',
        netWeight: '',
        grossWeight: '',
        volume: '',
    };
}

function createEmptyData(): CertificateOfOriginData {
    return {
        documentDetail: {
            number: '',
            date: '',
        },
        commercialInvoiceRef: {
            number: '',
            date: '',
        },
        shipper: { name: '', address: '', taxId: '' },
        consignee: { name: '', address: '', taxId: '' },
        transportDetail: { portOfLoading: '', portOfDischarge: '', shippName: '', voyage: '' },
        cargoDetail: [createEmptyCargoItem()],
    };
}

export function CertificateOfOriginStep() {
    const { wizardData, saveStepData, goNext, goBack, assignmentNoRef, selectedCustomer, isReadOnly } = useWizard();

    const ciData = wizardData.commercialInvoice?.data ?? null;
    const bolData = wizardData.billOfLading?.data ?? null;
    const savedData = wizardData.certificateOfOrigin?.data;
    const refData = ciData || bolData;
    const recommendationSource = ciData ? 'Commercial Invoice' : 'Bill of Lading';

    const [data, setData] = useState<CertificateOfOriginData>(() => {
        if (savedData) return savedData;
        return createEmptyData();
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.certificateOfOrigin?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [changeWarnings, setChangeWarnings] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof CertificateOfOriginData>(key: K, value: CertificateOfOriginData[K]) => {
        if (isReadOnly) return;
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateDocDetail = (patch: Partial<CertificateOfOriginData['documentDetail']>) => {
        if (isReadOnly) return;
        update('documentDetail', { ...data.documentDetail, ...patch });
    };

    const updateInvoiceRef = (patch: Partial<CertificateOfOriginData['commercialInvoiceRef']>) => {
        if (isReadOnly) return;
        update('commercialInvoiceRef', { ...data.commercialInvoiceRef, ...patch });
    };

    const validate = (): boolean => {
        const next: Record<string, string> = {};

        if (!data.documentDetail.number.trim()) next.documentNumber = 'COO number is required.';
        if (!data.shipper.name.trim()) next.shipperName = 'Exporter name is required.';
        if (!data.consignee.name.trim()) next.consigneeName = 'Importer name is required.';
        if (!pdf) next.pdf = 'PDF document is required.';
        if (!selectedCustomer?.id) next.general = 'Customer must be selected first.';
        if (!assignmentNoRef) next.general = 'Assignment Reference tidak ditemukan.';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const detectChanges = (): string[] => {
        const changed: string[] = [];
        const warnings: Record<string, string> = {};

        if (refData) {
            if (ciData) {
                if (
                    (data.commercialInvoiceRef.number && data.commercialInvoiceRef.number !== ciData.documentDetail?.number) ||
                    (data.commercialInvoiceRef.date && data.commercialInvoiceRef.date !== ciData.documentDetail?.date)
                ) {
                    warnings.invoiceRefChanged = 'Referensi Invoice berbeda dari Commercial Invoice.';
                    changed.push('Referensi Invoice');
                }
            }

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
                ciData.cargoDetail?.forEach((ciItem, index) => {
                    const cooItem = data.cargoDetail[index];
                    if (!cooItem) return;
                    if (
                        (cooItem.descriptionOfGoods && cooItem.descriptionOfGoods !== ciItem.descriptionOfGoods) ||
                        (cooItem.quantityOfPackage && cooItem.quantityOfPackage !== ciItem.quantityOfPackage) ||
                        (cooItem.hsCodePol && cooItem.hsCodePol !== ciItem.hsCodePol)
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
            await axios.post('/submit-berkas/step', {
                assignment_no_ref: assignmentNoRef,
                customer_id: selectedCustomer?.id,
                document_type_id: DOCUMENT_TYPE_ID_COO,
                document_data: data,
                file_name: pdf?.name ?? null,
                file_path: pdf?.url ?? null,
            });

            saveStepData('certificateOfOrigin', data, pdf);
            goNext();
        } catch (error: any) {
            console.error('Gagal menyimpan step Certificate of Origin:', error);
            setErrors((prev) => ({
                ...prev,
                general: error.response?.data?.message || 'Failed to save data to server. Please try again.',
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
                        setData(MOCK_COO_DATA);
                        setPdf(MOCK_COO_PDF);
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
                            label="COO / SKA Number"
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
                </FormSection>

                {/* Commercial Invoice Reference */}
                <FormSection title="Commercial Invoice Reference" icon={<FileText size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Invoice Number"
                            value={data.commercialInvoiceRef.number}
                            placeholder={ciData?.documentDetail?.number || 'Nomor Commercial Invoice'}
                            onChange={(v) => updateInvoiceRef({ number: v })}
                        />
                        <Field
                            label="Invoice Date"
                            type="date"
                            value={data.commercialInvoiceRef.date}
                            onChange={(v) => updateInvoiceRef({ date: v })}
                        />
                    </FieldGroup>
                    {changeWarnings.invoiceRefChanged && <ChangeWarningAlert message={changeWarnings.invoiceRefChanged} />}
                </FormSection>

                {/* Shipper / Exporter */}
                <FormSection title="Shipper / Exporter" icon={<Users size={17} />}>
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

                {/* Consignee / Importer */}
                <FormSection title="Consignee / Importer" icon={<Users size={17} />}>
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
                <CargoDetailList<CooCargoItem>
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
                                        label="HS Code POL"
                                        value={item.hsCodePol}
                                        placeholder={ciCargo?.hsCodePol || bolCargo?.hsCodePol || 'HS Code POL'}
                                        onChange={(v) => updateItem({ hsCodePol: v })}
                                    />
                                </FieldGroup>

                                <FieldGroup>
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
                                            style={selectStyle}
                                        >
                                            <option value="">Select Unit</option>
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
                                        label="Volume"
                                        value={item.volume}
                                        placeholder={bolCargo?.volume || ''}
                                        onChange={(v) => updateItem({ volume: v })}
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