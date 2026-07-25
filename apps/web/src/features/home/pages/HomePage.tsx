import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  fetchLibraryContinue,
  pickPrimaryContinue,
} from '@/features/library/api/libraryApi';
import type { PrimaryContinue } from '@/features/library/types/library.types';

export function HomePage() {
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [primary, setPrimary] = useState<PrimaryContinue | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setPrimary(null);
      return;
    }
    let cancelled = false;
    void fetchLibraryContinue()
      .then((data) => {
        if (!cancelled) setPrimary(pickPrimaryContinue(data));
      })
      .catch(() => {
        if (!cancelled) setPrimary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <section className="nur-atmosphere relative min-h-[calc(100dvh-3.5rem)] overflow-hidden md:min-h-[calc(100dvh-4rem)]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
      >
        <div className="absolute left-1/2 top-[-12%] h-[55vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--nur-lamp-soft)_0%,transparent_68%)] opacity-80" />
      </motion.div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col justify-center px-4 py-16 pb-28 md:min-h-[calc(100dvh-4rem)] md:px-6 md:pb-16">
        {import.meta.env.DEV ? (
          <div
            role="status"
            className="mb-8 max-w-xl rounded-[var(--radius-m)] border border-nur-line bg-nur-sunken/60 px-4 py-3 text-sm text-nur-muted"
          >
            <p className="font-medium text-nur-ink">Lokal demo</p>
            <p className="mt-1">
              EXAMPLE kontent production emas. Qur’on — import qilingan dataset; qolganlari
              namunaviy seed.
            </p>
          </div>
        ) : null}

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="font-display text-5xl tracking-[0.22em] text-nur-ink md:text-6xl">NUR</p>
          <h1 className="mt-6 text-2xl font-medium text-nur-ink md:text-3xl">
            {user
              ? `Assalomu alaykum, ${user.displayName}`
              : 'Tinich, ishonchli islomiy o‘qish va tinglash.'}
          </h1>
          <p className="mt-4 max-w-md text-base text-nur-muted md:text-lg">
            {primary
              ? primary.detail
              : 'Qur’on, podcast, kitob va tadqiqot — bir joyda, manbali va davom ettirish mumkin.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {primary ? (
              <Button to={primary.href}>{primary.label}</Button>
            ) : (
              <Button to="/quran">Qur’onga o‘tish</Button>
            )}
            {accessToken ? (
              <Button to="/library" variant="secondary">
                Kutubxona
              </Button>
            ) : (
              <Button to="/login" variant="secondary">
                Kirish
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
