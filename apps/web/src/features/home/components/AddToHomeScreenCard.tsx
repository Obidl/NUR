import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import {
  canNativeInstall,
  detectInstallPlatform,
  dismissInstallPrompt,
  isStandaloneDisplay,
  promptInstall,
  subscribeInstallPrompt,
  wasInstallDismissedRecently,
  type InstallPlatform,
} from '@/shared/lib/pwa';

function copyForPlatform(platform: InstallPlatform, hasNative: boolean): {
  body: string;
  actionLabel: string | null;
} {
  if (hasNative) {
    return {
      body: 'NURni telefon/kompyuteringizga ilova sifatida qo‘shing.',
      actionLabel: 'Qo‘shish',
    };
  }
  switch (platform) {
    case 'ios':
      return {
        body: 'Safari’da pastdagi Share (□↑) → «Add to Home Screen» / «Bosh ekranga qo‘shish».',
        actionLabel: null,
      };
    case 'android':
      return {
        body: 'Brauzer menyusi (⋮) → «Install app» yoki «Add to Home screen» / «Bosh ekranga qo‘shish».',
        actionLabel: null,
      };
    case 'desktop':
      return {
        body: 'Chrome/Edge: manzil qatori o‘ngidagi o‘rnatish belgisini bosing, yoki menyu → «Install NUR» / «Ilovani o‘rnatish».',
        actionLabel: null,
      };
    default:
      return {
        body: 'Brauzer menyusidan «Add to Home Screen» / «Install app» ni tanlang.',
        actionLabel: null,
      };
  }
}

type Props = {
  /** Force show even if previously dismissed (e.g. More page). */
  force?: boolean;
};

export function AddToHomeScreenCard({ force = false }: Props) {
  const [hidden, setHidden] = useState(true);
  const [platform, setPlatform] = useState<InstallPlatform>('unknown');
  const [hasNative, setHasNative] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function refresh() {
      setPlatform(detectInstallPlatform());
      setHasNative(canNativeInstall());
      if (isStandaloneDisplay()) {
        setHidden(true);
        return;
      }
      if (!force && wasInstallDismissedRecently()) {
        setHidden(true);
        return;
      }
      setHidden(false);
    }

    refresh();
    return subscribeInstallPrompt(refresh);
  }, [force]);

  if (hidden) return null;

  const { body, actionLabel } = copyForPlatform(platform, hasNative);

  async function onInstall() {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        // Native prompt not ready — keep instructions visible.
        setHasNative(false);
      }
    } finally {
      setBusy(false);
    }
  }

  function onDismiss() {
    dismissInstallPrompt();
    if (!force) setHidden(true);
  }

  return (
    <div className="mx-auto mb-8 max-w-lg rounded-[var(--radius-xl)] border border-nur-line bg-nur-elevated px-5 py-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-accent-soft text-nur-accent">
          {platform === 'ios' ? (
            <Share size={18} strokeWidth={1.75} aria-hidden />
          ) : (
            <Download size={18} strokeWidth={1.75} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-[-0.01em] text-nur-ink">
            Bosh ekranga qo‘shish
          </p>
          <p className="mt-1 text-xs leading-relaxed text-nur-muted">{body}</p>
          {actionLabel ? (
            <button
              type="button"
              onClick={() => void onInstall()}
              disabled={busy}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-m)] bg-nur-accent px-4 text-sm font-semibold text-[var(--nur-accent-ink)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? 'Kutilmoqda…' : actionLabel}
            </button>
          ) : platform === 'ios' ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-nur-accent">
              <Share size={14} aria-hidden /> Share → Add to Home Screen
            </p>
          ) : null}
        </div>
        {!force ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-[var(--radius-s)] p-1.5 text-nur-faint transition-colors hover:text-nur-ink"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
