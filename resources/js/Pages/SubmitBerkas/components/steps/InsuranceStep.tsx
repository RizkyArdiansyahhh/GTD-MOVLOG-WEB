import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Ship, Package, ShieldCheck, AlertCircle } from 'lucide-react';
import { FormSection, FieldGroup, Field, FieldWithUnit } from '../FormSection';
import { ChangedDataModal } from '../ChangedDataModal';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_INSURANCE_DATA, MOCK_INSURANCE_PDF } from '../../constants/mockData';
import type { InsuranceCargoItem, InsuranceData, PdfFile } from '../../types/SubmitBerkas';

const WEIGHT_UNITS = ['kg', 'ton'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];
const VOLUME_UNITS = ['m³', 'ft³'];

/** ID tipe dokumen untuk Asuransi di database */
const DOCUMENT_TYPE_ID_INSURANCE = "5";

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

function createEmptyCargoItem(): InsuranceCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        hsCodePol: '',
    };
}

function createEmptyData(): InsuranceData {
    return {
        documentDetail: {
            number: '',
            date: '',
        },
        documentReference: {
            commercialInvoiceNumber: '',
            billOfLadingNumber: '',
            shipmentContractNumber: '',
        },
        transportDetail: {
            portOfLoading: '',
            portOfDischarge: '',
            shippName: '',
            voyage: '',
        },
        cargoDetail: [createEmptyCargoItem()],
        quantity: {
            totalGrossWeight: '',
            totalGrossWeightUnit: 'kg',
            totalPackages: '',
            totalPackagesUnit: 'Unit',
            totalVolume: '',
            totalVolumeUnit: 'm³',
        },
        insurance: {
            amountInsured: '',
        },
    };
}

export function InsuranceStep() {
    const { wizardData, saveStepData, goNext, goBack, assignmentNoRef, selectedCustomer, isReadOnly } = useWizard();

    const bolData = wizardData.billOfLading?.data ?? null;
    const ciData = wizardData.commercialInvoice?.data ?? null;
    const savedData = wizardData.insurance?.data;

    const [data, setData] = useState<InsuranceData>(() => {
        if (savedData) return { ...createEmptyData(), ...savedData, documentDetail: savedData.documentDetail || { number: '', date: '' } };
        return createEmptyData();
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.insurance?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [changeWarnings, setChangeWarnings] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof InsuranceData>(key: K, value: InsuranceData[K]) => {
        if (isReadOnly) return;
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateDocDetail = (patch: Partial<InsuranceData['documentDetail']>) => {
        if (isReadOnly) return;
        update('documentDetail', { ...(data.documentDetail || { number: '', date: '' }), ...patch });
    };

    const validate = (): boolean => {
        const next: Record<string, string> = {};

        if (!data.documentDetail?.number?.trim()) next.documentNumber = 'Nomor sertifikat/polis asuransi wajib diisi.';
        if (!data.documentReference.commercialInvoiceNumber.trim()) next.ciNumber = 'Nomor Commercial Invoice wajib diisi.';
        if (!data.documentReference.billOfLadingNumber.trim()) next.bolNumber = 'Nomor Bill of Lading wajib diisi.';
        if (!data.insurance.amountInsured.trim()) next.amountInsured = 'Nilai pertanggungan wajib diisi.';
        if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';
        if (!selectedCustomer?.id) next.general = 'Customer wajib dipilih terlebih dahulu.';
        if (!assignmentNoRef) next.general = 'Assignment Reference tidak ditemukan.';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const detectChanges = (): string[] => {
        const changed: string[] = [];
        const warnings: Record<string, string> = {};

        if (bolData || ciData) {
            const ciNum = ciData?.documentDetail?.number;
            const bolNum = bolData?.documentDetail?.number;
            const contractNum = ciData?.documentDetail?.shipmentContractNumber;

            if (
                (ciNum && data.documentReference.commercialInvoiceNumber && data.documentReference.commercialInvoiceNumber !== ciNum) ||
                (bolNum && data.documentReference.billOfLadingNumber && data.documentReference.billOfLadingNumber !== bolNum) ||
                (contractNum && data.documentReference.shipmentContractNumber && data.documentReference.shipmentContractNumber !== contractNum)
            ) {
                warnings.docRefChanged = 'Nomor referensi dokumen berbeda dari Commercial Invoice atau Bill of Lading.';
                changed.push('Document Reference');
            }

            const refTransport = bolData?.transportDetail || ciData?.transportDetail;
            if (refTransport) {
                if (
                    (data.transportDetail.portOfLoading && data.transportDetail.portOfLoading !== refTransport.portOfLoading) ||
                    (data.transportDetail.portOfDischarge && data.transportDetail.portOfDischarge !== refTransport.portOfDischarge) ||
                    (data.transportDetail.shippName && data.transportDetail.shippName !== refTransport.shippName) ||
                    (data.transportDetail.voyage && data.transportDetail.voyage !== refTransport.voyage)
                ) {
                    warnings.transportChanged = 'Data Transport Detail berbeda dari Bill of Lading / CI.';
                    changed.push('Transport Detail');
                }
            }

            if (bolData?.cargoDetail) {
                bolData.cargoDetail.forEach((bolItem, index) => {
                    const insItem = data.cargoDetail[index];
                    if (!insItem) return;
                    if (
                        (insItem.descriptionOfGoods && insItem.descriptionOfGoods !== bolItem.descriptionOfGoods) ||
                        (insItem.hsCodePol && insItem.hsCodePol !== bolItem.hsCodePol)
                    ) {
                        warnings[`cargoChanged_${index}`] =
                            `Item ke-${index + 1}: Description of Goods atau HS Code POL berbeda dari Bill of Lading.`;
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
      formData.append('document_type_id', '5');
      formData.append('document_data', JSON.stringify(data));
      const fName = pdf?.name ?? null;
      if (fName) formData.append('file_name', fName);
      const fPath = pdf?.url ?? null;
      if (fPath) formData.append('file_path', fPath);
      if (pdf?.file) formData.append('pdf', pdf.file);
      await axios.post('/submit-berkas/step', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

            saveStepData('insurance', data, pdf);
            goNext();
        } catch (error: any) {
            console.error('Gagal menyimpan step Insurance:', error);
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
                    sourceLabel="Commercial Invoice & Bill of Lading"
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
                        setData({ ...MOCK_INSURANCE_DATA });
                        setPdf(MOCK_INSURANCE_PDF);
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
                            label="Insurance Number"
                            value={data.documentDetail?.number || ''}
                            onChange={(v) => updateDocDetail({ number: v })}
                            error={errors.documentNumber}
                        />
                        <Field
                            label="Insurance Date"
                            type="date"
                            value={data.documentDetail?.date || ''}
                            onChange={(v) => updateDocDetail({ date: v })}
                        />
                    </FieldGroup>
                </FormSection>

                {/* Document Reference */}
                <FormSection title="Document Reference" icon={<FileText size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Commercial Invoice Number"
                            value={data.documentReference.commercialInvoiceNumber}
                            placeholder={ciData?.documentDetail?.number || 'Nomor Commercial Invoice'}
                            onChange={(v) =>
                                update('documentReference', { ...data.documentReference, commercialInvoiceNumber: v })
                            }
                            error={errors.ciNumber}
                        />
                        <Field
                            label="Bill of Lading Number"
                            value={data.documentReference.billOfLadingNumber}
                            placeholder={bolData?.documentDetail?.number || 'Nomor Bill of Lading'}
                            onChange={(v) =>
                                update('documentReference', { ...data.documentReference, billOfLadingNumber: v })
                            }
                            error={errors.bolNumber}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Field
                            label="Shipment Contract Number"
                            value={data.documentReference.shipmentContractNumber}
                            placeholder={ciData?.documentDetail?.shipmentContractNumber || 'Nomor Kontrak Penjualan'}
                            onChange={(v) =>
                                update('documentReference', { ...data.documentReference, shipmentContractNumber: v })
                            }
                        />
                    </FieldGroup>
                    {changeWarnings.docRefChanged && <ChangeWarningAlert message={changeWarnings.docRefChanged} />}
                </FormSection>

                {/* Transport Detail */}
                <FormSection title="Transport Detail" icon={<Ship size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Port of Loading"
                            value={data.transportDetail.portOfLoading}
                            placeholder={bolData?.transportDetail?.portOfLoading || ciData?.transportDetail?.portOfLoading || 'Port of Loading'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfLoading: v })}
                        />
                        <Field
                            label="Port of Discharge"
                            value={data.transportDetail.portOfDischarge}
                            placeholder={bolData?.transportDetail?.portOfDischarge || ciData?.transportDetail?.portOfDischarge || 'Port of Discharge'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, portOfDischarge: v })}
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <Field
                            label="Shipp Name"
                            value={data.transportDetail.shippName}
                            placeholder={bolData?.transportDetail?.shippName || ciData?.transportDetail?.shippName || 'Shipp Name'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, shippName: v })}
                        />
                        <Field
                            label="Voyage"
                            value={data.transportDetail.voyage}
                            placeholder={bolData?.transportDetail?.voyage || ciData?.transportDetail?.voyage || 'Voyage'}
                            onChange={(v) => update('transportDetail', { ...data.transportDetail, voyage: v })}
                        />
                    </FieldGroup>
                    {changeWarnings.transportChanged && <ChangeWarningAlert message={changeWarnings.transportChanged} />}
                </FormSection>

                {/* Cargo Detail */}
                <CargoDetailList<InsuranceCargoItem>
                    title="Cargo Detail"
                    readOnly={isReadOnly}
                    items={data.cargoDetail}
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
                                        placeholder={bolCargo?.descriptionOfGoods || 'Description of Goods'}
                                        onChange={(v) => updateItem({ descriptionOfGoods: v })}
                                    />
                                    <Field
                                        label="HS Code POL"
                                        value={item.hsCodePol}
                                        placeholder={bolCargo?.hsCodePol || 'HS Code POL'}
                                        onChange={(v) => updateItem({ hsCodePol: v })}
                                    />
                                </FieldGroup>

                                {changeWarnings[`cargoChanged_${index}`] && (
                                    <ChangeWarningAlert message={changeWarnings[`cargoChanged_${index}`]} />
                                )}
                            </>
                        );
                    }}
                />

                {/* Quantity */}
                <FormSection title="Quantity" icon={<Package size={17} />}>
                    <FieldGroup>
                        <FieldWithUnit
                            label="Total Gross Weight"
                            value={data.quantity.totalGrossWeight}
                            unit={data.quantity.totalGrossWeightUnit}
                            unitOptions={WEIGHT_UNITS}
                            onUnitChange={(unit) => update('quantity', { ...data.quantity, totalGrossWeightUnit: unit })}
                        />
                        <FieldWithUnit
                            label="Total Packages"
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

                {/* Insurance */}
                <FormSection title="Insurance" icon={<ShieldCheck size={17} />}>
                    <FieldGroup>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <Field
                                label="Amount Insured"
                                value={data.insurance.amountInsured}
                                placeholder={ciData?.documentDetail?.termOfShipment === 'FOB' ? (ciData?.documentDetail?.insurance || '0.00') : '0.00'}
                                onChange={(v) => update('insurance', { amountInsured: v })}
                                error={errors.amountInsured}
                                numeric
                            />
                        </div>
                    </FieldGroup>
                </FormSection>

                <PdfUploadCard file={pdf} readOnly={isReadOnly} onFileSelect={setPdf} onRemove={() => setPdf(null)} error={errors.pdf} />

                <StepNavigation onBack={goBack} onSaveContinue={handleSaveContinue} isSaving={isSaving} readOnly={isReadOnly} />
            </div>
        </>
    );
}