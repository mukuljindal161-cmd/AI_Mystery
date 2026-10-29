import { Link } from 'react-router-dom';
import { ArrowRight, Fingerprint, Search, PenLine, Scale, ArrowUpRight } from 'lucide-react';
const levels = [
  { name: 'Easy', counts: '3 suspects · 5 clues · 2 hints', base: 100 },
  { name: 'Medium', counts: '4 suspects · 7 clues · 3 hints', base: 150 },
  { name: 'Hard', counts: '5 suspects · 9 clues · 3 hints', base: 200 },
];
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
      <section className="grid items-center gap-12 pb-16 pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> The detective’s desk is yours
          </p>
          <h1 className="mt-7 font-display text-[clamp(3.2rem,6.5vw,5.6rem)] leading-[1.04] tracking-[-.045em]">
            Everyone has
            <br />a story.
            <br />
            <em className="font-normal text-gold">
              Someone has
              <br className="hidden sm:block" /> a secret.
            </em>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted">
            An original mystery. A room full of suspects. One chance to get it right. Follow your
            curiosity and uncover a case written just for you.
          </p>
          <Link to="/create" className="btn-primary mt-8">
            Start investigation <ArrowRight size={17} />
          </Link>
          <p className="mt-4 text-[11px] tracking-wide text-muted">
            No sign-up. Just your instincts.
          </p>
        </div>
        <div
          className="relative mx-auto w-full max-w-[460px] py-5"
          aria-label="Decorative illustration of a detective case file"
        >
          <div className="absolute inset-10 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative rotate-[-3deg] rounded-sm border border-[#b5a888]/40 bg-[#d4c8aa] p-7 text-[#302e26] shadow-2xl sm:p-9">
            <div className="flex items-center justify-between border-b border-[#302e26]/30 pb-4">
              <span className="font-mono text-[10px] tracking-[.2em]">PRIVATE & CONFIDENTIAL</span>
              <span className="border-2 border-[#8b3b2f] px-2 py-1 text-[10px] font-bold tracking-widest text-[#8b3b2f]">
                UNSOLVED
              </span>
            </div>
            <p className="mt-7 font-mono text-[10px] tracking-widest">
              BELLWEATHER INVESTIGATIONS / 001
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight">
              The truth is
              <br />
              in the details.
            </h2>
            <div className="my-7 grid grid-cols-[1fr_1.1fr] items-center gap-4">
              <div className="relative flex aspect-square items-center justify-center border-[7px] border-[#eee7d7] bg-[#29312a] shadow-lg">
                <Fingerprint className="text-[#b2b8a6]" size={93} strokeWidth={0.8} />
                <span className="absolute -bottom-5 -right-5 rotate-12 border border-[#8b3b2f] bg-[#d4c8aa] px-2 py-1 font-mono text-[9px] text-[#8b3b2f]">
                  EXHIBIT A
                </span>
              </div>
              <div className="space-y-4 font-mono text-[10px]">
                <p>
                  01 / READ BETWEEN
                  <br />
                  <span className="ml-7">THE LINES</span>
                </p>
                <div className="h-px bg-[#302e26]/20" />
                <p>
                  02 / QUESTION
                  <br />
                  <span className="ml-7">EVERYTHING</span>
                </p>
                <div className="h-px bg-[#302e26]/20" />
                <p>
                  03 / TRUST THE
                  <br />
                  <span className="ml-7">EVIDENCE</span>
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between border-t border-[#302e26]/30 pt-5">
              <div>
                <p className="font-mono text-[9px] tracking-widest">ASSIGNED TO</p>
                <p className="mt-1 font-display text-2xl italic">Detective, that’s you.</p>
              </div>
              <Search size={28} strokeWidth={1} />
            </div>
          </div>
          <div className="absolute -bottom-3 right-0 rotate-[4deg] border border-paper/15 bg-[#222b24] px-5 py-4 shadow-xl">
            <p className="text-[9px] uppercase tracking-[.18em] text-muted">Your next case</p>
            <p className="mt-1 font-display text-lg text-gold">Entirely your own.</p>
          </div>
        </div>
      </section>
      <section className="border-y border-paper/10 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">A good detective follows a process</p>
          <span className="font-mono text-[10px] text-muted">THREE STEPS. ONE TRUTH.</span>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: PenLine,
              title: 'Set the scene',
              text: 'A midnight train. A missing heirloom. Give us a premise; we’ll write the mystery.',
            },
            {
              icon: Search,
              title: 'Follow the evidence',
              text: 'Meet the suspects, uncover clues, and connect the details that don’t quite add up.',
            },
            {
              icon: Scale,
              title: 'Make your accusation',
              text: 'Choose your suspect. Reveal the truth. See how your detective work measures up.',
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <article key={title}>
              <div className="mb-4 flex items-center gap-3">
                <Icon size={20} className="text-gold" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-muted">0{i + 1}</span>
              </div>
              <h2 className="font-display text-xl">{title}</h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Pick your challenge</p>
            <h2 className="mt-3 font-display text-3xl">How sharp are your instincts?</h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {levels.map((l) => (
            <Link
              to={`/create?difficulty=${l.name.toLowerCase()}`}
              key={l.name}
              className="group rounded border border-paper/15 p-5 transition hover:border-gold/60 hover:bg-gold/5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl">{l.name}</h3>
                <ArrowUpRight
                  size={16}
                  className="text-gold transition group-hover:-translate-y-1"
                />
              </div>
              <p className="mt-3 text-xs text-muted">{l.counts}</p>
              <p className="mt-4 text-[11px] text-gold">{l.base} points for a correct accusation</p>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted">
          Every clue: +5 points <span className="px-2">/</span> Every hint: −10 points{' '}
          <span className="px-2">/</span> One final accusation
        </p>
      </section>
    </main>
  );
}
