import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Search,
    X,
    Loader2,
    Package,
    ClipboardList,
    FileText,
    MapPin,
    Users,
    History,
    ArrowRight,
    CornerDownLeft,
} from 'lucide-react';
import type { SearchResultItem, QuickSearchResponse, SearchCategoryType } from './types';

const STORAGE_KEY = 'gtd_recent_searches';
const MAX_RECENTS = 5;

const SUGGESTIONS = [
    'Excavator CAT 320',
    'SES-2048',
    'INV-2026-014',
    'TRK-2024-001',
    'Pelabuhan',
    'PT Customer A',
];

/**
 * Renders text with matching query substrings highlighted with a subtle pale yellow background.
 */
function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim() || !text) {
        return <>{text}</>;
    }

    const trimmedQuery = query.trim();
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className="bg-[#FEF08A] text-gray-950 font-semibold px-0.5 rounded-[2px]"
                        style={{ backgroundColor: '#FEF08A' }}
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export default function GlobalSearchBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<QuickSearchResponse | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch {
            // Ignore storage errors
        }
    }, []);

    const saveRecentSearch = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        try {
            const updated = [
                trimmed,
                ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
            ].slice(0, MAX_RECENTS);
            setRecentSearches(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore
        }
    };

    const clearRecentSearches = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRecentSearches([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore
        }
    };

    // Flatten all items for keyboard navigation index calculation
    const allItems = useMemo<SearchResultItem[]>(() => {
        if (!results || !results.categories) return [];
        const items: SearchResultItem[] = [];
        Object.values(results.categories).forEach((cat) => {
            if (cat && cat.items) {
                items.push(...cat.items);
            }
        });
        return items;
    }, [results]);

    // Reset item refs when results change
    useEffect(() => {
        itemRefs.current = [];
    }, [results]);

    // Automatically scroll active selected item into view during arrow key navigation
    useEffect(() => {
        if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [selectedIndex]);

    // Fetch quick search results with debounce and abort controller
    const fetchResults = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(null);
            setLoading(false);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);

        try {
            const res = await fetch(`/global-search/quick?q=${encodeURIComponent(searchQuery)}`, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                const data: QuickSearchResponse = await res.json();
                setResults(data);
                setSelectedIndex(0); // Automatically select first item for keyboard-first experience
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Search request error:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce query changes
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults(null);
            setLoading(false);
            setSelectedIndex(-1);
            return;
        }

        const timer = setTimeout(() => {
            fetchResults(trimmed);
        }, 180);

        return () => clearTimeout(timer);
    }, [query, fetchResults]);

    // Global keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(true);
                if (window.innerWidth < 768) {
                    setIsMobileModalOpen(true);
                    setTimeout(() => mobileInputRef.current?.focus(), 100);
                } else {
                    inputRef.current?.focus();
                    inputRef.current?.select();
                }
            } else if (e.key === 'Escape') {
                setIsOpen(false);
                setIsMobileModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectResult = (item: SearchResultItem) => {
        saveRecentSearch(query || item.title);
        setIsOpen(false);
        setIsMobileModalOpen(false);
        router.visit(item.url);
    };

    const handleViewAllResults = (customQuery?: string) => {
        const q = customQuery || query;
        if (!q.trim()) return;
        saveRecentSearch(q);
        setIsOpen(false);
        setIsMobileModalOpen(false);
        router.visit(`/search?q=${encodeURIComponent(q)}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (allItems.length === 0) return;
            setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (allItems.length === 0) return;
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && allItems[selectedIndex]) {
                handleSelectResult(allItems[selectedIndex]);
            } else if (query.trim()) {
                handleViewAllResults();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setIsMobileModalOpen(false);
        }
    };

    const getCategoryIcon = (category: SearchCategoryType) => {
        const props = { size: 16, strokeWidth: 1.7, className: 'text-gray-400 shrink-0' };
        switch (category) {
            case 'barang':
                return <Package {...props} />;
            case 'sesi':
                return <ClipboardList {...props} />;
            case 'dokumen':
                return <FileText {...props} />;
            case 'checkpoint':
                return <MapPin {...props} />;
            case 'users':
                return <Users {...props} />;
            default:
                return <Search {...props} />;
        }
    };

    const getStatusStyle = (status: string, statusType: string) => {
        const type = statusType?.toLowerCase() || '';
        if (type.includes('transit') || type.includes('progress') || type.includes('aktif') || type === 'active') {
            return 'text-blue-600 font-medium';
        } else if (type.includes('approved') || type.includes('selesai') || type.includes('delivered') || type.includes('completed')) {
            return 'text-emerald-600 font-medium';
        } else if (type.includes('pending') || type.includes('menunggu')) {
            return 'text-amber-600 font-medium';
        } else if (type.includes('reject') || type.includes('inactive') || type.includes('batal')) {
            return 'text-red-600 font-medium';
        }
        return 'text-gray-500 font-normal';
    };

    // Shared list content rendering (clean flat list with subtle dividers & headers)
    const renderSearchResultsList = () => {
        const trimmed = query.trim();

        // 1. Initial State: Recent searches & Suggestions
        if (!trimmed) {
            return (
                <div className="p-4 space-y-4">
                    {recentSearches.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Recent Searches
                                </span>
                                <button
                                    type="button"
                                    onClick={clearRecentSearches}
                                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {recentSearches.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            setQuery(item);
                                            fetchResults(item);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200/70 transition-colors"
                                    >
                                        <History size={12} className="text-gray-400" />
                                        <span>{item}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Pintasan Cepat
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                            {SUGGESTIONS.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        setQuery(item);
                                        fetchResults(item);
                                    }}
                                    className="text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
                                >
                                    <span className="truncate">{item}</span>
                                    <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // 2. Loading state
        if (loading && (!results || results.query !== trimmed)) {
            return (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 size={20} className="animate-spin text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Searching for &quot;{trimmed}&quot;...</p>
                </div>
            );
        }

        // 3. Results view: Flat list with section headers and thin dividers
        if (results && results.total_count > 0) {
            let currentIndexCounter = 0;

            return (
                <div className="flex flex-col">
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 scroll-smooth">
                        {Object.entries(results.categories).map(([catKey, categoryGroup]) => {
                            if (!categoryGroup.items || categoryGroup.items.length === 0) return null;

                            return (
                                <div key={catKey} className="pt-2.5 pb-1">
                                    {/* ── Category Header ── */}
                                    <div className="flex items-center justify-between px-4 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <span>{categoryGroup.label}</span>
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-normal">
                                            {categoryGroup.count}
                                        </span>
                                    </div>

                                    {/* ── Flat Result Rows ── */}
                                    <div className="divide-y divide-gray-100/60 mt-1">
                                        {categoryGroup.items.map((item) => {
                                            const itemIndex = currentIndexCounter++;
                                            const isSelected = selectedIndex === itemIndex;

                                            return (
                                                <div
                                                    key={item.id}
                                                    ref={(el) => {
                                                        itemRefs.current[itemIndex] = el;
                                                    }}
                                                    onClick={() => handleSelectResult(item)}
                                                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                                                    className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 select-none ${
                                                        isSelected
                                                            ? 'bg-gray-50 text-gray-950'
                                                            : 'hover:bg-gray-50/70 text-gray-800'
                                                    }`}
                                                >
                                                    {/* Left: Icon */}
                                                    <div className="shrink-0 flex items-center justify-center w-5 h-5 text-gray-400">
                                                        {getCategoryIcon(item.category)}
                                                    </div>

                                                    {/* Center: Title & Subtitle */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-semibold text-gray-900 leading-snug truncate">
                                                            <HighlightText text={item.title} query={trimmed} />
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate leading-relaxed">
                                                            <HighlightText text={item.subtitle} query={trimmed} />
                                                        </div>
                                                    </div>

                                                    {/* Right: Status / Select key hint */}
                                                    <div className="shrink-0 flex items-center gap-2.5">
                                                        {item.status && (
                                                            <span className={`text-xs ${getStatusStyle(item.status, item.status_type)}`}>
                                                                {item.status}
                                                            </span>
                                                        )}
                                                        {isSelected && (
                                                            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded border border-gray-300/60">
                                                                <span>Select</span>
                                                                <CornerDownLeft size={10} strokeWidth={2.5} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // 4. Empty state: Simple & Clean
        return (
            <div className="py-10 px-6 text-center">
                <p className="text-sm font-semibold text-gray-800">
                    No results found for &ldquo;{trimmed}&rdquo;
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Try searching by unit name, tracking ID, session, checkpoint, document, or user name.
                </p>
            </div>
        );
    };

    return (
        <div ref={containerRef} className="relative">
            {/* ── Desktop Search Bar ── */}
            <div
                className={`hidden md:flex items-center gap-2.5 rounded-xl px-3.5 transition-all duration-150 border ${
                    isOpen
                        ? 'bg-white border-gray-300 shadow-sm ring-1 ring-gray-200'
                        : 'bg-gray-100/90 hover:bg-gray-100 border-transparent hover:border-gray-200'
                }`}
                style={{
                    width: '340px',
                    height: '38px',
                }}
            >
                {loading ? (
                    <Loader2 size={16} className="text-gray-400 animate-spin shrink-0" />
                ) : (
                    <Search size={16} className="text-gray-400 shrink-0" strokeWidth={2} />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search anything (Ctrl + K)..."
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
                {query ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setResults(null);
                            inputRef.current?.focus();
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                ) : (
                    <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white/80 rounded border border-gray-200 select-none shadow-2xs">
                        ⌘K
                    </kbd>
                )}
            </div>

            {/* ── Mobile Search Trigger Button ── */}
            <button
                type="button"
                onClick={() => {
                    setIsMobileModalOpen(true);
                    setTimeout(() => mobileInputRef.current?.focus(), 100);
                }}
                className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Open global search"
            >
                <Search size={18} strokeWidth={1.8} />
            </button>

            {/* ── Desktop Unified Search Panel Dropdown ── */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="hidden md:block absolute right-0 top-full mt-2 w-[540px] bg-white rounded-xl shadow-2xl border border-gray-200/90 z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-1 duration-100"
                >
                    {/* Flat Search Results List */}
                    {renderSearchResultsList()}

                    {/* Compact Integrated Keyboard Navigation Footer */}
                    <div className="px-4 py-2.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 select-none">
                        {results && results.total_count > 0 ? (
                            <button
                                type="button"
                                onClick={() => handleViewAllResults()}
                                className="font-semibold text-gray-700 hover:text-gray-950 flex items-center gap-1 transition-colors"
                            >
                                <span>Lihat semua hasil ({results.total_count} item)</span>
                                <ArrowRight size={12} />
                            </button>
                        ) : (
                            <span className="text-[11px] text-gray-400">Global Search</span>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                            <div className="flex items-center gap-1">
                                <span className="inline-flex items-center justify-center px-1 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
                                    ▲
                                </span>
                                <span className="inline-flex items-center justify-center px-1 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
                                    ▼
                                </span>
                                <span className="ml-0.5">To navigate</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
                                    ↵
                                </span>
                                <span className="ml-0.5">To select</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
                                    esc
                                </span>
                                <span className="ml-0.5">To dismiss</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mobile Unified Search Modal Dialog ── */}
            {isMobileModalOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white animate-in fade-in duration-100">
                    <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white">
                        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                            {loading ? (
                                <Loader2 size={16} className="text-gray-400 animate-spin shrink-0" />
                            ) : (
                                <Search size={16} className="text-gray-400 shrink-0" />
                            )}
                            <input
                                ref={mobileInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search tracking, sessions, documents..."
                                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileModalOpen(false)}
                            className="px-2.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                            Tutup
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {renderSearchResultsList()}
                    </div>

                    {results && results.total_count > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => handleViewAllResults()}
                                className="w-full py-2 bg-white hover:bg-gray-100 text-xs font-semibold text-gray-800 rounded-lg border border-gray-300 text-center transition-colors"
                            >
                                Lihat semua {results.total_count} hasil →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}