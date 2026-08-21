import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X, User, Users } from 'lucide-react';
import type { FieldWorker } from '../types';

interface WorkerMultiSelectProps {
    fieldWorkers?: FieldWorker[];
    workers?: FieldWorker[];
    value: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function WorkerMultiSelect({
    fieldWorkers = [],
    workers = [],
    value = [],
    onChange,
    disabled = false,
    placeholder = 'Pilih worker...',
}: WorkerMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const availableWorkers = useMemo(() => {
        if (Array.isArray(fieldWorkers) && fieldWorkers.length > 0) return fieldWorkers;
        if (Array.isArray(workers) && workers.length > 0) return workers;
        return [];
    }, [fieldWorkers, workers]);

    const selectedWorkers = useMemo(() => {
        return availableWorkers.filter((w) => value.includes(w.id));
    }, [availableWorkers, value]);

    const filteredWorkers = useMemo(() => {
        if (!searchQuery.trim()) return availableWorkers;
        const q = searchQuery.toLowerCase().trim();
        return availableWorkers.filter(
            (w) =>
                w.name.toLowerCase().includes(q) ||
                (w.email && w.email.toLowerCase().includes(q))
        );
    }, [availableWorkers, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const toggleWorker = (workerId: string) => {
        if (value.includes(workerId)) {
            onChange(value.filter((id) => id !== workerId));
        } else {
            onChange([...value, workerId]);
        }
    };

    const removeWorker = (workerId: string) => {
        onChange(value.filter((id) => id !== workerId));
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#F5B800] ${
                    isOpen ? 'border-[#F5B800] ring-2 ring-[#F5B800]' : 'border-[#E2E8F0]'
                } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-300'}`}
            >
                {selectedWorkers.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 pr-2">
                        <Users size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[#06283A] font-medium">
                            {selectedWorkers.length} worker dipilih
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-400 truncate">{placeholder}</span>
                )}
                <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#06283A]' : ''
                    }`}
                />
            </button>

            {/* Selected chips */}
            {selectedWorkers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedWorkers.map((w) => (
                        <span
                            key={w.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-xs font-medium text-[#06283A]"
                        >
                            {w.name}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeWorker(w.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                        <Search size={16} className="text-slate-400 ml-2 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari worker..."
                            className="w-full py-1.5 pr-2 bg-transparent text-xs text-[#06283A] placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                        {filteredWorkers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                                Tidak ada worker yang sesuai
                            </div>
                        ) : (
                            filteredWorkers.map((worker) => {
                                const isSelected = value.includes(worker.id);
                                return (
                                    <button
                                        key={worker.id}
                                        type="button"
                                        onClick={() => toggleWorker(worker.id)}
                                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors hover:bg-amber-50/60 ${
                                            isSelected ? 'bg-amber-50/80' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300/50 flex items-center justify-center text-[#06283A] font-bold text-[10px] shrink-0">
                                                {worker.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase() || <User size={12} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-[#06283A] truncate">
                                                    {worker.name}
                                                </span>
                                                {worker.email && (
                                                    <span className="text-[11px] text-slate-500 truncate">
                                                        {worker.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded bg-[#F5B800] flex items-center justify-center shrink-0">
                                                <Check size={13} className="text-white" strokeWidth={3} />
                                            </div>
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
