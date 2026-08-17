import { Plus, Trash2, Package } from 'lucide-react';

export interface UnitItem {
    unit_name: string;
    quantity: number;
}

interface UnitListInputProps {
    units: UnitItem[];
    onChange: (units: UnitItem[]) => void;
    disabled?: boolean;
}

export default function UnitListInput({ units, onChange, disabled = false }: UnitListInputProps) {
    const addUnit = () => {
        onChange([...units, { unit_name: '', quantity: 1 }]);
    };

    const removeUnit = (index: number) => {
        if (units.length <= 1) return;
        onChange(units.filter((_, i) => i !== index));
    };

    const updateUnit = (index: number, field: keyof UnitItem, value: string | number) => {
        const updated = units.map((u, i) => {
            if (i !== index) return u;
            return { ...u, [field]: value };
        });
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase text-slate-600">
                    Daftar Unit Alat Berat <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{units.length} unit</span>
            </div>

            <div className="space-y-2">
                {units.map((unit, idx) => (
                    <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50/60 border border-[#E2E8F0] rounded-xl transition-all hover:border-slate-300"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#F5B800] shrink-0 mt-0.5">
                            <Package size={16} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={unit.unit_name}
                                onChange={(e) => updateUnit(idx, 'unit_name', e.target.value)}
                                placeholder={"Nama & Model Unit (cth: Excavator CAT 320)"}
                                disabled={disabled}
                                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#06283A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="w-20 shrink-0">
                            <input
                                type="number"
                                min={1}
                                value={unit.quantity}
                                onChange={(e) => updateUnit(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={disabled}
                                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-center font-semibold text-[#06283A] focus:outline-none focus:ring-2 focus:ring-[#F5B800] transition-all disabled:opacity-50"
                            />
                            <span className="block text-[10px] text-slate-400 text-center mt-0.5">Jumlah</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeUnit(idx)}
                            disabled={disabled || units.length <= 1}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mt-0.5"
                            title="Hapus unit"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addUnit}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-[#F5B800] hover:text-[#06283A] hover:bg-amber-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={16} />
                <span>Tambah Unit</span>
            </button>
        </div>
    );
}
