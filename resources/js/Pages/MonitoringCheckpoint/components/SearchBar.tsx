import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

/**
 * Search sederhana (client-side filter) untuk halaman index MonitoringCheckpoint.
 * Tidak ada filter tambahan (customer/status/tanggal) untuk saat ini — sengaja
 * diminimalkan sesuai kebutuhan awal fitur.
 */
export default function SearchBar({ value, onChange, placeholder = "Cari no. assignment atau customer..." }: SearchBarProps) {
    return (
        <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#06283A] focus:ring-1 focus:ring-[#06283A]"
            />
        </div>
    );
}