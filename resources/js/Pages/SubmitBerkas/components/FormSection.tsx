import React from 'react';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        {icon && (
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#FFF4D6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#B7791F',
            }}
          >
            {icon}
          </span>
        )}
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#06283A' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── Small helpers shared across step forms ── */

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>{children}</div>;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  /** Restrict input to numbers only (digits + one decimal point). */
  numeric?: boolean;
  /** Display as read-only (used for auto-calculated total fields). */
  readOnly?: boolean;
}

export function Field({ label, value, onChange, placeholder, type = 'text', error, numeric = false, readOnly = false }: FieldProps) {
  const handleChange = (raw: string) => {
    if (!numeric) {
      onChange(raw);
      return;
    }
    // Allow only digits and a single decimal point.
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    onChange(cleaned);
  };

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        inputMode={numeric ? 'decimal' : undefined}
        value={value}
        readOnly={readOnly}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 40,
          border: error ? '1px solid #DC2626' : '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '0 12px',
          fontSize: 13,
          color: readOnly ? '#6B7280' : '#06283A',
          outline: 'none',
          boxSizing: 'border-box',
          background: readOnly ? '#F8FAFB' : '#fff',
          cursor: readOnly ? 'default' : 'text',
        }}
      />
      {error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/**
 * Numeric field (usually read-only / auto-calculated) paired with a unit dropdown,
 * e.g. "30,500" + [kg ▾]. Reused wherever a Total Quantity section needs a unit.
 */
interface FieldWithUnitProps {
  label: string;
  value: string;
  unit: string;
  unitOptions: string[];
  onUnitChange: (unit: string) => void;
  readOnly?: boolean;
}

export function FieldWithUnit({ label, value, unit, unitOptions, onUnitChange, readOnly = true }: FieldWithUnitProps) {
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          style={{
            flex: 1,
            height: 40,
            border: '1px solid #E2E8F0',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '0 12px',
            fontSize: 13,
            color: readOnly ? '#6B7280' : '#06283A',
            outline: 'none',
            boxSizing: 'border-box',
            background: readOnly ? '#F8FAFB' : '#fff',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          style={{
            width: 90,
            height: 40,
            border: '1px solid #E2E8F0',
            borderRadius: '0 8px 8px 0',
            padding: '0 8px',
            fontSize: 13,
            color: '#06283A',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {unitOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}