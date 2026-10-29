import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Fingerprint, LoaderCircle, Search, X, AlertCircle } from 'lucide-react';
export function Navbar() {
  return (
    <header className="border-b border-paper/10">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-3" aria-label="Whodunit home">
          <Fingerprint className="text-gold" size={31} />
          <span className="font-display text-2xl tracking-tight">
            whodunit<span className="text-gold">.</span>
          </span>
          <span className="ml-1 hidden rounded border border-gold/30 px-1.5 py-0.5 text-[9px] tracking-widest text-gold sm:inline">
            AI
          </span>
        </Link>
        <Link className="btn-outline text-xs" to="/create">
          New mystery <span aria-hidden="true">+</span>
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-paper/10 px-5 py-7 text-xs text-muted sm:px-8">
      <span>
        WHODUNIT <span className="mx-2 text-gold">/</span> A little curiosity goes a long way.
      </span>
      <span>Original cases. Uncommon suspects.</span>
    </footer>
  );
}
export function ErrorBanner({ error, retry }) {
  return error ? (
    <div
      role="alert"
      aria-live="polite"
      className="my-4 flex flex-wrap items-center gap-3 rounded border border-red-300/30 bg-red-300/5 p-4 text-sm text-red-200"
    >
      <AlertCircle size={18} />
      <span className="flex-1">{error.message || error}</span>
      {retry && (
        <button className="underline underline-offset-4" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  ) : null;
}
export function Spinner() {
  return <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />;
}
export function LoadingScreen({ generation = false }) {
  const messages = [
    'Opening the case file…',
    'Dusting for fingerprints…',
    'Interviewing suspects…',
    'Following the evidence…',
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full border border-gold/30 p-6">
        <Search size={36} className="animate-pulse text-gold" />
      </div>
      <h2 className="font-display text-3xl">
        {generation ? messages[index] : 'Retrieving the case file…'}
      </h2>
      <p className="max-w-sm text-sm text-muted">
        {generation
          ? 'A good mystery takes a moment. Your case is being written and checked.'
          : 'The evidence will be with you shortly.'}
      </p>
      <Spinner />
    </div>
  );
}
export function PageState({ error, reload }) {
  return error ? (
    <div className="page">
      <p className="eyebrow">Case archive</p>
      <h1 className="page-title">
        {[400, 404].includes(error.status) ? 'Case not found.' : 'A loose end.'}
      </h1>
      <ErrorBanner error={error} retry={reload} />
      <Link className="btn-primary" to="/create">
        Start a new mystery <ArrowRight size={16} />
      </Link>
    </div>
  ) : (
    <LoadingScreen />
  );
}
export function Badge({ children }) {
  return (
    <span className="rounded border border-gold/30 bg-gold/5 px-2.5 py-1 text-[10px] uppercase tracking-[.15em] text-gold">
      {children}
    </span>
  );
}
export function ConfirmModal({ name, busy, onCancel, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="w-[calc(100%-2rem)] max-w-md rounded-lg border border-paper/20 bg-panel p-7 text-paper backdrop:bg-black/80"
      aria-labelledby="confirm-title"
    >
      <div className="flex justify-between gap-4">
        <p className="eyebrow">The final word</p>
        <button
          onClick={onCancel}
          disabled={busy}
          aria-label="Close confirmation"
          className="min-h-11 min-w-11"
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="confirm-title" className="font-display text-3xl">
        Accuse {name}?
      </h2>
      <p className="my-5 leading-relaxed text-muted">
        This decision is final. You have one accusation, and the case will close when you submit it.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="btn-outline" disabled={busy} onClick={onCancel} autoFocus>
          Keep thinking
        </button>
        <button className="btn-primary" disabled={busy} onClick={onConfirm}>
          {busy ? <Spinner /> : null} Confirm accusation
        </button>
      </div>
    </dialog>
  );
}
export function SuspectCard({ suspect, index, selected, onSelect }) {
  const content = (
    <>
      <div className="mb-5 flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-paper/15 bg-paper/5 font-display text-lg text-gold">
          {suspect.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </span>
        <span className="font-mono text-[10px] text-muted">SUSPECT 0{index + 1}</span>
      </div>
      <h3 className="font-display text-xl">{suspect.name}</h3>
      <p className="mt-1 text-xs text-gold">{suspect.role}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">{suspect.description}</p>
      {!onSelect && (
        <div className="mt-5 border-t border-paper/10 pt-4">
          <p className="mb-2 text-[9px] uppercase tracking-widest text-muted">Their alibi</p>
          <p className="text-sm italic leading-relaxed text-paper/90">“{suspect.alibi}”</p>
        </div>
      )}
    </>
  );
  return onSelect ? (
    <label
      className={`panel cursor-pointer transition hover:border-gold/60 ${selected ? 'border-gold bg-gold/10' : ''}`}
    >
      <input
        type="radio"
        name="suspect"
        value={suspect.id}
        checked={selected}
        onChange={onSelect}
        className="mb-4 h-4 w-4 accent-[#d9b773]"
      />
      <span className="sr-only">Accuse {suspect.name}</span>
      <div>{content}</div>
    </label>
  ) : (
    <article className="panel">{content}</article>
  );
}
