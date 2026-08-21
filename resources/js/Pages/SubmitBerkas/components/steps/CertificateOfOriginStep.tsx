import React, { useState } from 'react';
import { FileText, Users, Ship, Award, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { FormSection, FieldGroup, Field } from '../FormSection';
import { RecommendedFieldHint } from '../RecommendedFieldHint';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_COO_DATA, MOCK_COO_PDF } from '../../Constants/Mockdata';
import type { CertificateOfOriginData, CooCargoItem, PdfFile } from '../../types/submitBerkas';

const PACKAGE_UNITS = ['Unit', 'Pcs', 'Box', 'Pallet'];

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

/* ── Inline warning di bawah section yang berubah ── */
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
    sourceLabel: string;
    onClose: () => void;
}

function ChangedDataModal({ sections, sourceLabel, onClose }: ChangedDataModalProps) {
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
                                Data berikut berbeda dari {sourceLabel}
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
                        dokumen Certificate of Origin dan {sourceLabel}.
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

function createEmptyCargoItem(): CooCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        quantityOfPackage: '',
        packageUnitMeasurement: '',
        type: '',
        hsCodePol: '',
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
        shipper: { name: '', address: '', taxId: '' },
        consignee: { name: '', address: '', taxId: '' },
        transportDetail: { portOfLoading: '', portOfDischarge: '', shippName: '', voyage: '' },
        cargoDetail: [createEmptyCargoItem()],
        commercialInvoiceRef: {
            number: '',
            date: '',
        },
    };
}

export function CertificateOfOriginStep() {
    const { wizardData, saveStepData, goNext, goBack } = useWizard();

    // Sumber rekomendasi: CI diprioritaskan (karena butuh commercialInvoiceRef), fallback ke BL
    const ciData = wizardData.commercialInvoice?.data ?? null;
    const bolData = wizardData.billOfLading?.data ?? null;
    const savedData = wizardData.certificateOfOrigin?.data;

    const [data, setData] = useState<CertificateOfOriginData>(() => {
        if (savedData) return savedData;

        const base = createEmptyData();

        if (ciData) {
            base.shipper = { ...ciData.shipper };
            base.consignee = { ...ciData.consignee };
            base.transportDetail = { ...ciData.transportDetail };
            base.commercialInvoiceRef = {
                number: ciData.documentDetail.number,
                date: ciData.documentDetail.date,
            };

            if (ciData.cargoDetail.length > 0) {
                base.cargoDetail = ciData.cargoDetail.map((ciItem) => ({
                    ...createEmptyCargoItem(),
                    descriptionOfGoods: ciItem.descriptionOfGoods,
                    quantityOfPackage: ciItem.quantityOfPackage,
                    packageUnitMeasurement: ciItem.packageUnitMeasurement,
                    type: ciItem.type,
                    hsCodePol: ciItem.hsCodePol,
                }));
            }
        } else if (bolData) {
            base.shipper = { ...bolData.shipper };
            base.consignee = { ...bolData.consignee };
            base.transportDetail = { ...bolData.transportDetail };

            if (bolData.cargoDetail.length > 0) {
                base.cargoDetail = bolData.cargoDetail.map((bolItem) => ({
                    ...createEmptyCargoItem(),
                    descriptionOfGoods: bolItem.descriptionOfGoods,
                    hsCodePol: bolItem.hsCodePol,
                    grossWeight: bolItem.grossWeight,
                    packageUnitMeasurement: 'Unit',
                    quantityOfPackage: bolItem.packages,
                }));
            }
        }

        return base;
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.certificateOfOrigin?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof CertificateOfOriginData>(key: K, value: CertificateOfOriginData[K]) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const updateDocDetail = (patch: Partial<CertificateOfOriginData['documentDetail']>) =>
        update('documentDetail', { ...data.documentDetail, ...patch });

    const wasRecommended = !!(ciData || bolData) && !savedData;
    const recommendationSource = ciData ? 'Commercial Invoice' : 'Bill of Lading';

    const validate = (): boolean => {
        const next: Record<string, string> = {};

        // ── Validasi wajib ──
        if (!data.documentDetail.number.trim()) next.documentNumber = 'Nomor dokumen wajib diisi.';
        if (!data.shipper.name.trim()) next.shipperName = 'Nama shipper wajib diisi.';
        if (!data.consignee.name.trim()) next.consigneeName = 'Nama consignee wajib diisi.';
        if (ciData && !data.commercialInvoiceRef.number.trim()) {
            next.ciRefNumber = 'Nomor referensi Commercial Invoice wajib diisi.';
        }
        if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';

        // ── Cross-Document Change Detection ──
        const changed: string[] = [];

        if (wasRecommended) {
            const sourceParty = ciData ?? bolData;

            if (sourceParty) {
                if (
                    data.shipper.name !== sourceParty.shipper.name ||
                    data.shipper.address !== sourceParty.shipper.address ||
                    data.shipper.taxId !== sourceParty.shipper.taxId
                ) {
                    next.shipperChanged = `Data Shipper berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Shipper');
                }

                if (
                    data.consignee.name !== sourceParty.consignee.name ||
                    data.consignee.address !== sourceParty.consignee.address ||
                    data.consignee.taxId !== sourceParty.consignee.taxId
                ) {
                    next.consigneeChanged = `Data Consignee berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Consignee');
                }

                if (
                    data.transportDetail.portOfLoading !== sourceParty.transportDetail.portOfLoading ||
                    data.transportDetail.portOfDischarge !== sourceParty.transportDetail.portOfDischarge ||
                    data.transportDetail.shippName !== sourceParty.transportDetail.shippName ||
                    data.transportDetail.voyage !== sourceParty.transportDetail.voyage
                ) {
                    next.transportChanged = `Data Transport Detail berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Transport Detail');
                }
            }

            // Referensi CI & Cargo Detail — hanya dibandingkan jika sumber adalah CI
            if (ciData) {
                if (
                    data.commercialInvoiceRef.number !== ciData.documentDetail.number ||
                    data.commercialInvoiceRef.date !== ciData.documentDetail.date
                ) {
                    next.ciRefChanged = `Referensi Commercial Invoice berbeda dari dokumen aslinya. Pastikan perubahan ini disengaja.`;
                    changed.push('Commercial Invoice Reference');
                }

                ciData.cargoDetail.forEach((ciItem, index) => {
                    const cooItem = data.cargoDetail[index];
                    if (!cooItem) return;
                    if (
                        cooItem.descriptionOfGoods !== ciItem.descriptionOfGoods ||
                        cooItem.type !== ciItem.type ||
                        cooItem.hsCodePol !== ciItem.hsCodePol ||
                        cooItem.quantityOfPackage !== ciItem.quantityOfPackage
                    ) {
                        next[`cargoChanged_${index}`] =
                            `Item ke-${index + 1}: Data berbeda dari ${recommendationSource}.`;
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        saveStepData('certificateOfOrigin', data, pdf);
        setIsSaving(false);
        goNext();
    };

    return (
        <>
            {showChangedModal && (
                <ChangedDataModal
                    sections={changedSections}
                    sourceLabel={recommendationSource}
                    onClose={() => setShowChangedModal(false)}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                    </FieldGroup>
                </FormSection>

                {/* Commercial Invoice Reference */}
                <FormSection title="Commercial Invoice Reference" icon={<FileText size={17} />}>
                    <FieldGroup>
                        <Field
                            label="CI Number"
                            value={data.commercialInvoiceRef.number}
                            onChange={(v) => update('commercialInvoiceRef', { ...data.commercialInvoiceRef, number: v })}
                            error={errors.ciRefNumber}
                        />
                        <Field
                            label="CI Date"
                            type="date"
                            value={data.commercialInvoiceRef.date}
                            onChange={(v) => update('commercialInvoiceRef', { ...data.commercialInvoiceRef, date: v })}
                        />
                    </FieldGroup>
                    {ciData && !errors.ciRefChanged && (
                        <RecommendedFieldHint sourceLabel="Commercial Invoice" />
                    )}
                    {errors.ciRefChanged && <ChangeWarningAlert message={errors.ciRefChanged} />}
                </FormSection>

                {/* Shipper */}
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
                        <RecommendedFieldHint sourceLabel={recommendationSource} />
                    )}
                    {errors.shipperChanged && <ChangeWarningAlert message={errors.shipperChanged} />}
                </FormSection>

                {/* Consignee */}
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
                        <RecommendedFieldHint sourceLabel={recommendationSource} />
                    )}
                    {errors.consigneeChanged && <ChangeWarningAlert message={errors.consigneeChanged} />}
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
                        <RecommendedFieldHint sourceLabel={recommendationSource} />
                    )}
                    {errors.transportChanged && <ChangeWarningAlert message={errors.transportChanged} />}
                </FormSection>

                {/* Cargo Detail */}
                <CargoDetailList<CooCargoItem>
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
                                <Field label="HS Code POL" value={item.hsCodePol} onChange={(v) => updateItem({ hsCodePol: v })} />
                            </FieldGroup>

                            <FieldGroup>
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
                                        style={selectStyle}
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
                                    onChange={(v) => updateItem({ grossWeight: v })}
                                    numeric
                                />
                                <Field
                                    label="Volume"
                                    value={item.volume}
                                    onChange={(v) => updateItem({ volume: v })}
                                    numeric
                                />
                            </FieldGroup>

                            {wasRecommended && !errors[`cargoChanged_${index}`] && (
                                <RecommendedFieldHint sourceLabel={recommendationSource} />
                            )}
                            {errors[`cargoChanged_${index}`] && (
                                <ChangeWarningAlert message={errors[`cargoChanged_${index}`]} />
                            )}
                        </>
                    )}
                />

                <PdfUploadCard file={pdf} onFileSelect={setPdf} onRemove={() => setPdf(null)} error={errors.pdf} />

                <StepNavigation onBack={goBack} onSaveContinue={handleSaveContinue} isSaving={isSaving} />
            </div>
        </>
    );
}