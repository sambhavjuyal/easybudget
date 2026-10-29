import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; onKeyChanged: () => void }

/** Native <dialog>: focus trapping and Esc-to-close come for free. */
export function SettingsDialog({ open, onClose, onKeyChanged }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const api = window.easybudget;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setMsg(null);
      api?.keyStatus().then((s) => setSaved(s.saved));
    }
    if (!open && d.open) d.close();
  }, [open, api]);

  const save = async () => {
    const r = await api!.saveKey(key);
    if (r.ok) { setKey(''); setSaved(true); setMsg({ text: 'Saved. Job search will use your key.' }); onKeyChanged(); }
    else setMsg({ text: r.error ?? 'Could not save the key.', bad: true });
  };
  const remove = async () => { await api!.clearKey(); setSaved(false); setMsg({ text: 'Key removed from this computer.' }); };

  return (
    <dialog
      ref={ref} onClose={onClose} aria-labelledby="settings-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl p-0 bg-white text-ink shadow-2xl backdrop:bg-slate-900/50"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="settings-title" className="font-display text-2xl font-black">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings" className="min-h-11 min-w-11 grid place-items-center rounded-xl hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <h3 className="mt-5 text-sm font-extrabold">Gemini API key (for live job search)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Optional. Your key is stored encrypted by your operating system, on this computer only, and is sent nowhere except Google when you search.{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-bold text-brand underline">Get a free key</a>.
        </p>

        {!api ? (
          <p className="mt-4 p-3 rounded-xl bg-slate-100 text-sm font-semibold">Settings are available in the EasyBudget desktop app.</p>
        ) : (
          <>
            <p className="mt-4 text-sm font-bold" aria-live="polite">{saved ? 'A key is saved on this computer.' : 'No key saved yet.'}</p>
            <label htmlFor="gemini-key" className="sr-only">Gemini API key</label>
            <input
              id="gemini-key" autoFocus type="password" autoComplete="off" spellCheck={false} value={key} placeholder="Paste your key"
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && key.trim()) save(); }}
              className="mt-2 w-full min-h-11 px-3 rounded-xl border border-slate-300 bg-white"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={save} disabled={!key.trim()} className="min-h-11 px-5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-40 cursor-pointer">Save key</button>
              {saved && <button type="button" onClick={remove} className="min-h-11 px-4 rounded-xl border border-slate-300 text-sm font-bold hover:bg-slate-50 cursor-pointer">Remove key</button>}
            </div>
            {msg && <p role="status" className={`mt-3 text-sm font-semibold ${msg.bad ? 'text-rose-700' : 'text-emerald-700'}`}>{msg.text}</p>}
          </>
        )}
      </div>
    </dialog>
  );
}
