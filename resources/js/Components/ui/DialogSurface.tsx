import { useEffect, useRef, type HTMLAttributes } from 'react';

interface DialogSurfaceProps extends HTMLAttributes<HTMLDivElement> {
    onDismiss?: () => void;
    dismissDisabled?: boolean;
}

/** Shared overlay surface: visible focus, contained keyboard navigation, and focus restoration. */
export function DialogSurface({ children, className = '', style, onDismiss, dismissDisabled = false, ...props }: DialogSurfaceProps) {
    const surface = useRef<HTMLDivElement>(null);
    const returnFocus = useRef(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const dismiss = useRef(onDismiss);
    const disabled = useRef(dismissDisabled);
    dismiss.current = onDismiss;
    disabled.current = dismissDisabled;

    useEffect(() => {
        const panel = surface.current;
        if (!panel) return;
        const previous = returnFocus.current;
        const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        )).filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'));
        if (!panel.contains(document.activeElement)) {
            (panel.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0] ?? panel).focus();
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !disabled.current && dismiss.current) {
                event.preventDefault();
                event.stopPropagation();
                dismiss.current();
            }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            const first = elements[0];
            const last = elements.at(-1);
            if (!first) { event.preventDefault(); panel.focus(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
                event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
                event.preventDefault(); first.focus();
            }
        };
        panel.addEventListener('keydown', onKeyDown);
        return () => {
            panel.removeEventListener('keydown', onKeyDown);
            if (previous?.isConnected) previous.focus();
        };
    }, []);

    return (
        <div {...props} ref={surface} role="dialog" aria-modal="true" tabIndex={-1}
            className={`soft-dialog ui-dialog-panel ${className}`}
            style={{ ...style, maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>
            {children}
        </div>
    );
}
