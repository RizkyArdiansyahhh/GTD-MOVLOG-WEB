import { motion, MotionConfig } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

/**
 * Uniform page-enter animation for all layout-backed pages.
 *
 * Dashboard-style fade-up using GPU-only props (opacity/transform),
 * so the cost per navigation is negligible. Keyed by the Inertia URL
 * because layouts are persistent — without the key the animation
 * would only play on the first mount and never on navigation.
 * `MotionConfig reducedMotion="user"` disables it for users who
 * prefer reduced motion in their OS settings.
 */
export function PageTransition({ children }: PageTransitionProps) {
    const { url } = usePage();

    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                key={url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </MotionConfig>
    );
}
