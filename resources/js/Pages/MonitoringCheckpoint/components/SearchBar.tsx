import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

/**
 * Search input modern bertema GTD untuk halaman index MonitoringCheckpoint.
 */
export default function SearchBar({
    value,
    onChange,
    placeholder = "Cari no. assignment atau customer...",
}: SearchBarProps) {
    return (
        <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 shadow-2xs transition focus:border-[#06283A] focus:outline-hidden focus:ring-2 focus:ring-[#06283A]/10"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600 cursor-pointer"
                    aria-label="Bersihkan pencarian"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}