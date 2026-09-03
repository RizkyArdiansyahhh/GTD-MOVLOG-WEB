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
        <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-[#06283A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#06283A]/10"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Bersihkan pencarian"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}