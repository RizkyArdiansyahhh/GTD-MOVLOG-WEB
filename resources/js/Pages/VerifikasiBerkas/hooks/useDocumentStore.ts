import { useState, useCallback } from 'react';
import type { VerificationDocument, VerificationStatus } from '../types';
import { mockDocuments } from '../data/mockDocuments';

const STORAGE_KEY = 'verifikasi_berkas_statuses';

interface StatusOverride {
    status: VerificationStatus;
    notes?: string;
    rejectionReason?: string;
    verifiedBy?: string;
    verifiedAt?: string;
}

type OverrideMap = Record<string, StatusOverride>;

/**
 * Read overrides from localStorage.
 */
function loadOverrides(): OverrideMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as OverrideMap;
    } catch {
        return {};
    }
}

/**
 * Save overrides to localStorage.
 */
function saveOverrides(overrides: OverrideMap): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
        // localStorage full or unavailable — silently ignore
    }
}

/**
 * Merge mock documents with localStorage overrides.
 */
function mergeDocuments(base: VerificationDocument[], overrides: OverrideMap): VerificationDocument[] {
    return base.map((doc) => {
        const override = overrides[doc.id];
        if (!override) return doc;
        return {
            ...doc,
            status: override.status,
            notes: override.notes ?? doc.notes,
            rejectionReason: override.rejectionReason ?? doc.rejectionReason,
            verifiedBy: override.verifiedBy ?? doc.verifiedBy,
            verifiedAt: override.verifiedAt ?? doc.verifiedAt,
        };
    });
}

/**
 * Hook that provides documents merged with localStorage overrides,
 * and a function to persist status changes.
 *
 * Usage:
 *   const [documents, updateDocumentStatus] = useDocumentStore();
 */
export function useDocumentStore(): [
    VerificationDocument[],
    (
        docId: string,
        status: VerificationStatus,
        notes: string,
        verifiedBy: string,
        verifiedAt: string,
    ) => void,
] {
    const [documents, setDocuments] = useState<VerificationDocument[]>(() => {
        const overrides = loadOverrides();
        return mergeDocuments(mockDocuments, overrides);
    });

    const updateDocumentStatus = useCallback(
        (
            docId: string,
            status: VerificationStatus,
            notes: string,
            verifiedBy: string,
            verifiedAt: string,
        ) => {
            // 1. Update localStorage
            const overrides = loadOverrides();
            overrides[docId] = {
                status,
                notes: notes || undefined,
                rejectionReason: status === 'Rejected' ? notes : undefined,
                verifiedBy,
                verifiedAt,
            };
            saveOverrides(overrides);

            // 2. Update React state
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === docId
                        ? {
                              ...doc,
                              status,
                              notes: notes || doc.notes,
                              rejectionReason: status === 'Rejected' ? notes : doc.rejectionReason,
                              verifiedBy,
                              verifiedAt,
                          }
                        : doc,
                ),
            );
        },
        [],
    );

    return [documents, updateDocumentStatus];
}
