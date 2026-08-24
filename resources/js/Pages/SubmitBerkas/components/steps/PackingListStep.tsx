import React, { useState } from 'react';
import { FileText, Users, Ship, Scale, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { FormSection, FieldGroup, Field } from '../FormSection';
import { RecommendedFieldHint } from '../RecommendedFieldHint';
import { PdfUploadCard } from '../PdfUploadCard';
import { CargoDetailList } from '../CargoDetailList';
import { StepNavigation } from '../StepNavigation';
import { useWizard } from '../../hooks/useWizard';
import { MOCK_PL_DATA, MOCK_PL_PDF } from '../../constants/mockData';
import type { PackingListData, PdfFile, PlCargoItem, TermOfShipment } from '../../types/SubmitBerkas';

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
                {/* Header */}
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

                {/* Body */}
                <div style={{ padding: '20px 24px' }}>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                        Perubahan terdeteksi di section berikut. Pastikan perubahan ini{' '}
                        <strong>disengaja</strong> agar tidak terjadi perbedaan data antara
                        dokumen Packing List dan {sourceLabel}.
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

function createEmptyCargoItem(): PlCargoItem {
    return {
        id: crypto.randomUUID(),
        descriptionOfGoods: '',
        quantityOfGoods: '',
        goodsUnitMeasurement: '',
        quantityOfPackage: '',
        packageUnitMeasurement: '',
        type: '',
        brand: '',
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
    const { wizardData, saveStepData, goNext, goBack } = useWizard();

    // Sumber rekomendasi: CI diprioritaskan, fallback ke BL
    const ciData = wizardData.commercialInvoice?.data ?? null;
    const bolData = wizardData.billOfLading?.data ?? null;
    const savedData = wizardData.packingList?.data;

    const [data, setData] = useState<PackingListData>(() => {
        if (savedData) return savedData;

        const base = createEmptyData();

        if (ciData) {
            base.shipper = { ...ciData.shipper };
            base.consignee = { ...ciData.consignee };
            base.transportDetail = { ...ciData.transportDetail };
            base.documentDetail.shipmentContractNumber = ciData.documentDetail.shipmentContractNumber;
            base.documentDetail.termOfShipment = ciData.documentDetail.termOfShipment;
            base.documentDetail.oceanFreightCurrency = ciData.documentDetail.oceanFreightCurrency ?? '';
            base.documentDetail.oceanFreight = ciData.documentDetail.oceanFreight ?? '';
            base.documentDetail.insuranceCurrency = ciData.documentDetail.insuranceCurrency ?? '';
            base.documentDetail.insurance = ciData.documentDetail.insurance ?? '';

            if (ciData.cargoDetail.length > 0) {
                base.cargoDetail = ciData.cargoDetail.map((ciItem) => ({
                    ...createEmptyCargoItem(),
                    descriptionOfGoods: ciItem.descriptionOfGoods,
                    quantityOfGoods: ciItem.quantityOfGoods,
                    goodsUnitMeasurement: ciItem.goodsUnitMeasurement,
                    quantityOfPackage: ciItem.quantityOfPackage,
                    packageUnitMeasurement: ciItem.packageUnitMeasurement,
                    type: ciItem.type,
                    brand: ciItem.brand,
                }));
            }
        } else if (bolData) {
            base.shipper = { ...bolData.shipper };
            base.consignee = { ...bolData.consignee };
            base.transportDetail = { ...bolData.transportDetail };
        }

        return base;
    });

    const [pdf, setPdf] = useState<PdfFile | null>(wizardData.packingList?.pdf ?? null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showChangedModal, setShowChangedModal] = useState(false);
    const [changedSections, setChangedSections] = useState<string[]>([]);

    const update = <K extends keyof PackingListData>(key: K, value: PackingListData[K]) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const updateDocDetail = (patch: Partial<PackingListData['documentDetail']>) =>
        update('documentDetail', { ...data.documentDetail, ...patch });

    const isFob = data.documentDetail.termOfShipment === 'FOB';
    const wasRecommended = !!(ciData || bolData) && !savedData;
    const recommendationSource = ciData ? 'Commercial Invoice' : 'Bill of Lading';

    const validate = (): boolean => {
        const next: Record<string, string> = {};

        // ── Validasi wajib ──
        if (!data.documentDetail.number.trim()) next.documentNumber = 'Nomor dokumen wajib diisi.';
        if (!data.shipper.name.trim()) next.shipperName = 'Nama shipper wajib diisi.';
        if (!data.consignee.name.trim()) next.consigneeName = 'Nama consignee wajib diisi.';
        if (!pdf) next.pdf = 'Dokumen PDF wajib diupload.';

        // ── Cross-Document Change Detection ──
        const changed: string[] = [];

        if (wasRecommended) {
            // Sumber perbandingan: CI (lebih lengkap) atau BL sebagai fallback
            const sourceParty = ciData ?? bolData;

            if (sourceParty) {
                // Shipper
                if (
                    data.shipper.name !== sourceParty.shipper.name ||
                    data.shipper.address !== sourceParty.shipper.address ||
                    data.shipper.taxId !== sourceParty.shipper.taxId
                ) {
                    next.shipperChanged = `Data Shipper berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Shipper');
                }

                // Consignee
                if (
                    data.consignee.name !== sourceParty.consignee.name ||
                    data.consignee.address !== sourceParty.consignee.address ||
                    data.consignee.taxId !== sourceParty.consignee.taxId
                ) {
                    next.consigneeChanged = `Data Consignee berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Consignee');
                }

                // Transport Detail
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

            // Document Detail — hanya dibandingkan jika sumber adalah CI
            if (ciData) {
                if (
                    data.documentDetail.shipmentContractNumber !== ciData.documentDetail.shipmentContractNumber ||
                    data.documentDetail.termOfShipment !== ciData.documentDetail.termOfShipment ||
                    (isFob && data.documentDetail.oceanFreight !== (ciData.documentDetail.oceanFreight ?? '')) ||
                    (isFob && data.documentDetail.insurance !== (ciData.documentDetail.insurance ?? ''))
                ) {
                    next.documentChanged = `Data Document Detail berbeda dari ${recommendationSource}. Pastikan perubahan ini disengaja.`;
                    changed.push('Document Detail');
                }

                // Cargo Detail per-item — hanya dibandingkan vs CI (struktur lebih mirip PL)
                ciData.cargoDetail.forEach((ciItem, index) => {
                    const plItem = data.cargoDetail[index];
                    if (!plItem) return;
                    if (
                        plItem.descriptionOfGoods !== ciItem.descriptionOfGoods ||
                        plItem.type !== ciItem.type ||
                        plItem.brand !== ciItem.brand ||
                        plItem.quantityOfGoods !== ciItem.quantityOfGoods ||
                        plItem.quantityOfPackage !== ciItem.quantityOfPackage
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
        saveStepData('packingList', data, pdf);
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

                    {wasRecommended && !errors.documentChanged && (
                        <RecommendedFieldHint sourceLabel={recommendationSource} />
                    )}
                    {errors.documentChanged && <ChangeWarningAlert message={errors.documentChanged} />}
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
                <CargoDetailList<PlCargoItem>
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
                                    label="Volume / Dimension"
                                    value={item.volumeDimension}
                                    onChange={(v) => updateItem({ volumeDimension: v })}
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