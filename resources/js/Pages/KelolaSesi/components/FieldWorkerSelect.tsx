import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, User, AlertCircle } from 'lucide-react';
import type { FieldWorker } from '../types';

interface FieldWorkerSelectProps {
    fieldWorkers: FieldWorker[];
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
    required?: boolean;
}

export default function FieldWorkerSelect({
    fieldWorkers = [],
    value,
    onChange,
    disabled = false,
}: FieldWorkerSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Get selected worker object by user ID
    const selectedWorker = useMemo(() => {
        return fieldWorkers.find((w) => w.id === value) || null;
    }, [fieldWorkers, value]);

    // Filter workers based on search query
    const filteredWorkers = useMemo(() => {
        if (!searchQuery.trim()) return fieldWorkers;
        const q = searchQuery.toLowerCase().trim();
        return fieldWorkers.filter(
            (w) =>
                w.name.toLowerCase().includes(q) ||
                (w.email && w.email.toLowerCase().includes(q)) ||
                (w.phone && w.phone.toLowerCase().includes(q)) ||
                (w.employee_id && w.employee_id.toLowerCase().includes(q))
        );
    }, [fieldWorkers, searchQuery]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (worker: FieldWorker) => {
        onChange(worker.id);
        setIsOpen(false);
        setSearchQuery('');
    };

    // Requirement 7: Empty state when no field worker is available
    const isEmpty = fieldWorkers.length === 0;

    if (isEmpty) {
        return (
            <div className="space-y-2">
                <div className="relative">
                    <button
                        type="button"
                        disabled={true}
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed flex items-center justify-between opacity-75"
                    >
                        <span className="truncate italic">Belum ada Petugas Lapangan yang tersedia.</span>
                        <ChevronDown size={18} className="text-slate-400 shrink-0 ml-2" />
                    </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl">
                    <AlertCircle size={15} className="shrink-0 text-amber-600" />
                    <span>Belum ada Petugas Lapangan yang tersedia.</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Combobox Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#F5B800] ${
                    isOpen ? 'border-[#F5B800] ring-2 ring-[#F5B800]' : 'border-[#E2E8F0]'
                } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-300'}`}
            >
                {selectedWorker ? (
                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold text-[#06283A] truncate">{selectedWorker.name}</span>
                        <span className="text-[11px] text-slate-500 truncate">
                            {selectedWorker.role_label || 'Field Worker'} •{' '}
                            <span className="text-emerald-600 font-medium">
                                {selectedWorker.status_label || 'Active'}
                            </span>
                            {selectedWorker.employee_id ? ` • ${selectedWorker.employee_id}` : ''}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 truncate">
                        Pilih Petugas Penanggung Jawab...
                    </span>
                )}
                <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#06283A]' : ''
                    }`}
                />
            </button>

            {/* Dropdown Menu Overlay */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 duration-100">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                        <Search size={16} className="text-slate-400 ml-2 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama petugas..."
                            className="w-full py-1.5 pr-2 bg-transparent text-xs text-[#06283A] placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                        {filteredWorkers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                                Tidak ada petugas yang sesuai dengan &quot;{searchQuery}&quot;
                            </div>
                        ) : (
                            filteredWorkers.map((worker) => {
                                const isSelected = worker.id === value;
                                return (
                                    <button
                                        key={worker.id}
                                        type="button"
                                        onClick={() => handleSelect(worker)}
                                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors hover:bg-amber-50/60 ${
                                            isSelected ? 'bg-amber-50/80 font-medium' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300/50 flex items-center justify-center text-[#06283A] font-bold text-xs shrink-0">
                                                {worker.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase() || <User size={14} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold text-[#06283A] truncate">
                                                    {worker.name}
                                                </span>
                                                <span className="text-xs text-slate-500 truncate">
                                                    {worker.role_label || 'Field Worker'} •{' '}
                                                    <span className="text-emerald-600 font-medium">
                                                        {worker.status_label || 'Active'}
                                                    </span>
                                                    {worker.employee_id ? ` • ${worker.employee_id}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <Check size={16} className="text-[#06283A] shrink-0 ml-2" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
