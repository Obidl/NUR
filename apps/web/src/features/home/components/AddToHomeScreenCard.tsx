import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import {
  dismissInstallPrompt,
  getDeferredInstallPrompt,
  isIosSafari,
  isStandaloneDisplay,
  promptInstall,
  subscribeInstallPrompt,
  wasInstallDismissedRecently,
} from '@/shared/lib/pwa';

export function AddToHomeScreenCard() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function refresh() {
      if (isStandaloneDisplay() || wasInstallDismissedRecently()) {
        setVisible(false);
        setIosHint(false);
        return;
      }
      if (getDeferredInstallPrompt()) {
        setVisible(true);
        setIosHint(false);
        return;
      }
      if (isIosSafari()) {
        setVisible(true);
        setIosHint(true);
        return;
      }
      setVisible(false);
    }

    refresh();
    return subscribeInstallPrompt(refresh);
  }, []);

  if (!visible) return null;

  async function onInstall() {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome !== 'accepted') {
        // Keep card if still relevant; refresh via subscribe
      }
    } finally {
      setBusy(false);
    }
  }

  function onDismiss() {
    dismissInstallPrompt();
    setVisible(false);
  }

  return (
    <div className="mx-auto mb-8 max-w-lg rounded-[var(--radius-xl)] border border-nur-line bg-nur-elevated px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-nur-accent-soft text-nur-accent">
          <Download size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-[-0.01em] text-nur-ink">
            Bosh ekranga qo‘shish
          </p>
          <p className="mt-1 text-xs leading-relaxed text-nur-muted">
            {iosHint
              ? 'Safari’da Share → «Add to Home Screen» / «Bosh ekranga qo‘shish».'
              : 'NURni ilova kabi oching — tezroq va toza.'}
          </p>
          {iosHint ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-nur-accent">
              <Share size={14} aria-hidden /> Share tugmasini bosing
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void onInstall()}
              disabled={busy}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-m)] bg-nur-accent px-4 text-sm font-semibold text-[var(--nur-accent-ink)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? 'Kutilmoqda…' : 'Qo‘shish'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-[var(--radius-s)] p-1.5 text-nur-faint transition-colors hover:text-nur-ink"
          aria-label="Yopish"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
