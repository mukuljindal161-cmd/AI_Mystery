import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, Fingerprint } from 'lucide-react';
import { useCase } from '../hooks/useCase';
import { Badge, PageState } from '../components/UI';
export default function Results() {
  const { data, error, reload } = useCase(true);
  if (!data) return <PageState error={error} reload={reload} />;
  const choice = data.suspects.find((s) => s.id === data.accusedSuspectId);
  return (
    <main className="page">
      <div className="mb-10 text-center">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border ${data.correct ? 'border-gold/40 text-gold' : 'border-red-200/40 text-red-200'}`}
        >
          {data.correct ? <Check size={30} /> : <X size={30} />}
        </div>
        <p className="eyebrow">Case closed / {data.title}</p>
        <h1 className={`page-title mt-4 ${data.correct ? 'text-gold' : 'text-red-200'}`}>
          {data.correct ? 'Case solved.' : 'Wrong suspect.'}
        </h1>
        <p className="text-sm text-muted">
          {data.correct
            ? 'Your instincts held up. The evidence tells the same story.'
            : 'The truth took a different turn. Here’s how the evidence fits together.'}
        </p>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel">
              <p className="eyebrow mb-4">Your accusation</p>
              <h2 className="font-display text-2xl">{choice?.name}</h2>
              <p className="mt-2 text-xs text-muted">{choice?.role}</p>
            </div>
            <div className="panel border-gold/40 bg-gold/5">
              <p className="eyebrow mb-4">The culprit</p>
              <h2 className="font-display text-2xl text-gold">{data.culprit.name}</h2>
              <p className="mt-2 text-xs text-muted">{data.culprit.role}</p>
            </div>
          </div>
          <section className="mt-9">
            <h2 className="mb-5 font-display text-3xl">What really happened</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-paper/90">
              {data.explanation}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.keyClueIds.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="min-h-11 rounded border border-gold/30 px-3 py-3 text-xs text-gold hover:bg-gold/10"
                >
                  {data.clues.find((c) => c.id === id)?.label} ↗
                </a>
              ))}
            </div>
          </section>
        </div>
        <aside className="panel">
          <Fingerprint size={28} className="mb-5 text-gold" />
          <p className="eyebrow">Your detective score</p>
          <p className="my-5 font-display text-6xl text-gold">
            {data.score.final}
            <span className="ml-2 font-sans text-xs text-muted">points</span>
          </p>
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Score breakdown</caption>
            <tbody>
              {[
                ['Accusation base', data.score.basePoints],
                [`Clues (${data.score.cluesFound} × 5)`, `+${data.score.clueBonus}`],
                [`Hints (${data.score.hintsUsed} × 10)`, `−${data.score.hintPenalty}`],
              ].map(([label, value]) => (
                <tr key={label} className="border-t border-paper/10">
                  <th className="py-3 font-normal text-muted">{label}</th>
                  <td className="text-right font-mono">{value}</td>
                </tr>
              ))}
              <tr className="border-t border-gold/30 text-gold">
                <th className="py-4 font-normal">Final score</th>
                <td className="text-right font-mono">{data.score.final}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] leading-5 text-muted">
            max(0, {data.score.basePoints} + {data.score.clueBonus} − {data.score.hintPenalty})
          </p>
          <div className="mt-5">
            <Badge>{data.difficulty}</Badge>
          </div>
        </aside>
      </div>
      <section className="mt-12">
        <div className="section-label">
          <h2>Every piece of the puzzle</h2>
          <span>FULL EVIDENCE FILE</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.clues.map((cl) => (
            <article className="panel scroll-mt-6" id={cl.id} key={cl.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="font-display text-xl">{cl.label}</h3>
                <span
                  className={`text-[10px] uppercase tracking-widest ${cl.discovered ? 'text-gold' : 'text-muted'}`}
                >
                  {cl.discovered ? 'Found' : 'Missed'}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted">{cl.text}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link className="btn-primary" to="/create">
          Start another mystery <ArrowRight size={16} />
        </Link>
        <Link className="btn-outline" to="/">
          Home
        </Link>
      </div>
    </main>
  );
}
