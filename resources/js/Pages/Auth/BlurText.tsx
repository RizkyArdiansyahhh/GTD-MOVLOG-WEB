import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface BlurTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export default function BlurText({ text, className = '', delay = 0 }: BlurTextProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    const words = text.split(' ');

    return (
        <span ref={ref} className={`inline-block ${className}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    className="inline-block mr-[0.3em]"
                    initial={{ filter: 'blur(10px)', opacity: 0 }}
                    animate={
                        isInView
                            ? {
                                filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
                                opacity: [0, 0.5, 1],
                            }
                            : {}
                    }
                    transition={{
                        duration: 0.7,
                        ease: 'easeOut',
                        delay: delay + i * 0.1,
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}
