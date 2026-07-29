import { Outlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export function AuthLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="nur-atmosphere relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--nur-lamp) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, color-mix(in srgb, var(--nur-accent) 12%, transparent), transparent 50%)',
        }}
      />
      <motion.div
        className="relative w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
