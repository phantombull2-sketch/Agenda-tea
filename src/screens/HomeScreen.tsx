import React, { useRef } from 'react';
import { useAppStore } from '../store';
import { format, addDays } from 'date-fns';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, FileText, BadgeInfo, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Sparkles, Stethoscope, Scissors } from 'lucide-react';
import { Tab } from '../components/Layout';
import { safeArray, getVisualIcon } from '../utils';
import { Card, SectionTitle, IconBubble, Badge, Button } from '../components/ui';

export function HomeScreen({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const { state, getActiveProfile, toggleRoutineItem, syncStatus, isDemoActive, enterDemoMode } = useAppStore();
  const profile = getActiveProfile();
  
  const routineScrollRef = useRef<HTMLDivElement>(null);

  const scrollRoutine = (direction: 'left' | 'right') => {
    if (routineScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      routineScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayDayOfWeek = new Date().getDay();

  // Therapies for today for active profile
  const todaysTherapies = safeArray(state.therapies).filter(t => t.dayOfWeek === todayDayOfWeek && t.childId === profile.id);

  // Routine for today for active profile
  const todaysRoutine = safeArray(state.routineItems)
                         .filter(r => r.childId === profile.id)
                         .sort((a, b) => a.time.localeCompare(b.time));

  // Appointments
  const appointments = safeArray(state.appointments).filter(a => a.childId === profile.id && a.status !== 'Cancelada' && a.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  
  const proximaConsulta = appointments.find(a => a.type === 'Consulta médica' || a.type === 'Retorno');
  const proximoExame = appointments.find(a => a.type === 'Exame');

  // Next therapy (approx)
  let proximaTerapia = null;
  let prevDateInfo = null;
  for (let i = 0; i < 7; i++) {
     const checkDate = addDays(new Date(), i);
     const checkDateStr = format(checkDate, 'yyyy-MM-dd');
     const dWeek = checkDate.getDay();
     const ths = safeArray(state.therapies).filter(t => t.childId === profile.id && t.dayOfWeek === dWeek);
     if (ths.length > 0) {
        proximaTerapia = ths.sort((a,b) => a.time.localeCompare(b.time))[0];
        prevDateInfo = checkDateStr;
        break;
     }
  }

  const getRecentDiary = () => {
    const sorted = [...safeArray(state.diaryEntries)].filter(e => e.childId === profile.id).sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]; // Last entry
  };
  const recentDiary = getRecentDiary();

  const getExpiringDocs = () => {
    const today = new Date();
    const in30Days = addDays(today, 30);
    return safeArray(state.documents).filter(d => d.childId === profile.id).filter(d => {
      if (!d.expirationDate) return false;
      const expDate = new Date(d.expirationDate + 'T12:00:00');
      return expDate <= in30Days;
    }).sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime());
  };
  const expiringDocs = getExpiringDocs();

  return (
    <div className="p-5 pb-32 space-y-6 max-w-lg mx-auto">
      {/* Header Premium */}
      <header className="flex justify-between items-center pt-2">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Painel Diário</span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agenda Azul</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {syncStatus === 'Sincronizado' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-500 animate-pulse"/>
                Sincronizado
              </span>
            )}
            {syncStatus === 'Salvando...' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] text-blue-700 font-bold">
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin"/>
                Sincronizando...
              </span>
            )}
            {syncStatus === 'Sem conexão' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-bold">
                <WifiOff className="w-3 h-3 text-slate-400"/>
                Modo Offline
              </span>
            )}
            {syncStatus === 'Erro' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[10px] text-rose-700 font-bold">
                <AlertTriangle className="w-3 h-3 text-rose-500"/>
                Erro ao salvar
              </span>
            )}
          </div>
        </div>

        {/* Profile Picture Bubble */}
        <div 
          onClick={() => onNavigate && onNavigate('profile')}
          className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          {profile.photoData || profile.photoUrl ? (
            <img src={profile.photoData || profile.photoUrl} alt="Criança" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-[#1d4ed8] flex items-center justify-center text-sm font-bold text-white uppercase">
              {profile.name ? profile.name.substring(0, 2) : 'A'}
            </div>
          )}
        </div>
      </header>

      {/* Child Profile summary Card (Passport Access) */}
      <Card 
        className="bg-gradient-to-tr from-[#1e40af] to-[#2563eb] text-white p-6 shadow-xl border-none relative overflow-hidden group cursor-pointer"
        onClick={() => onNavigate && onNavigate('passport')}
        role="button"
        aria-label="Acesso Rápido ao Passaporte TEA"
      >
        {/* Subtle Decorative Circle */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner text-white overflow-hidden border border-white/20">
              {profile.photoData || profile.photoUrl ? (
                <img src={profile.photoData || profile.photoUrl} alt="Criança" className="w-full h-full object-cover" />
              ) : (
                <span>🧒</span>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest font-extrabold uppercase text-blue-200">Passaporte Ativo</span>
              <h3 className="font-extrabold text-xl leading-tight">{profile.name || 'Criança'}</h3>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {profile.supportLevel && (
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-xs text-[10px] text-white font-extrabold rounded-lg">
                    {profile.supportLevel}
                  </span>
                )}
                {profile.verbalState && (
                  <span className="px-2 py-0.5 bg-white/10 backdrop-blur-xs text-[10px] text-blue-100 font-extrabold rounded-lg">
                    {profile.verbalState}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 bg-white/15 hover:bg-white/25 rounded-2xl transition-colors">
            <BadgeInfo className="w-5 h-5 text-white animate-bounce-slow" />
            <span className="text-[8px] font-black text-blue-100 tracking-wider uppercase mt-1">Ver</span>
          </div>
        </div>
      </Card>

      {/* Demo Mode Activation Card */}
      {!isDemoActive && (
        <Card className="bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/50 p-5 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-blue-800 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Experimente com dados demonstrativos!</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Ative o Modo de Demonstração para testar recursos com os perfis prontos de <strong>Lucas</strong> e <strong>Sofia</strong>.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => enterDemoMode()}
            className="w-full md:w-auto text-xs active:scale-95 font-bold whitespace-nowrap"
          >
            Entrar em Demonstração
          </Button>
        </Card>
      )}

      {/* Routine Highlight */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SectionTitle>Rotina de Hoje</SectionTitle>
            {todaysRoutine.length > 2 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => scrollRoutine('left')} 
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
                <button 
                  onClick={() => scrollRoutine('right')} 
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Próximo"
                >
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
              </div>
            )}
          </div>
          <span className="text-xs font-black text-slate-500 bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe] px-2.5 py-1 rounded-xl">
            {todaysRoutine.filter(r => {
              const dates = Array.isArray(r.completedDates) ? r.completedDates : (r.completedAt && r.completedAt.startsWith(todayStr) ? [todayStr] : []);
              return dates.includes(todayStr);
            }).length} / {todaysRoutine.length} concluído(s)
          </span>
        </div>
        
        <div 
          ref={routineScrollRef} 
          className="flex space-x-3.5 overflow-x-auto pb-4 pt-1 custom-scrollbar cursor-grab active:cursor-grabbing select-none touch-pan-x"
          onMouseDown={(e) => {
            const ele = routineScrollRef.current;
            if (!ele) return;
            // Record start positions
            const startX = e.pageX - ele.offsetLeft;
            const scrollLeft = ele.scrollLeft;
            let isDragging = false;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              isDragging = true;
              const x = moveEvent.pageX - ele.offsetLeft;
              const walk = (x - startX) * 1.4; // Scroll speed multiplier
              ele.scrollLeft = scrollLeft - walk;
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              
              // If we dragged, prevent the child click handler from firing on mouse release
              if (isDragging) {
                const preventClick = (clickEvent: MouseEvent) => {
                  clickEvent.stopImmediatePropagation();
                  ele.removeEventListener('click', preventClick, true);
                };
                ele.addEventListener('click', preventClick, true);
              }
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {todaysRoutine.map(item => {
            const dates = Array.isArray(item.completedDates) ? item.completedDates : (item.completedAt && item.completedAt.startsWith(todayStr) ? [todayStr] : []);
            const isCompleted = dates.includes(todayStr);
            return (
              <div 
                key={item.id}
                onClick={() => {
                  toggleRoutineItem(item.id, todayStr);
                }}
                className={`flex-shrink-0 w-28 h-[135px] rounded-3xl border flex flex-col items-center justify-between p-3.5 transition-all duration-300 transform active:scale-95 cursor-pointer relative ${
                  isCompleted 
                    ? 'bg-emerald-50/75 border-emerald-100 shadow-[0_4px_16px_rgba(16,185,129,0.03)]'
                    : 'bg-white border-[#f1f3f7] shadow-[0_8px_30px_rgb(28,52,106,0.02)] hover:border-slate-300'
                }`}
              >
                {/* Complete checkbox bubble */}
                <div 
                  className="absolute top-2.5 right-2.5 p-0.5 touch-manipulation z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRoutineItem(item.id, todayStr);
                  }}
                  role="button"
                  aria-label={isCompleted ? "Marcar como não concluído" : "Marcar como concluído"}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-transform scale-110" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white hover:border-[#2563eb] transition-colors" />
                  )}
                </div>

                <div className={`text-3.5xl mt-2 transition-transform duration-300 ${isCompleted ? 'opacity-40 scale-90' : 'scale-110 animate-bounce-slow'}`}>
                   {getVisualIcon(item.iconName)}
                </div>
                
                <div className="w-full text-center">
                  <p className={`text-[10px] font-black uppercase tracking-wide leading-tight line-clamp-2 px-0.5 ${
                    isCompleted 
                      ? 'text-emerald-700/60 line-through' 
                      : 'text-slate-700'
                  }`}>
                    {item.title}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">{item.time}</p>
                </div>
              </div>
            );
          })}
          {todaysRoutine.length === 0 && (
             <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-200 w-full text-center text-slate-400 text-xs py-8">
               Nenhum item adicionado na rotina de hoje. Adicione clicando em "Rotina" abaixo.
             </div>
          )}
        </div>
      </section>

      {/* Agenda Highlight */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <SectionTitle>Próximos Eventos</SectionTitle>
        </div>
        
        <div className="grid gap-3">
           {proximaTerapia ? (
             <Card hoverable className="p-4 bg-white hover:border-[#2563eb]/20 flex items-center justify-between">
               <div className="flex items-center space-x-3.5 text-left">
                 <IconBubble icon={<Calendar />} variant="blue" />
                 <div>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block">Próxima Terapia</span>
                    <p className="font-extrabold text-sm text-slate-800 leading-snug">{proximaTerapia.type}</p>
                    {prevDateInfo && (
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {format(new Date(prevDateInfo+'T12:00:00'), 'dd/MM')} — {proximaTerapia.time}
                      </p>
                    )}
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-300" />
             </Card>
           ) : (
             <div className="bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                 <p className="text-xs text-slate-400 font-bold">Nenhuma terapia agendada para os próximos 7 dias.</p>
             </div>
           )}

           {proximaConsulta && (
             <Card hoverable className="p-4 bg-white hover:border-indigo-100 flex items-center justify-between">
               <div className="flex items-center space-x-3.5 text-left">
                 <IconBubble icon={<Stethoscope className="w-5 h-5" />} variant="indigo" />
                 <div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">Próxima Consulta</span>
                    <p className="font-extrabold text-sm text-slate-800 leading-snug">{proximaConsulta.title || proximaConsulta.type}</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {format(new Date(proximaConsulta.date+'T12:00:00'), 'dd/MM')} — {proximaConsulta.time}
                    </p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-300" />
             </Card>
           )}

           {proximoExame && (
             <Card hoverable className="p-4 bg-white hover:border-purple-100 flex items-center justify-between">
               <div className="flex items-center space-x-3.5 text-left">
                 <IconBubble icon={<FileText />} variant="purple" />
                 <div>
                    <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest block font-sans">Próximo Exame/Laudo</span>
                    <p className="font-extrabold text-sm text-slate-800 leading-snug">{proximoExame.title || proximoExame.type}</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {format(new Date(proximoExame.date+'T12:00:00'), 'dd/MM')} — {proximoExame.time}
                    </p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-300" />
             </Card>
           )}
        </div>
      </section>

      {/* Alertas & Registros */}
      <section className="space-y-3">
        <SectionTitle>Alertas & Avisos</SectionTitle>
        
        <div className="space-y-2.5">
          {recentDiary && (
            <Card className="p-4 text-left border border-[#f1f3f7] hover:border-indigo-100">
              <div className="flex justify-between items-start mb-1.5">
                <span className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                  Último registro de diário — {format(new Date(recentDiary.date + 'T12:00:00'), "dd/MM")}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed line-clamp-2">
                {recentDiary.behavior || 'Nenhuma nota especial.'}
              </p>
            </Card>
          )}

          {expiringDocs.map(d => (
             <Card key={d.id} className="p-4 bg-rose-50/50 border-rose-100 flex items-start space-x-3 text-left">
               <div className="p-2.5 bg-rose-50 rounded-2xl shrink-0">
                  <FileText className="w-5 h-5 text-rose-500" />
               </div>
               <div className="flex-1 space-y-0.5">
                 <p className="text-xs font-black text-rose-900 leading-tight line-clamp-1">{d.title}</p>
                 <p className="text-[10px] text-rose-600 font-bold">
                   Atenção — Vence em: {format(new Date(d.expirationDate! + 'T12:00:00'), 'dd/MM/yyyy')}
                 </p>
               </div>
             </Card>
          ))}

          {!recentDiary && expiringDocs.length === 0 && (
            <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-xs py-8">
               Tudo certo por aqui! Sem alertas ou pendências urgentes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
