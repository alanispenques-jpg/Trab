import { useState } from 'react';
import { HomeView, type ActiveRoute } from './components/HomeView';
import { IntegrationModule } from './components/IntegrationModule';
import { LeastSquaresModule } from './components/LeastSquaresModule';
import { OdeModule } from './components/OdeModule';

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('home');
  const [decimals, setDecimals] = useState<number>(4);

  const navigateTo = (next: ActiveRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrimaryHeaderAction = () => {
    if (route === 'home') {
      navigateTo('ode');
      return;
    }
    const formEl = document.getElementById('module-calc-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = formEl.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input:not([type="checkbox"]), select'
      );
      firstInput?.focus({ preventScroll: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-[#14264b]">
      {/* Subtle Top Gradient Bar */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-[#14264b] via-[#2457e8] via-60% to-[#7955d9]"
      />

      {/* Compact 3-Zone Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Visual Brand Mark + Title */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457e8] rounded-lg"
          >
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#7955d9] text-white inline-flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path
                  d="M4 17C6.5 17 7.5 7 11.5 7C15.5 7 15.5 15 20 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 19.5H20"
                  stroke="#24b8d5"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="11.5" cy="7" r="2" fill="#24b8d5" />
              </svg>
            </span>
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-[#14264b] group-hover:text-[#2457e8] transition-colors duration-150">
              Calculadora de Métodos Numéricos
            </span>
          </button>

          {/* Zone 2: Single-line Primary Navigation */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {(
              [
                ['home', 'Início'],
                ['ode', 'EDOs'],
                ['least-squares', 'Mínimos Quadrados'],
                ['integration', 'Integração Numérica'],
              ] as const
            ).map(([id, label]) => {
              const active = route === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigateTo(id)}
                  className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2457e8] rounded-sm ${
                    active
                      ? 'text-[#2457e8] font-semibold'
                      : 'text-slate-600 hover:text-[#14264b]'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#2457e8] to-[#7955d9] transition-opacity duration-150 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Highlighted Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handlePrimaryHeaderAction}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#2457e8] to-[#7955d9] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457e8]"
            >
              Iniciar cálculo
            </button>
          </div>
        </div>

        {/* Compact Mobile Navigation Row */}
        <nav
          aria-label="Navegação mobile"
          className="md:hidden border-t border-slate-100 px-4 py-1.5 flex items-center gap-5 overflow-x-auto text-xs font-medium bg-white/95"
        >
          {(
            [
              ['home', 'Início'],
              ['ode', 'EDOs'],
              ['least-squares', 'Mínimos Quadrados'],
              ['integration', 'Integração Numérica'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => navigateTo(id)}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                route === id
                  ? 'border-[#2457e8] text-[#2457e8] font-semibold'
                  : 'border-transparent text-slate-600 hover:text-[#14264b]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content with Smooth Page Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-9">
        <div key={route} className="animate-page-enter">
          {route === 'home' && <HomeView onSelectModule={navigateTo} />}
          {route === 'ode' && (
            <OdeModule
              decimals={decimals}
              onDecimalsChange={setDecimals}
              onBackHome={() => navigateTo('home')}
              onSwitchModule={navigateTo}
            />
          )}
          {route === 'least-squares' && (
            <LeastSquaresModule
              decimals={decimals}
              onDecimalsChange={setDecimals}
              onBackHome={() => navigateTo('home')}
              onSwitchModule={navigateTo}
            />
          )}
          {route === 'integration' && (
            <IntegrationModule
              decimals={decimals}
              onDecimalsChange={setDecimals}
              onBackHome={() => navigateTo('home')}
              onSwitchModule={navigateTo}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/85 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span className="font-semibold text-[#14264b]">Calculadora de Métodos Numéricos</span>
          <span>EDOs · Mínimos Quadrados · Integração Numérica</span>
        </div>
      </footer>
    </div>
  );
}
