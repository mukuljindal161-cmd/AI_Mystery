import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, MapPin, Check, Lightbulb } from 'lucide-react';
import { useCase } from '../hooks/useCase';
import { api } from '../api/client';
import { Badge, ErrorBanner, PageState, Spinner, SuspectCard } from '../components/UI';
export default function InvestigationRoom() {
  const { id, data, setData, error, reload } = useCase(),
    navigate = useNavigate(),
    location = useLocation();
  const [busy, setBusy] = useState(null),
    [actionError, setActionError] = useState(null);
  if (!data) return <PageState error={error} reload={reload} />;
  async function discover(clueId) {
    if (busy) return;
    setBusy(clueId);
    setActionError(null);
    try {
      const response = await api.discover(id, clueId);
      setData((c) => ({
        ...c,
        clues: c.clues.map((cl) => (cl.id === clueId ? response.clue : cl)),
        progress: response.progress,
        score: response.score,
      }));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }
  function handleError(err) {
    if (err.code === 'CASE_ALREADY_COMPLETED') navigate(`/case/${id}/result`);
    else setActionError(err);
  }
  async function hint() {
    if (busy) return;
    setBusy('hint');
    setActionError(null);
    try {
      const response = await api.hint(id);
      setData((c) => ({
        ...c,
        hints: {
          total: response.hints.total,
          used: response.hints.used,
          revealed: [...c.hints.revealed, response.hint],
        },
        progress: { ...c.progress, hintsUsed: response.hints.used },
        score: response.score,
      }));
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }
  const sidebar = (
    <>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Your investigation</p>
        <span className="font-mono text-xs text-gold">
          {Math.round((data.progress.cluesFound / data.progress.cluesTotal) * 100)}%
        </span>
      </div>
      <div
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-paper/10"
        role="progressbar"
        aria-label="Clues discovered"
        aria-valuemin={0}
        aria-valuemax={data.progress.cluesTotal}
        aria-valuenow={data.progress.cluesFound}
      >
        <div
          className="h-full bg-gold transition-all"
          style={{ width: `${(data.progress.cluesFound / data.progress.cluesTotal) * 100}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>Clues found</span>
        <span>
          {data.progress.cluesFound} / {data.progress.cluesTotal}
        </span>
      </div>
      <div className="mt-6 border-y border-paper/10 py-5">
        <div className="flex items-center gap-2 text-sm">
          <Lightbulb size={17} className="text-gold" /> A nudge in the right direction
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Sometimes a fresh perspective helps. Each hint costs 10 points.
        </p>
        <button
          onClick={hint}
          disabled={!!busy || data.hints.used >= data.hints.total}
          className="btn-outline mt-4 w-full"
        >
          {busy === 'hint' ? <Spinner /> : null}
          {data.hints.used >= data.hints.total ? 'No hints remaining' : 'Request hint (−10)'}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">
          Hints used {data.hints.used} / {data.hints.total}
        </p>
        <ol className="mt-4 space-y-3" aria-live="polite">
          {data.hints.revealed.map((h) => (
            <li
              key={h.index}
              className="border-l border-gold/50 pl-3 text-sm leading-6 text-paper/90"
            >
              <span className="mb-1 block text-[9px] uppercase tracking-widest text-gold">
                Hint {h.index + 1}
              </span>
              {h.text}
            </li>
          ))}
        </ol>
      </div>
      <p className="mb-4 mt-5 text-xs leading-5 text-muted">
        You can accuse at any time. Once you do, there’s no turning back.
      </p>
      <Link className="btn-primary w-full" to={`/case/${id}/accuse`}>
        Make accusation <ArrowRight size={16} />
      </Link>
    </>
  );
  return (
    <main className="page">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="eyebrow">Case file / {id.slice(-6).toUpperCase()}</p>
        <Badge>{data.difficulty}</Badge>
        <span className="ml-auto text-xs text-muted">
          Evidence score{' '}
          <strong className="ml-2 font-mono text-xl font-normal text-gold" aria-live="polite">
            {data.score.current}
          </strong>
        </span>
      </div>
      <h1 className="page-title">{data.title}</h1>
      {location.state?.notice && (
        <p role="status" className="mb-6 text-sm text-gold">
          {location.state.notice}
        </p>
      )}
      <ErrorBanner error={actionError} />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <section className="border-l-2 border-gold/50 pl-6">
            <p className="eyebrow mb-4">The story so far</p>
            <div className="whitespace-pre-line font-display text-lg leading-8 text-paper/90">
              {data.story}
            </div>
          </section>
          <section className="mt-10">
            <div className="section-label">
              <h2>The persons of interest</h2>
              <span>{data.suspects.length} SUSPECTS</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.suspects.map((s, i) => (
                <SuspectCard key={s.id} suspect={s} index={i} />
              ))}
            </div>
          </section>
        </div>
        <aside className="panel sticky top-6 hidden lg:block">{sidebar}</aside>
        <details className="panel lg:hidden">
          <summary className="min-h-11 cursor-pointer text-sm text-gold">
            Progress, hints & accusation
          </summary>
          <div className="mt-4">{sidebar}</div>
        </details>
      </div>
      <section className="mt-12">
        <div className="section-label">
          <h2>The evidence board</h2>
          <span>
            {data.progress.cluesFound} / {data.progress.cluesTotal} DISCOVERED
          </span>
        </div>
        <p className="mb-6 text-sm text-muted">
          Every detail tells a story. Open a lead to see what it reveals.
        </p>
        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.clues.map((cl, i) => (
            <article
              key={cl.id}
              className={`panel flex flex-col ${cl.discovered ? 'border-gold/25' : 'border-dashed'}`}
            >
              <div className="mb-5 flex justify-between">
                <span className="font-mono text-[10px] text-muted">EVIDENCE / 0{i + 1}</span>
                {cl.discovered ? (
                  <Check size={16} className="text-gold" />
                ) : (
                  <LockKeyhole size={16} className="text-muted" />
                )}
              </div>
              <h3 className="font-display text-xl">{cl.label}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <MapPin size={12} />
                {cl.location}
              </p>
              {cl.discovered ? (
                <>
                  <p className="my-5 text-sm leading-6 text-paper/90" aria-live="polite">
                    {cl.text}
                  </p>
                  <span className="mt-auto text-[10px] uppercase tracking-widest text-gold">
                    Discovered · +5 points
                  </span>
                </>
              ) : (
                <button
                  className="btn-outline mt-7 w-full"
                  disabled={!!busy}
                  onClick={() => discover(cl.id)}
                >
                  {busy === cl.id ? <Spinner /> : null}Investigate <ArrowRight size={14} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
