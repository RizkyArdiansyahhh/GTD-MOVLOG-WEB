import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input {...props} type={visible ? 'text' : 'password'} className={`soft-field w-full pr-12 border border-slate-300 ${className}`} />
            <button type="button" className="soft-text-action absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}
                onClick={() => setVisible((value) => !value)}>
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
