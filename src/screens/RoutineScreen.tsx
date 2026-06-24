import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, SectionTitle, IconBubble } from '../components/ui';
import { RoutineItem } from '../types';
import { Plus, CheckCircle2, Circle, Edit2, Maximize2, Trash2, ArrowUp, ArrowDown, Minimize2, Printer, Sparkles, Trophy, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useFeedback } from '../components/FeedbackModal';
import { safeArray, getVisualIcon, printSection } from '../utils';

const EMOJI_OPTIONS = ['🌟', '🍎', '🛏️', '🚿', '👕', '🦷', '📚', '🎒', '🧩', '🎨', '🚽', '🚗', '🍽️', '🥛', '🧸', '☀️', '🌙', '👟', '📺', '📱', '💬', '🩺'];

export function RoutineScreen() {
  const { state, getActiveProfile, addRoutineItem, updateRoutineItem, deleteRoutineItem, toggleRoutineItem } = useAppStore();
  const profile = getActiveProfile();
  const { showError, FeedbackComponent } = useFeedback();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  
  const [form, setForm] = useState<Partial<RoutineItem>>({
    title: '',
    time: '08:00',
    iconName: '🌟',
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const profileItems = safeArray(state.routineItems)
                         .filter(r => r.childId === profile?.id)
                         .sort((a, b) => {
                           if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                           return a.time.localeCompare(b.time);
                         });

  const completedCount = profileItems.filter(item => {
    const dates = Array.isArray(item.completedDates) ? item.completedDates : (item.completedAt && item.completedAt.startsWith(todayStr) ? [todayStr] : []);
    return dates.includes(todayStr);
  }).length;
  
  const progressPercent = profileItems.length > 0 ? Math.round((completedCount / profileItems.length) * 100) : 0;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === profileItems.length - 1)) return;
    const newItems = [...profileItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    
    // Update all items in DB with new order
    newItems.forEach((item, i) => {
      updateRoutineItem(item.id, { order: i });
    });
  };

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm({ title: '', time: '08:00', iconName: '🌟' });
  };

  const handleSave = () => {
    if (!form.title) return showError('Erro', 'Por favor, insira o título da atividade.');
    
    if (editingId) {
      updateRoutineItem(editingId, form);
    } else {
      addRoutineItem({
        id: crypto.randomUUID(),
        childId: profile?.id!,
        order: profileItems.length,
        ...(form as RoutineItem)
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (item: RoutineItem) => {
    setForm(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteData({ id, name: title });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
      deleteRoutineItem(deleteData.id);
      setDeleteData(null);
    }
  };

  if (isFullscreen) {
    // Large child-friendly mode
    return (
      <div className="fixed inset-0 z-50 bg-[#fbfcfd] flex flex-col items-center justify-start p-6 overflow-y-auto">
        <div className="w-full max-w-md flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👦👧</span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Vou Fazer Sozinho!</h2>
          </div>
          <button 
            onClick={() => setIsFullscreen(false)} 
            className="px-4 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-50 rounded-2xl transition-all cursor-pointer border-2 border-rose-100"
          >
            Sair
          </button>
        </div>

        {profileItems.length > 0 && (
          <div className="w-full max-w-md mt-5 p-4 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center gap-4">
             <div className="p-3 bg-emerald-200/50 rounded-2xl text-2xl">🏆</div>
             <div className="flex-1 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Seu Progresso</span>
                <p className="text-xl font-black text-emerald-900 leading-tight">{completedCount} de {profileItems.length} Feito!</p>
             </div>
          </div>
        )}

        <div className="w-full max-w-md space-y-4 mt-6 pb-32">
           {profileItems.map(item => {
             const dates = Array.isArray(item.completedDates) ? item.completedDates : (item.completedAt && item.completedAt.startsWith(todayStr) ? [todayStr] : []);
             const isCompleted = dates.includes(todayStr);
             return (
               <div 
                 key={item.id}
                 onClick={() => toggleRoutineItem(item.id, todayStr)}
                 className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all transform active:scale-97 cursor-pointer text-left ${
                   isCompleted 
                     ? 'bg-emerald-50/50 border-emerald-200 opacity-80' 
                     : 'bg-white border-slate-100 hover:border-slate-300 shadow-md'
                 }`}
               >
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-all ${isCompleted ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                   <span role="img" aria-label="Icon">{getVisualIcon(item.iconName)}</span>
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.time}</span>
                   <h3 className={`text-lg font-black tracking-tight leading-tight transition-all truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</h3>
                 </div>

                 <div className="shrink-0">
                   {isCompleted 
                     ? <CheckCircle2 className="w-9 h-9 text-emerald-600" /> 
                     : <div className="w-9 h-9 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white" />
                   }
                 </div>
               </div>
             )
           })}

           {profileItems.length === 0 && (
              <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 font-bold">Nenhuma rotina cadastrada ainda.</p>
              </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 max-w-lg mx-auto">
      {/* Sticky Top Header bar */}
      <div className="bg-white px-5 py-4 border-b border-[#f1f3f7] flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Estrutura Visual & Autonomia</span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Rotina Diária</h1>
        </div>
        <div className="flex gap-2">
          {!isAdding && (
            <button 
              onClick={() => printSection('print-routine', 'Rotina Visual')} 
              className="p-3 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors cursor-pointer"
              title="Anotar impressões / Imprimir"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}
          {!isAdding && (
            <button 
              onClick={() => setIsFullscreen(true)} 
              className="p-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-100 transition-colors cursor-pointer"
              title="Modo Criança (Tela Cheia)"
            >
              <Maximize2 className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}
          {!isAdding && (
            <button 
              onClick={handleOpenAdd} 
              className="p-3 text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md transition-colors cursor-pointer"
              title="Nova Atividade"
            >
              <Plus className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isAdding ? (
          <Card className="space-y-4 p-6 shadow-lg border border-[#e2e8f0] text-left">
             <h2 className="text-base font-extrabold text-slate-800 border-b pb-3 border-[#f1f3f7]">{editingId ? '📝 Editar Passo de Rotina' : '🌟 Novo Passo de Rotina'}</h2>
             
             <div>
               <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2">Escolha uma Ilustração Visual</label>
               <div className="flex flex-wrap gap-2.5 p-3.5 border border-[#f1f3f7] rounded-3xl bg-slate-50/50 justify-center">
                 {EMOJI_OPTIONS.map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => setForm({...form, iconName: emoji})}
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-2xl transition-transform active:scale-95 cursor-pointer ${form.iconName === emoji ? 'bg-white shadow-md border-2 border-[#2563eb] scale-105' : 'hover:bg-slate-100 border border-transparent'}`}
                    >
                      {emoji}
                    </button>
                 ))}
               </div>
             </div>

             <Input label="Ação ou Título da Atividade" placeholder="Ex: Escovar os dentes, Guardar brinquedos..." value={form.title} onChange={e => setForm(s => ({...s, title: e.target.value}))} />
             <Input type="time" label="Horário Previsto" value={form.time} onChange={e => setForm(s => ({...s, time: e.target.value}))} />
             
             <div className="flex gap-3 pt-4 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSave}>Salvar na Rotina</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            </div>
          </Card>
        ) : (
          <div id="print-routine" className="space-y-4">
             {/* Print header */}
             <div className="hidden print:block text-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold">Rotina Visual</h2>
                <p className="text-gray-600">Criança: {profile.name}</p>
             </div>
             
             {/* Progress Box */}
             {profileItems.length > 0 && (
                <div className="bg-white p-4.5 rounded-3xl shadow-xs border border-[#f1f3f7] flex items-center justify-between print:hidden gap-4">
                    <div className="flex-grow text-left">
                       <p className="text-xs font-black text-slate-700 mb-1.5">{completedCount} de {profileItems.length} atividades concluídas hoje</p>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-[#2563eb] rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
                       </div>
                    </div>
                    <div className="text-lg font-black text-[#2563eb] bg-[#2563eb]/10 px-3.5 py-2 rounded-2xl">{progressPercent}%</div>
                </div>
             )}

            {/* Routine Steps List */}
            {profileItems.map((item, index) => {
               const dates = Array.isArray(item.completedDates) ? item.completedDates : (item.completedAt && item.completedAt.startsWith(todayStr) ? [todayStr] : []);
               const isCompleted = dates.includes(todayStr);
               return (
                  <Card key={item.id} className={`p-4 flex flex-col gap-2.5 shadow-sm border transition-all cursor-pointer ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'border-[#f1f3f7] bg-white hover:border-slate-200'}`}>
                     <div className="flex items-center gap-4">
                       <div 
                         onClick={() => toggleRoutineItem(item.id, todayStr)}
                         className="p-1 touch-manipulation transform active:scale-90 transition-transform"
                         role="button"
                         aria-label={isCompleted ? "Marcar como não concluído" : "Marcar como concluído"}
                       >
                         {isCompleted ? <CheckCircle2 className="w-8 h-8 text-emerald-600 transition-all duration-300" /> : <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center hover:border-slate-300 transition-colors" />}
                       </div>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-opacity duration-300 ${isCompleted ? 'bg-emerald-100 opacity-60' : 'bg-slate-50'}`}>
                          {getVisualIcon(item.iconName)}
                       </div>
                       <div className="flex-1 min-w-0 transition-opacity duration-300 text-left">
                         <h3 className={`font-black text-sm tracking-tight leading-snug truncate transition-all duration-300 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</h3>
                         <p className={`text-[10px] uppercase tracking-wider font-extrabold mt-0.5 transition-all duration-300 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>{item.time}</p>
                       </div>
                     </div>
                     
                     <div className={`flex items-center justify-between pt-1 border-t transition-colors duration-300 ${isCompleted ? 'border-emerald-100/50' : 'border-[#f1f3f7]'}`}>
                        <div className="flex items-center gap-1.5">
                           <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className={`p-2 transition-colors ${index === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-700'} cursor-pointer`} aria-label="Mover para cima">
                             <ArrowUp className="w-4 h-4 stroke-[2.5px]" />
                           </button>
                           <button onClick={() => handleMove(index, 'down')} disabled={index === profileItems.length - 1} className={`p-2 transition-colors ${index === profileItems.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-700'} cursor-pointer`} aria-label="Mover para baixo">
                             <ArrowDown className="w-4 h-4 stroke-[2.5px]" />
                           </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" aria-label="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer" aria-label="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                  </Card>
               )
            })}
            
            {profileItems.length === 0 && (
               <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
                 <ListChecks className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                 <p className="text-xs text-slate-400 font-bold">Nenhuma atividade de rotina criada.</p>
                 <button onClick={handleOpenAdd} className="mt-2 text-[#2563eb] text-xs font-black underline cursor-pointer">Adicionar Primeira Atividade</button>
               </div>
            )}

            {profileItems.length > 0 && (
               <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest pt-4">
                 Dica: Ordene a lista pelas setas acima.
               </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Atividade"
        itemName={deleteData?.name || 'esta atividade'}
      />
      {FeedbackComponent()}
    </div>
  );
}
