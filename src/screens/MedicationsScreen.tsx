import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, Card, Input, Textarea, SectionTitle, IconBubble } from '../components/ui';
import { ChevronLeft, Plus, Pill, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Medication } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { safeArray } from '../utils';

export function MedicationsScreen({ onBack }: { onBack: () => void }) {
  const { state, getActiveProfile, addMedication, deleteMedication, updateMedication } = useAppStore();
  const profile = getActiveProfile();
  const medications = safeArray(state.medications).filter(m => m.childId === profile.id);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const [form, setForm] = useState<Partial<Medication>>({
    name: '', dosage: '', times: ['08:00'], stock: 0, remindersEnabled: true
  });

  const handleSave = () => {
    if (!form.name) return;
    
    if (editingId) {
      updateMedication(editingId, form);
    } else {
      addMedication({
        id: crypto.randomUUID(),
        childId: profile.id,
        name: form.name,
        dosage: form.dosage || '',
        times: form.times || [],
        stock: form.stock || 0,
        remindersEnabled: !!form.remindersEnabled
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '', dosage: '', times: ['08:00'], stock: 0, remindersEnabled: true });
  };

  const handleEdit = (med: Medication) => {
    setForm(med);
    setEditingId(med.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteData({ id, name });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
      deleteMedication(deleteData.id);
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
            <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Medicamentos e Remédios</span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Especialidades</h1>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="p-3 text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md transition-colors cursor-pointer"
            title="Registrar Medicamento"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {isAdding ? (
          <Card className="p-6 space-y-4 shadow-lg border border-[#e2e8f0] text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-base font-extrabold text-slate-800 border-b pb-3 border-[#f1f3f7]">{editingId ? '📝 Editar Medicamento' : '💊 Registrar Medicamento'}</h2>
            
            <Input label="Medicamento / Princípio Ativo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Risperidona, Ritalina..." />
            
            <div className="grid grid-cols-2 gap-4">
               <Input label="Dosagem ou Volume" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} placeholder="Ex: 1ml, 2.5mg" />
               <Input type="number" label="Estoque Atual (Qtd)" value={form.stock?.toString() || ''} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} placeholder="Qtd. total" />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1.5">Horários Diários (Ex: 08:00, 20:00)</label>
              <Input 
                value={form.times?.join(', ')} 
                onChange={e => setForm({...form, times: e.target.value.split(',').map(t => t.trim())})} 
                placeholder="Explicite horários separados por vírgula" 
              />
            </div>

            <div className="flex gap-3 pt-5 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSave}>Salvar Remedinho</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancelar</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {medications.map(med => (
              <Card key={med.id} className="p-5 flex gap-4 text-left shadow-xs hover:border-slate-200">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Pill className="text-[#2563eb] w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-extrabold text-[#111827] text-base leading-tight tracking-tight">{med.name}</h3>
                      <p className="text-xs font-bold text-[#4b5563] mt-1">Dosagem: {med.dosage}</p>
                    </div>
                    <div className="flex gap-1">
                       <button onClick={() => handleEdit(med)} className="px-3 py-1.5 bg-slate-50 border border-[#f1f3f7] hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer">Editar</button>
                       <button onClick={() => handleDelete(med.id, med.name)} className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {med.times.map((t, i) => (
                       <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                         <Clock className="w-3 h-3 text-slate-400" /> {t}
                       </span>
                    ))}
                  </div>

                  {med.stock > 0 && (
                     <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-700 border border-amber-200 inline-block px-3 py-1 rounded-xl bg-amber-50/50">
                       Estoque: {med.stock} unidades restantes
                     </div>
                  )}
                </div>
              </Card>
            ))}

            {medications.length === 0 && (
              <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
                <Pill className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Nenhum medicamento de uso contínuo.</p>
                <button onClick={() => setIsAdding(true)} className="mt-2 text-[#2563eb] text-xs font-black underline cursor-pointer">Adicionar Medicamento</button>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Medicamento"
        itemName={deleteData?.name || 'este medicamento'}
      />
    </div>
  );
}
