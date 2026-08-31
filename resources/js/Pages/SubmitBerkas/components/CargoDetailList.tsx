import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface CargoDetailListProps<T extends { id: string }> {
  title?: string;
  items: T[];
  onChange: (items: T[]) => void;
  createEmptyItem: () => T;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  addLabel?: string;
  readOnly?: boolean;
}

export function CargoDetailList<T extends { id: string }>({
  title = 'Cargo Detail',
  items,
  onChange,
  createEmptyItem,
  renderItem,
  addLabel = 'Tambah Cargo',
  readOnly = false,
}: CargoDetailListProps<T>) {
  const addItem = () => {
    if (readOnly) return;
    onChange([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (readOnly) return;
    onChange(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, patch: Partial<T>) => {
    if (readOnly) return;
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A', margin: 0, marginBottom: 16 }}>
        {title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, index) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: 16,
              background: '#FAFBFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Cargo Item {index + 1}</span>
              {!readOnly && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: '#DC2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <Trash2 size={13} />
                  Hapus Item
                </button>
              )}
            </div>

            {renderItem(item, index, (patch) => updateItem(item.id, patch))}
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 8,
            border: '1px dashed #B7791F',
            background: '#FFF8EC',
            color: '#B7791F',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          {addLabel}
        </button>
      )}
    </div>
  );
}