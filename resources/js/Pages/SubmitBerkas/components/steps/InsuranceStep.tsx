import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Ship, Package, ShieldCheck, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { FormSection, FieldGroup, Field, FieldWithUnit } from '../FormSection';
import { RecommendedFieldHint } from '../RecommendedFieldHint';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_INSURANCE_DATA, MOCK_INSURANCE_PDF } from '../../constants/mockData';
import type { InsuranceCargoItem, InsuranceData, PdfFile } from '../../types/SubmitBerkas';

const WEIGHT_UNITS = ['kg', 'ton'];
const VOLUME_UNITS = ['m³', 'cbm'];
const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

const DOCUMENT_TYPE_ID_INSURANCE = '5';

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

/* ── Modal peringatan perubahan data ── */
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
                        dokumen Insurance dan Bill of Lading.
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

/* ─────────────────────────────────────────── */

function createEmptyCargoItem(): InsuranceCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        hsCodePol: '',
    };
}

function createEmptyData(): InsuranceData {
    return {
        documentReference: {
            commercialInvoiceNumber: '',
            billOfLadingNumber: '',
            shipmentContractNumber: '',
        },
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
        insurance: {
            amountInsured: '',
        },
    };
}

export function InsuranceStep() {
    const { wizardData, saveStepData, goNext, goBack, assignmentNoRef, selectedCustomer } = useWizard();

    const bolData = wizardData.billOfLading?.data ?? null;
    const ciData = wizardData.commercialInvoice?.data ?? null;
    const savedData = wizardData.insurance?.data;

    const [data, setData] = useState<InsuranceData>(() => {
        if (savedData) return savedData;

        const base = createEmptyData();

        base.documentReference.commercialInvoiceNumber = ciData?.documentDetail.number ?? '';
        base.documentReference.billOfLadingNumber = bolData?.documentDetail.number ?? '';
        base.documentReference.shipmentContractNumber = ciData?.documentDetail.shipmentContractNumber ?? '';

        if (bolData) {
            base.transportDetail = { ...bolData.transportDetail };
            base.quantity = { ...bolData.quantity };

            if (bolData.cargoDetail.length > 0) {
                base.cargoDetail = bolData.cargoDetail.map((bolItem) => ({
                    ...createEmptyCargoItem(),
                    descriptionOfGoods: bolItem.descriptionOfGoods,
                    hsCodePol: bolItem.hsCodePol,
                }));
            }
        } else if (ciData) {
            base.transportDetail = { ...ciData.transportDetail };
        }

        if (ciData?.documentDetail.termOfShipment === 'FOB') {
            base.insurance.amountInsured = ciData.documentDetail.insurance ?? '';
        }

        return base;
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.insurance?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof InsuranceData>(key: K, value: InsuranceData[K]) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const wasRecommended = !!(bolData || ciData) && !savedData;

    const validate = (): boolean => {
        const next: Record<string, string> = {};

        // ── Validasi wajib ──
        if (!data.documentReference.commercialInvoiceNumber.trim()) {
            next.ciNumber = 'Nomor Commercial Invoice wajib diisi.';
        }
        if (!data.documentReference.billOfLadingNumber.trim()) {
            next.bolNumber = 'Nomor Bill of Lading wajib diisi.';
        }
        if (!data.insurance.amountInsured.trim()) {
            next.amountInsured = 'Jumlah pertanggungan (amount insured) wajib diisi.';
        }
        if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';
        if (!selectedCustomer?.id) next.general = 'Customer wajib dipilih terlebih dahulu.';
        if (!assignmentNoRef) next.general = 'Assignment Reference tidak ditemukan.';

        // ── Cross-Document Change Detection ──
        const changed: string[] = [];

        if (wasRecommended) {
            // Document Reference — dibandingkan dengan nomor asli CI & BOL
            if (
                (ciData && data.documentReference.commercialInvoiceNumber !== ciData.documentDetail.number) ||
                (bolData && data.documentReference.billOfLadingNumber !== bolData.documentDetail.number) ||
                (ciData &&
                    data.documentReference.shipmentContractNumber !== ciData.documentDetail.shipmentContractNumber)
            ) {
                next.docRefChanged = 'Data Document Reference berbeda dari Commercial Invoice / Bill of Lading. Pastikan perubahan ini disengaja.';
                changed.push('Document Reference');
            }

            // Transport Detail — dibandingkan dengan BOL
            if (bolData) {
                if (
                    data.transportDetail.portOfLoading !== bolData.transportDetail.portOfLoading ||
                    data.transportDetail.portOfDischarge !== bolData.transportDetail.portOfDischarge ||
                    data.transportDetail.shippName !== bolData.transportDetail.shippName ||
                    data.transportDetail.voyage !== bolData.transportDetail.voyage
                ) {
                    next.transportChanged = 'Data Transport Detail berbeda dari Bill of Lading. Pastikan perubahan ini disengaja.';
                    changed.push('Transport Detail');
                }

                // Quantity — dibandingkan dengan BOL
                if (
                    data.quantity.totalGrossWeight !== bolData.quantity.totalGrossWeight ||
                    data.quantity.totalPackages !== bolData.quantity.totalPackages ||
                    data.quantity.totalVolume !== bolData.quantity.totalVolume
                ) {
                    next.quantityChanged = 'Data Quantity berbeda dari Bill of Lading. Pastikan perubahan ini disengaja.';
                    changed.push('Quantity');
                }

                // Cargo Detail per-item — dibandingkan dengan BOL
                bolData.cargoDetail.forEach((bolItem, index) => {
                    const insItem = data.cargoDetail[index];
                    if (!insItem) return;
                    if (
                        insItem.descriptionOfGoods !== bolItem.descriptionOfGoods ||
                        insItem.hsCodePol !== bolItem.hsCodePol
                    ) {
                        next[`cargoChanged_${index}`] =
                            `Item ke-${index + 1}: Description of Goods atau HS Code POL berbeda dari Bill of Lading.`;
                        changed.push(`Cargo Detail — Item ke-${index + 1}`);
                    }
                });
            }

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

        try {
            // 1. Kirim data ke API backend per-step (POST /submit-berkas/step)
            await axios.post('/submit-berkas/step', {
                assignment_no_ref: assignmentNoRef,
                customer_id: selectedCustomer?.id,
                document_type_id: DOCUMENT_TYPE_ID_INSURANCE,
                document_data: data,
                file_name: pdf?.name ?? null,
                file_path: pdf?.url ?? null,
            });

            // 2. Simpan di React state local via WizardContext
            saveStepData('insurance', data, pdf);

            // 3. Lanjut ke step berikutnya (PreviewPibStep)
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

    return (
        <>
            {showChangedModal && (
                <ChangedDataModal sections={changedSections} onClose={() => setShowChangedModal(false)} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {errors.general && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontSize: 13 }}>
                        {errors.general}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setData(MOCK_INSURANCE_DATA);
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

                {/* Document Reference */}
                <FormSection title="Document Reference" icon={<FileText size={17} />}>
                    <FieldGroup>
                        <Field
                            label="Commercial Invoice Number"
                            value={data.documentReference.commercialInvoiceNumber}
                            onChange={(v) =>
                                update('documentReference', { ...data.documentReference, commercialInvoiceNumber: v })
                            }
                            error={errors.ciNumber}
                        />
                        <Field
                            label="Bill of Lading Number"
                            value={data.documentReference.billOfLadingNumber}
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
                            onChange={(v) =>
                                update('documentReference', { ...data.documentReference, shipmentContractNumber: v })
                            }
                        />
                    </FieldGroup>
                    {wasRecommended && !errors.docRefChanged && (
                        <RecommendedFieldHint sourceLabel="Commercial Invoice & Bill of Lading" />
                    )}
                    {errors.docRefChanged && <ChangeWarningAlert message={errors.docRefChanged} />}
                </FormSection>

                {/* Transport Detail */}
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

                {/* Cargo Detail */}
                <CargoDetailList<InsuranceCargoItem>
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
                                <Field
                                    label="HS Code POL"
                                    value={item.hsCodePol}
                                    onChange={(v) => updateItem({ hsCodePol: v })}
                                />
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
                    {wasRecommended && !errors.quantityChanged && (
                        <RecommendedFieldHint sourceLabel="Bill of Lading" />
                    )}
                    {errors.quantityChanged && <ChangeWarningAlert message={errors.quantityChanged} />}
                </FormSection>

                {/* Insurance */}
                <FormSection title="Insurance" icon={<ShieldCheck size={17} />}>
                    <FieldGroup>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <Field
                                label="Amount Insured"
                                value={data.insurance.amountInsured}
                                onChange={(v) => update('insurance', { amountInsured: v })}
                                error={errors.amountInsured}
                                numeric
                            />
                        </div>
                    </FieldGroup>
                </FormSection>

                <PdfUploadCard file={pdf} onFileSelect={setPdf} onRemove={() => setPdf(null)} error={errors.pdf} />

                <StepNavigation onBack={goBack} onSaveContinue={handleSaveContinue} isSaving={isSaving} />
            </div>
        </>
    );
}