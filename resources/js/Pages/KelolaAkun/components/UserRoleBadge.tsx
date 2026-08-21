// ─────────────────────────────────────────────
// Role badge color mapping
// ─────────────────────────────────────────────
const roleBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    'Super Admin':  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    'Supervisor':   { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
    'Staff':        { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
    'Field Worker': { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    'Customer':     { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
};

const defaultStyle = { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };

interface UserRoleBadgeProps {
    role: string;
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
    const style = roleBadgeStyles[role] ?? defaultStyle;

    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
            style={{
                backgroundColor: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
            }}
        >
            {role}
        </span>
    );
}
