import { Search, RotateCcw } from 'lucide-react';

const statusOptions = ['All Statuses', 'Active', 'Inactive'];

interface UserFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void;
    roleFilter: string;
    onRoleFilterChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    onReset: () => void;
    hasActiveFilters: boolean;
    roleOptions: string[];
}

export default function UserFilters({
    search,
    onSearchChange,
    onSearchSubmit,
    roleFilter,
    onRoleFilterChange,
    statusFilter,
    onStatusFilterChange,
    onReset,
    hasActiveFilters,
    roleOptions,
}: UserFiltersProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                {/* Search */}
                <div
                    className="flex items-center gap-2 rounded-xl px-3.5 flex-1 w-full lg:max-w-sm border border-gray-200 transition-all duration-150 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100"
                    style={{ height: 42, backgroundColor: '#F8FAFC' }}
                >
                    <Search size={18} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search users..."
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                    />
                </div>

                {/* Filter Role */}
                <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value)}
                    className="w-full sm:w-40 rounded-xl px-3.5 text-sm text-gray-600 border border-gray-200 outline-none cursor-pointer transition-all duration-150 focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    style={{ height: 42, backgroundColor: '#F8FAFC' }}
                >
                    {roleOptions.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>

                {/* Filter Status */}
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full sm:w-38 rounded-xl px-3.5 text-sm text-gray-600 border border-gray-200 outline-none cursor-pointer transition-all duration-150 focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    style={{ height: 42, backgroundColor: '#F8FAFC' }}
                >
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                {/* Reset */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="w-full sm:w-auto justify-center flex items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150"
                        style={{ height: 42 }}
                    >
                        <RotateCcw size={14} strokeWidth={2} />
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
