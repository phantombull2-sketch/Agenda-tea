import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, Card, Input, Textarea, Select, SectionTitle, IconBubble } from '../components/ui';
import { ChevronLeft, Plus, AlertTriangle, Trash2, Calendar, Clock, Sparkles } from 'lucide-react';
import { Crisis } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { safeArray } from '../utils';

export function CrisesScreen({ onBack }: { onBack: () => void }) {
  const { state, getActiveProfile, addCrisis, deleteCrisis, updateCrisis } = useAppStore();
  const profile = getActiveProfile();
  const crises = safeArray(state.crises).filter(c => c.childId === profile.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const [form, setForm] = useState<Partial<Crisis>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    durationMins: 10,
    intensity: 'Moderada',
    trigger: '',
    description: '',
    resolution: ''
  });

  const handleSave = () => {
    if (!form.date) return;
    
    if (editingId) {
      updateCrisis(editingId, form);
    } else {
      addCrisis({
        id: crypto.randomUUID(),
        childId: profile.id,
        date: form.date || '',
        time: form.time || '',
        durationMins: form.durationMins || 0,
        intensity: form.intensity as any || 'Moderada',
        trigger: form.trigger || '',
        description: form.description || '',
        resolution: form.resolution || ''
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      durationMins: 10,
      intensity: 'Moderada',
      trigger: '',
      description: '',
      resolution: ''
    });
  };

  const handleEdit = (crisis: Crisis) => {
    setForm(crisis);
    setEditingId(crisis.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteData({ id, name });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
      deleteCrisis(deleteData.id);
      setDeleteData(null);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 max-w-lg mx-auto">
      {/* Sticky Header */}
      <div className="bg-white px-5 py-4 border-b border-[#f1f3f7] flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 -ml-2 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-rose-600">Acompanhamento de Gatilhos</span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Registro de Crises</h1>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="p-3 text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md transition-colors cursor-pointer"
            title="Registrar Crise"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {isAdding ? (
          <Card className="p-6 space-y-4 shadow-lg border border-[#e2e8f0] text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-base font-extrabold text-slate-800 border-b pb-3 border-[#f1f3f7]">{editingId ? '📝 Editar Crise' : '🚨 Registrar Crise Sensorial'}</h2>
            
            <div className="grid grid-cols-2 gap-4">
               <Input type="date" label="Data da Ocorrência" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
               <Input type="time" label="Hora do Início" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input type="number" label="Duração (Estimada min)" value={form.durationMins?.toString() || ''} onChange={e => setForm({...form, durationMins: parseInt(e.target.value) || 0})} />
               <Select 
                 label="Nível de Intensidade" 
                 value={form.intensity} 
                 onChange={e => setForm({...form, intensity: e.target.value as any})}
                 options={[
                   {label: 'Leve (Choro passageiro)', value: 'Leve'},
                   {label: 'Moderada (Gritos/Fuga)', value: 'Moderada'},
                   {label: 'Forte (Autoagressão/Choque)', value: 'Forte'},
                   {label: 'Severa (Prolongada)', value: 'Severa'}
                 ]}
                />
            </div>

            <Input label="Possível Gatilho / Causa" placeholder="Ex: Mudança repentina de trajeto, som de liquidificador..." value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})} />
            <Textarea label="Descrição do Comportamento" placeholder="Como começou? Como a criança reagiu fisicamente?..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <Textarea label="Como foi resolvida a crise?" placeholder="O que ajudou a autorregular (música, abraço proprietivo, isolamento)..." value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})} />

            <div className="flex gap-3 pt-5 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSave}>Salvar Registro</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancelar</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {crises.map(crisis => (
              <Card key={crisis.id} className="p-5 border-l-4 border-l-rose-500 text-left shadow-xs hover:border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                       Crise {crisis.intensity}
                    </h3>
                    <p className="text-[11px] font-black text-rose-600 mt-1 uppercase tracking-wider">
                      {crisis.date.split('-').reverse().join('/')} às {crisis.time} • Duração: {crisis.durationMins} min
                    </p>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => handleEdit(crisis)} className="px-3 py-1.5 bg-slate-50 border border-[#f1f3f7] hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer">Editar</button>
                     <button onClick={() => handleDelete(crisis.id, 'crise do dia ' + crisis.date.split('-').reverse().join('/'))} className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                {crisis.trigger && (
                  <div className="bg-rose-50/40 border border-rose-100 p-3.5 rounded-2xl mb-4 text-left">
                    <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest block mb-1">🎯 Possível Gatilho</span>
                    <p className="text-xs font-bold text-rose-900 leading-snug">{crisis.trigger}</p>
                  </div>
                )}
                
                {crisis.description && (
                  <div className="mb-3.5 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">👁️ Descrição Observada</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/40 border border-slate-100/70 p-3 rounded-2xl">{crisis.description}</p>
                  </div>
                )}

                {crisis.resolution && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">🛡️ Intervenção / Solução</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 border border-slate-100/70 p-3 rounded-2xl">{crisis.resolution}</p>
                  </div>
                )}
              </Card>
            ))}

            {crises.length === 0 && (
              <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
                <AlertTriangle className="w-9 h-9 text-rose-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Nenhuma crise registrada.</p>
                <button onClick={() => setIsAdding(true)} className="mt-2 text-[#2563eb] text-xs font-black underline cursor-pointer">Registrar Novo Gatilho</button>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Crise"
        itemName={deleteData?.name || 'esta crise'}
      />
    </div>
  );
}
