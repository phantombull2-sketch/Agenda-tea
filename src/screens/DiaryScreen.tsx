import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Textarea, SectionTitle, IconBubble, Badge } from '../components/ui';
import { DiaryEntry } from '../types';
import { Plus, Download, ChevronLeft, Trash2, Camera, Calendar, Sparkles, BookOpen, UserCheck, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useFeedback } from '../components/FeedbackModal';
import { safeArray, compressImage, printSection } from '../utils';

export function DiaryScreen() {
  const { state, getActiveProfile, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry } = useAppStore();
  const profile = getActiveProfile();
  const { confirm, FeedbackComponent } = useFeedback();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Helper to initialize fresh form
  const getFreshForm = () => ({
    date: format(new Date(), 'yyyy-MM-dd'),
    sleep: 'Normal',
    food: 'Normal',
    crises: 'Nenhuma',
    behavior: 'Calmo',
    communication: '',
    school: '',
    bowel: 'Normal',
    meds: 'Tomou corretamente',
    notes: '',
    photos: []
  });

  const [entry, setEntry] = useState<Partial<DiaryEntry>>(getFreshForm());

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEntry(getFreshForm());
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    if (entry.photos && entry.photos.length + files.length > 5) {
      return confirm('Atenção', 'Máximo de 5 fotos por registro.', () => {});
    }

    try {
      const newPhotos = await Promise.all(
        files.map(async (file) => {
          if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo grande demais: ' + file.name);
          const base64 = await compressImage(file, 800, 800, 0.7);
          return { fileName: file.name, fileData: base64, fileType: file.type };
        })
      );
      setEntry(s => ({ ...s, photos: [...(s.photos || []), ...newPhotos] }));
    } catch (err: any) {
      console.error(err);
      confirm('Erro', err.message || 'Falha ao adicionar imagem.', () => {});
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setEntry(s => ({
      ...s,
      photos: s.photos?.filter((_, i) => i !== index)
    }));
  };

  const checkDuplicate = (date: string) => {
    return safeArray(state.diaryEntries).find(e => e.childId === profile.id && e.date === date && e.id !== editingId);
  };

  const handleSave = () => {
    if (!entry.date) return;
    
    const existing = checkDuplicate(entry.date);
    if (existing && !editingId) {
       confirm(
         'Atenção',
         `Já existe um registro para a data ${entry.date.split('-').reverse().join('/')}. Deseja editar o registro existente?`,
         () => {
           setEditingId(existing.id);
           setEntry(existing);
         }
       );
       return;
    }

    if (editingId) {
      updateDiaryEntry(editingId, entry);
    } else {
      addDiaryEntry({
        id: crypto.randomUUID(),
        childId: profile.id,
        ...(entry as DiaryEntry)
      });
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (d: DiaryEntry) => {
    setEntry(d);
    setEditingId(d.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, dateStr: string) => {
    setDeleteData({ id, name: dateStr });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
       deleteDiaryEntry(deleteData.id);
       setDeleteData(null);
    }
  };

  const handleExport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      printSection('print-diary', 'Diário da Criança - ' + (profile.name || ''));
      setIsGenerating(false);
    }, 500);
  };

  const sortedEntries = [...safeArray(state.diaryEntries)].filter(e => e.childId === profile.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 max-w-lg mx-auto print:bg-white print:p-0">
      {/* Header bar */}
      <div className="bg-white px-5 py-4 border-b border-[#f1f3f7] flex items-center justify-between sticky top-0 z-30 print:hidden shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Diário & Comportamento</span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Registros Diários</h1>
        </div>
        {!isAdding && (
          <div className="flex gap-2.5">
            <button 
              onClick={handleExport} 
              className="p-3 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors cursor-pointer"
              title="Salvar PDF/Imprimir"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={handleOpenAdd} 
              className="p-3 text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md transition-colors cursor-pointer"
              title="Novo Registro"
            >
              <Plus className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5 print:hidden">
        {isAdding ? (
          <Card className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 p-6 shadow-lg border border-[#e2e8f0]">
            <h2 className="text-base font-extrabold text-slate-800 border-b pb-3 border-[#f1f3f7]">{editingId ? '📝 Editar Registro' : '➕ Novo Registro Diário'}</h2>
            
            <Input type="date" label="Data de Acompanhamento" value={entry.date} onChange={e => setEntry(s => ({ ...s, date: e.target.value }))} />
            
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Qualidade do Sono" 
                value={entry.sleep} 
                onChange={e => setEntry(s => ({ ...s, sleep: e.target.value }))}
                options={['Normal', 'Agitado', 'Acordou muito', 'Pouco'].map(l => ({ label: l, value: l }))}
              />
              <Select 
                label="Alimentação" 
                value={entry.food} 
                onChange={e => setEntry(s => ({ ...s, food: e.target.value }))}
                options={['Normal', 'Recusou novo', 'Comeu bem', 'Pouco'].map(l => ({ label: l, value: l }))}
              />
              <Select 
                label="Evacuação (Intestino)" 
                value={entry.bowel} 
                onChange={e => setEntry(s => ({ ...s, bowel: e.target.value }))}
                options={['Normal', 'Constipado', 'Diarréia', 'Não evacuou'].map(l => ({ label: l, value: l }))}
              />
              <Select 
                label="Medicamentos" 
                value={entry.meds} 
                onChange={e => setEntry(s => ({ ...s, meds: e.target.value }))}
                options={['Tomou corretamente', 'Recusou', 'Esqueceu', 'Não se aplica'].map(l => ({ label: l, value: l }))}
              />
            </div>

            <Select 
              label="Crises Sensoriais / Desregulação" 
              value={entry.crises} 
              onChange={e => setEntry(s => ({ ...s, crises: e.target.value }))}
              options={['Nenhuma', 'Leve (1-2 min)', 'Moderada (5-10 min)', 'Forte'].map(l => ({ label: l, value: l }))}
            />
            
            <Textarea label="Descrição do Comportamento Geral" placeholder="Teve choro sem causa aparente? Ficou mais calmo ou focado?..." value={entry.behavior} onChange={e => setEntry(s => ({ ...s, behavior: e.target.value }))} />
            <Textarea label="Comunicação & Fala" placeholder="Falou alguma palavra nova? Utilizou figuras/PECS? Apontou mais?..." value={entry.communication} onChange={e => setEntry(s => ({ ...s, communication: e.target.value }))} />
            <Textarea label="Escola, Refeitório & Terapias" placeholder="Relato da professora, desempenho nas tarefas, aceitação..." value={entry.school} onChange={e => setEntry(s => ({ ...s, school: e.target.value }))} />
            <Textarea label="Anotações Gerais Adicionais" placeholder="Qualquer outro detalhe do dia..." value={entry.notes} onChange={e => setEntry(s => ({ ...s, notes: e.target.value }))} />

            <div className="pt-3 border-t border-[#f1f3f7] mt-5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2.5">Fotos Anexas ({entry.photos?.length || 0}/5)</label>
              
              <div className="flex flex-wrap gap-3">
                {entry.photos?.map((photo, i) => (
                  <div key={i} className="relative w-22 h-22 rounded-3xl overflow-hidden bg-slate-100 border-2 border-white shadow-md group">
                    <img src={photo.fileData || photo.fileUrl} alt="Foto do diário" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removePhoto(i)} 
                      className="absolute top-1.5 right-1.5 bg-white shadow-md rounded-full p-1.5 text-rose-500 hover:text-rose-700 transition-colors z-10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setPreviewPhoto(photo.fileData || photo.fileUrl || null)} 
                      className="absolute inset-0 w-full h-full bg-slate-900/10 hover:bg-slate-900/20 transition-colors cursor-pointer"
                    />
                  </div>
                ))}
                
                {(!entry.photos || entry.photos.length < 5) && (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-22 h-22 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Anexar</span>
                  </button>
                )}
              </div>
              <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSave}>Salvar Registro</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancelar</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedEntries.map(e => {
              const dateObj = new Date(e.date + 'T12:00:00');
              return (
                 <Card key={e.id} className="p-5 space-y-4 shadow-sm border border-[#f1f3f7] hover:border-slate-200">
                   <div className="flex justify-between items-center border-b pb-3 border-[#f1f3f7]">
                     <div className="flex items-center gap-2">
                       <IconBubble icon={<Calendar />} size="sm" variant="indigo" />
                       <span className="text-xs font-black text-indigo-700 tracking-tight">
                         {format(dateObj, "d 'de' MMMM, yyyy", { locale: ptBR })}
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(e)} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Editar</button>
                        <button onClick={() => handleDelete(e.id, 'o registro do dia ' + format(dateObj, "dd/MM/yyyy"))} className="text-xs font-bold text-rose-500 hover:text-rose-700 ml-2 cursor-pointer p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 text-xs text-slate-700 leading-snug">
                     <div>
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">🛌 Sono</span>
                       <span className="font-extrabold text-slate-800">{e.sleep}</span>
                     </div>
                     <div>
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">🍎 Alimentação</span>
                       <span className="font-extrabold text-slate-800">{e.food}</span>
                     </div>
                     <div>
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">💥 Desregulação</span>
                       <span className={`font-extrabold ${e.crises && e.crises !== 'Nenhuma' ? 'text-rose-600' : 'text-slate-800'}`}>{e.crises}</span>
                     </div>
                     <div>
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">🚽 Digestão</span>
                       <span className="font-extrabold text-slate-800">{e.bowel || 'Normal'}</span>
                     </div>
                     <div className="col-span-2 border-t border-[#f1f3f7] pt-2">
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">💊 Medicação do dia</span>
                       <span className="font-extrabold text-slate-700">{e.meds || 'Normal'}</span>
                     </div>
                     <div className="col-span-2 border-t border-[#f1f3f7] pt-2">
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">😀 Comportamento Geral</span>
                       <p className="font-semibold text-slate-700 mt-0.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{e.behavior}</p>
                     </div>
                   </div>

                   {e.communication && (
                     <div className="pt-3 border-t border-[#f1f3f7] text-xs text-slate-700">
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">🗣️ Evolução de Fala / Comunicação</span>
                       <p className="font-semibold text-slate-700 mt-1 pl-1">{e.communication}</p>
                     </div>
                   )}
                   {e.school && (
                     <div className="pt-3 border-t border-[#f1f3f7] text-xs text-slate-700">
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">🏫 Escola & Terapias</span>
                       <p className="font-semibold text-slate-700 mt-1 pl-1">{e.school}</p>
                     </div>
                   )}
                   {e.notes && (
                     <div className="pt-3 border-t border-[#f1f3f7] text-xs text-slate-700">
                       <span className="text-slate-400 font-black uppercase tracking-wider text-[9px] block mb-0.5">📝 Observações</span>
                       <p className="font-semibold text-slate-600 mt-1 pl-1 italic">{e.notes}</p>
                     </div>
                   )}
                   {e.photos && e.photos.length > 0 && (
                     <div className="pt-3 flex gap-2 overflow-x-auto pb-1 border-t border-[#f1f3f7] hide-scrollbar">
                       {e.photos.map((photo, i) => (
                         <div 
                           key={i} 
                           onClick={() => setPreviewPhoto(photo.fileData || photo.fileUrl || null)}
                           className="w-16 h-16 rounded-xl flex-shrink-0 bg-slate-50 border border-slate-100 overflow-hidden cursor-pointer"
                         >
                           <img src={photo.fileData || photo.fileUrl} alt="Anexo do diário" className="w-full h-full object-cover" />
                         </div>
                       ))}
                     </div>
                   )}
                 </Card>
              )
            })}
            {sortedEntries.length === 0 && (
              <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
                <BookOpen className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Nenhum registro no diário.</p>
                <button onClick={handleOpenAdd} className="mt-2 text-[#2563eb] text-xs font-black underline cursor-pointer">Adicionar Primeiro Registro</button>
              </div>
            )}
          </div>
        )}
      </div>

      {isGenerating && (
        <div id="print-diary" className="hidden print:block !m-0 !p-8 bg-white text-black text-sm">
           <div className="text-center mb-8 border-b pb-6">
             <h1 className="text-3xl font-bold mb-2">Relatório de Diário</h1>
             <p className="text-gray-600">Criança: {profile.name} • Total de Registros: {sortedEntries.length}</p>
           </div>
           <div className="space-y-6">
             {sortedEntries.map(e => (
               <div key={e.id} className="border p-4 rounded text-xs">
                 <h2 className="font-bold text-lg border-b pb-2 mb-2">{e.date.split('-').reverse().join('/')}</h2>
                 <p><strong>Sono:</strong> {e.sleep} | <strong>Alimentação:</strong> {e.food} | <strong>Intestino:</strong> {e.bowel}</p>
                 <p><strong>Comportamento:</strong> {e.behavior} | <strong>Crises:</strong> {e.crises} | <strong>Meds:</strong> {e.meds}</p>
                 {e.communication && <p><strong>Comunicação:</strong> {e.communication}</p>}
                 {e.school && <p><strong>Escola/Terapias:</strong> {e.school}</p>}
                 {e.notes && <p><strong>Notas:</strong> {e.notes}</p>}
               </div>
             ))}
           </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        itemName={deleteData?.name || 'este registro'}
      />

      {previewPhoto && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 flex flex-col pt-safe pb-safe items-center animate-in fade-in">
          <div className="w-full flex justify-between p-4 max-w-lg">
             <Button variant="ghost" onClick={() => setPreviewPhoto(null)} className="text-white hover:bg-white/10"><Plus className="w-6 h-6 rotate-45" /></Button>
             <a href={previewPhoto} download={`foto_diario_${Date.now()}.jpg`} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors">
               <Download className="w-5 h-5" />
             </a>
          </div>
          <div className="flex-1 w-full max-w-lg flex items-center justify-center p-4">
            <img src={previewPhoto} alt="Visualização" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
      
      {FeedbackComponent()}
    </div>
  );
}
