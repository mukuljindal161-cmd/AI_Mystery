import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/UI';
import Home from './pages/Home';
import CreateMystery from './pages/CreateMystery';
import InvestigationRoom from './pages/InvestigationRoom';
import Accusation from './pages/Accusation';
import Results from './pages/Results';
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gold focus:p-4 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="content" className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateMystery />} />
          <Route path="/case/:id" element={<InvestigationRoom />} />
          <Route path="/case/:id/accuse" element={<Accusation />} />
          <Route path="/case/:id/result" element={<Results />} />
          <Route
            path="*"
            element={
              <main className="page">
                <p className="eyebrow">404 / A dead end</p>
                <h1 className="page-title">This trail goes cold.</h1>
                <p className="mb-8 text-muted">The page you’re looking for isn’t in our files.</p>
                <Link className="btn-primary" to="/">
                  Back to home
                </Link>
              </main>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
