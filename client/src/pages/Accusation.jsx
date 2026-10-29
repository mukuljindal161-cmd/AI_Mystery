import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import { useCase } from '../hooks/useCase';
import { api } from '../api/client';
import { ConfirmModal, ErrorBanner, PageState, SuspectCard } from '../components/UI';
export default function Accusation() {
  const { id, data, error, reload } = useCase(),
    navigate = useNavigate();
  const [selected, setSelected] = useState(''),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(null);
  if (!data) return <PageState error={error} reload={reload} />;
  async function accuse() {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.accuse(id, selected);
      navigate(`/case/${id}/result`, { replace: true });
    } catch (err) {
      if (err.code === 'CASE_ALREADY_COMPLETED') navigate(`/case/${id}/result`, { replace: true });
      else {
        setActionError(err);
        setConfirm(false);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page">
      <Link
        className="mb-9 inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-gold"
        to={`/case/${id}`}
      >
        <ArrowLeft size={15} /> Back to investigation
      </Link>
      <p className="eyebrow">The moment of truth</p>
      <h1 className="page-title">
        Who <em className="text-gold">did it?</em>
      </h1>
      <p className="max-w-xl leading-7 text-muted">
        You’ve heard the stories. You’ve followed the evidence. Choose one suspect to close the
        case. You can only accuse once.
      </p>
      <div className="my-7 flex flex-wrap gap-5 border-y border-paper/10 py-4 text-xs text-muted">
        <span>
          {data.progress.cluesFound} / {data.progress.cluesTotal} clues discovered
        </span>
        <span>{data.hints.used} hints used</span>
        <span className="text-gold">{data.score.current} evidence points</span>
      </div>
      <fieldset disabled={busy}>
        <legend className="mb-5 text-sm">Select your suspect</legend>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.suspects.map((s, i) => (
            <SuspectCard
              key={s.id}
              suspect={s}
              index={i}
              selected={selected === s.id}
              onSelect={() => setSelected(s.id)}
            />
          ))}
        </div>
      </fieldset>
      <ErrorBanner error={actionError} />
      <div className="mt-8 flex justify-end">
        <button
          className="btn-primary"
          disabled={!selected || busy}
          onClick={() => setConfirm(true)}
        >
          <Scale size={17} /> Confirm accusation
        </button>
      </div>
      {confirm && (
        <ConfirmModal
          name={data.suspects.find((s) => s.id === selected)?.name}
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={accuse}
        />
      )}
    </main>
  );
}
