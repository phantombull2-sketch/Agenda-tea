import React from 'react';
import { Home, CalendarClock, Notebook, ListTodo, MoreHorizontal, User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';

export type Tab = 'home' | 'therapies' | 'diary' | 'routine' | 'more' | 'documents' | 'profile' | 'passport' | 'medications' | 'crises' | 'reports';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { state, switchProfile, getActiveProfile, isDemoActive, exitDemoMode } = useAppStore();
  const profiles = state.profiles || [];
  const activeProfile = getActiveProfile();
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Hoje', icon: <Home /> },
    { id: 'therapies', label: 'Agenda', icon: <CalendarClock /> },
    { id: 'diary', label: 'Diário', icon: <Notebook /> },
    { id: 'routine', label: 'Rotina', icon: <ListTodo /> },
    { id: 'more', label: 'Mais', icon: <MoreHorizontal /> },
  ];

  const getChildEmoji = (name: string) => {
    const lowercase = (name || '').toLowerCase();
    if (lowercase.includes('sofia')) return '👧';
    if (lowercase.includes('lucas')) return '👦';
    return '🧒';
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden print:h-auto print:overflow-visible relative">
      
      {/* Demo Mode Banner */}
      {isDemoActive && (
        <div className="bg-[#eff6ff] text-[#1e40af] border-b border-[#bfdbfe] py-2 px-4 flex justify-between items-center text-xs font-semibold print:hidden flex-shrink-0 z-50 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Modo demonstração — dados fictícios</span>
            </span>
          </div>
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="text-[#2563eb] hover:text-[#1d4ed8] font-bold hover:underline bg-transparent border-none cursor-pointer transition-all text-xs"
          >
            Sair do modo demonstração
          </button>
        </div>
      )}

      {/* Global Profile Selector Bar */}
      <div className="flex-shrink-0 bg-white border-b border-[#f1f3f7] py-3.5 px-4 flex items-center gap-3 overflow-x-auto hide-scrollbar z-40 shadow-xs print:hidden">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Filho(a):</span>
         <div className="flex items-center gap-2">
           {profiles.map(p => {
              const isActive = activeProfile.id === p.id;
              const emoji = getChildEmoji(p.name);
              return (
                <button 
                   key={p.id}
                   onClick={() => switchProfile(p.id)}
                   className={cn(
                      "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all relative overflow-hidden",
                      isActive 
                         ? "bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/20 shadow-xs scale-102 scale-105" 
                         : "bg-stone-50 text-slate-500 border border-transparent hover:bg-stone-100"
                   )}
                >
                   <span className="text-base">{emoji}</span>
                   <span>{p.name || 'Sem nome'}</span>
                   {isActive && (
                     <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-[#2563eb] rounded-full" />
                   )}
                </button>
              );
           })}
         </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24 print:overflow-visible print:pb-0 relative">
        {children}
      </main>

      {/* Improved Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-[#f1f3f7] shadow-[0_-8px_30px_rgba(28,52,106,0.04)] pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] print:hidden z-50">
        <div className="flex justify-around items-center px-4 h-14 max-w-lg mx-auto">
           {tabs.map((tab) => {
             const isActive = activeTab === tab.id || 
               (tab.id === 'more' && ['more', 'documents', 'profile', 'passport', 'medications', 'crises', 'reports', 'technical'].includes(activeTab));
             
             return (
               <button
                 key={tab.id}
                 onClick={() => onTabChange(tab.id)}
                 className="flex flex-col items-center justify-center w-16 h-full relative group cursor-pointer"
               >
                 <div className={cn(
                   "flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-300",
                   isActive 
                     ? "bg-[#2563eb]/10 text-[#2563eb] scale-105" 
                     : "text-[#64748b] hover:text-[#2563eb]"
                 )}>
                    {React.cloneElement(tab.icon as React.ReactElement<any>, { className: cn("w-[22px] h-[22px] transition-transform group-active:scale-90", isActive ? "stroke-[2.5px]" : "stroke-[2px]") })}
                 </div>
                 <span className={cn(
                   "text-[9px] font-bold mt-1 tracking-wide transition-colors duration-200",
                   isActive ? "text-[#1e3a8a] font-extrabold" : "text-[#64748b]"
                 )}>
                   {tab.label}
                 </span>
               </button>
             );
           })}
        </div>
      </nav>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-[#f1f3f7] space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Sair do Modo de Demonstração</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Deseja apagar todas as alterações e dados fictícios de demonstração antes de voltar aos seus dados reais?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  exitDemoMode(true);
                  setShowExitConfirm(false);
                }}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm transition-colors cursor-pointer shadow-sm"
              >
                Sim, apagar dados fictícios
              </button>
              <button
                onClick={() => {
                  exitDemoMode(false);
                  setShowExitConfirm(false);
                }}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors cursor-pointer"
              >
                Não, manter dados fictícios
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2 px-4 bg-white text-slate-400 hover:text-slate-500 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
