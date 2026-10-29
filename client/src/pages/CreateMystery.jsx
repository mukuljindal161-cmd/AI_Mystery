import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { ErrorBanner, LoadingScreen } from '../components/UI';
const levels = [
  {
    id: 'easy',
    title: 'Easy',
    description: 'A clear trail. A few loose ends.',
    counts: '3 suspects · 5 clues · 2 hints',
    base: 100,
  },
  {
    id: 'medium',
    title: 'Medium',
    description: 'Look closer. Things rarely add up.',
    counts: '4 suspects · 7 clues · 3 hints',
    base: 150,
  },
  {
    id: 'hard',
    title: 'Hard',
    description: 'Every alibi deserves a second look.',
    counts: '5 suspects · 9 clues · 3 hints',
    base: 200,
  },
];
const examples = [
  'A jewel theft at a masquerade ball',
  'A missing manuscript on the midnight train',
  'A vanished painting in a snowbound manor',
];
export default function CreateMystery() {
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const [premise, setPremise] = useState(''),
    [difficulty, setDifficulty] = useState(
      levels.some((l) => l.id === params.get('difficulty')) ? params.get('difficulty') : 'medium',
    );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [touched, setTouched] = useState(false);
  const length = premise.trim().length,
    valid = length >= 10 && length <= 300;
  async function submit(event) {
    event?.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.create({ premise: premise.trim(), difficulty });
      navigate(`/case/${response.case.id}`);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }
  return (
    <main className="page max-w-4xl">
      <p className="eyebrow">A new case awaits</p>
      <h1 className="page-title">
        Every mystery starts
        <br />
        with <em className="text-gold">a little possibility.</em>
      </h1>
      <p className="mb-10 max-w-xl leading-7 text-muted">
        Set the scene. We’ll supply the suspects, the secrets, and the clues. The conclusion is
        yours to reach.
      </p>
      {busy ? (
        <LoadingScreen generation />
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="premise" className="flex items-center justify-between text-sm">
            Your mystery premise{' '}
            <span className="font-mono text-[10px] text-muted">01 / SETTING</span>
          </label>
          <textarea
            id="premise"
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="A poisoned cup at a village tea festival…"
            aria-describedby="premise-help premise-error"
            aria-invalid={touched && !valid}
            rows={4}
            className="mt-3 w-full resize-y rounded border border-paper/20 bg-panel p-5 text-base leading-7 placeholder:text-muted/60"
          />
          <div id="premise-help" className="mt-2 flex justify-between gap-3 text-xs text-muted">
            <span>A place, an incident, a touch of intrigue. 10–300 characters.</span>
            <span className={length > 300 ? 'text-red-200' : ''}>{length}/300</span>
          </div>
          <p id="premise-error" className="mt-2 text-sm text-red-200">
            {touched && !valid ? 'Enter a premise between 10 and 300 characters.' : ''}
          </p>
          <div className="mt-5">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-muted">Need a spark?</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => {
                    setPremise(p);
                    setTouched(true);
                  }}
                  className="min-h-11 rounded-full border border-paper/15 px-4 py-2 text-left text-xs text-muted transition hover:border-gold hover:text-gold"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <fieldset className="mt-10">
            <legend className="mb-4 text-sm">Choose your difficulty</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {levels.map((l) => (
                <label
                  key={l.id}
                  className={`panel cursor-pointer transition ${difficulty === l.id ? 'border-gold bg-gold/5' : 'hover:border-paper/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl">{l.title}</span>
                    <input
                      type="radio"
                      name="difficulty"
                      value={l.id}
                      checked={difficulty === l.id}
                      onChange={() => setDifficulty(l.id)}
                      className="h-4 w-4 accent-[#d9b773]"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">{l.description}</p>
                  <p className="mt-5 text-[11px] text-muted">{l.counts}</p>
                  <p className="mt-2 text-xs text-gold">{l.base} base points</p>
                </label>
              ))}
            </div>
          </fieldset>
          <ErrorBanner error={error} retry={submit} />
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-paper/10 pt-7">
            <p className="flex items-center gap-2 text-xs text-muted">
              <Sparkles size={15} className="text-gold" /> An original case, written for you.
            </p>
            <button className="btn-primary" disabled={!valid}>
              Generate mystery <ArrowRight size={17} />
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
