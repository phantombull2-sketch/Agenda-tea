import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Textarea, SectionTitle, IconBubble } from '../components/ui';
import { AppDocument } from '../types';
import { Plus, FileText, Download, Upload, Trash2, Eye, ChevronLeft, Image as ImageIcon, Loader2, X, ZoomIn, ZoomOut, FileCheck, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { uploadFileBase64, deleteFile } from '../lib/sync';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useFeedback } from '../components/FeedbackModal';
import { safeArray, compressImage } from '../utils';

export function DocumentsScreen({ onBack }: { onBack?: () => void }) {
  const { state, getActiveProfile, addDocument, updateDocument, deleteDocument, userUid } = useAppStore();
  const profile = getActiveProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, FeedbackComponent } = useFeedback();

  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string, fileName?: string } | null>(null);

  const [previewDoc, setPreviewDoc] = useState<AppDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const getFreshDoc = (): Partial<AppDocument> => ({
    title: '',
    type: 'Laudo',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    fileName: '',
    fileData: ''
  });

  const [doc, setDoc] = useState<Partial<AppDocument>>(getFreshDoc());

  const handleOpenAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setDoc(getFreshDoc());
  };

  const handleEdit = (d: AppDocument) => {
    setDoc(d);
    setEditingId(d.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string, fileName?: string, title?: string) => {
     setDeleteData({ id, name: title || 'este documento', fileName });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
      if (userUid && deleteData.fileName) {
         try {
           await deleteFile(userUid, profile.id, deleteData.id, deleteData.fileName);
         } catch(e) {
           console.error('Failed to delete file from storage', e);
         }
      }
      deleteDocument(deleteData.id);
      setDeleteData(null);
    }
  };

  const handleSave = async () => {
    if (!doc.title) return showError('Erro', 'Por favor, informe o título do documento.');
    
    setIsUploading(true);
    
    try {
      let finalFileData = doc.fileData;
      let finalFileUrl = doc.fileUrl;
      let docId = editingId || crypto.randomUUID();
      
      if (userUid && doc.fileData && doc.fileData.startsWith('data:')) {
         try {
           finalFileUrl = await uploadFileBase64(userUid, profile.id, docId, doc.fileName || 'file', doc.fileData);
         } catch (e) {
           console.error("Upload failed", e);
           showError('Aviso', 'Falha ao fazer upload na nuvem. Será salvo localmente por enquanto.');
         }
      }

      if (editingId) {
        updateDocument(editingId, { ...doc, fileData: finalFileData, fileUrl: finalFileUrl });
      } else {
        addDocument({
          id: docId,
          childId: profile.id,
          ...(doc as AppDocument),
          fileData: finalFileData,
          fileUrl: finalFileUrl
        });
      }
      
      setIsAdding(false);
      setEditingId(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Erro de Tamanho', 'O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    try {
      let base64String = '';
      if (file.type.startsWith('image/')) {
        base64String = await compressImage(file, 1600, 1600, 0.8);
      } else {
        base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }

      setDoc(s => ({
        ...s,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64String
      }));
    } catch(err) {
      console.error(err);
      showError('Erro', 'Falha ao processar o arquivo.');
    }
  };

  const handleDownloadFile = (d: AppDocument) => {
    const fileData = d.fileUrl || d.fileData;
    const fileName = d.fileName || 'documento';
    
    if (!fileData) return showError('Aviso', 'Arquivo não encontrado ou corrompido.');
    
    if (fileData.startsWith('data:')) {
       const a = document.createElement('a');
       a.href = fileData;
       a.download = fileName;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
    } else {
       window.open(fileData, '_blank');
    }
  };

  const handleViewPreview = (d: AppDocument) => {
      if (!d.fileData && !d.fileUrl) return showError('Aviso', 'Arquivo não encontrado.');
      setPreviewDoc(d);
      setZoomLevel(1);
  };

  const documents = safeArray(state.documents).filter(d => d.childId === profile.id);
  const sortedDocs = [...documents].sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 max-w-lg mx-auto">
      {/* Sticky Header Bar */}
      <div className="bg-white px-5 py-4 border-b border-[#f1f3f7] flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2.5 -ml-2 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Laudos, Relatórios & Receitas</span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Pasta de Documentos</h1>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={handleOpenAdd} 
            className="p-3 text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md transition-colors cursor-pointer"
            title="Adicionar"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {isAdding ? (
          <Card className="p-6 space-y-4 shadow-lg border border-[#e2e8f0]">
            <h2 className="text-base font-extrabold text-slate-800 border-b pb-3 border-[#f1f3f7]">{editingId ? '📝 Editar Documento' : '📁 Novo Documento'}</h2>
            
            <Input label="Título do Documento" value={doc.title} onChange={e => setDoc({...doc, title: e.target.value})} placeholder="Ex: Laudo Psicopedagógico 2026" />
            
            <div className="grid grid-cols-2 gap-4">
              <Select label="Categoria" value={doc.type} onChange={e => setDoc({...doc, type: e.target.value as any})} options={['Laudo', 'Receita', 'Guia', 'Autorização', 'Relatório', 'Carteirinha', 'Exame', 'Outro'].map(t => ({label: t, value: t}))} />
              <Input type="date" label="Data de Emissão" value={doc.date} onChange={e => setDoc({...doc, date: e.target.value})} />
            </div>

            <Input type="date" label="Data de Vencimento (Dica: Avisará se vencer em breve)" value={doc.expirationDate || ''} onChange={e => setDoc({...doc, expirationDate: e.target.value})} />
            
            <Textarea label="Notas e Anotações de Identificação" value={doc.notes} onChange={e => setDoc({...doc, notes: e.target.value})} rows={3} placeholder="Ex: Assinado por Dr. Ricardo Marques CRM-9482. Indicação de Fono 2x por semana." />

             <div className="pt-3 border-t border-[#f1f3f7] mt-4 space-y-2">
               <span className="block text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Arquivo Digitalizado</span>
               <input 
                 type="file" 
                 accept="image/jpeg, image/png, image/webp, application/pdf"
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
               />
               
               {doc.fileData || doc.fileUrl ? (
                 <div className="border border-[#f1f3f7] rounded-3xl p-4 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                       <IconBubble icon={<FileText />} variant="blue" size="md" />
                       <div className="flex flex-col min-w-0">
                         <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{doc.fileName || 'arquivo_anexo'}</span>
                         {doc.fileSize && <span className="text-[10px] text-slate-400 font-bold uppercase">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                       </div>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-white border border-[#f1f3f7] rounded-2xl">
                      <Button variant="ghost" className="text-slate-600 font-extrabold text-xs px-3 py-1.5 h-auto rounded-xl" onClick={() => fileInputRef.current?.click()}>
                         Trocar
                      </Button>
                      <Button variant="ghost" className="text-rose-600 font-extrabold text-xs px-3 py-1.5 h-auto rounded-xl" onClick={() => setDoc(s => ({...s, fileName: '', fileData: '', fileUrl: '', fileSize: 0, fileType: ''}))}>
                         Excluir
                      </Button>
                    </div>
                 </div>
               ) : (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                 >
                   <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                   <p className="text-xs text-slate-500 font-bold">Toque para selecionar imagem ou PDF</p>
                   <p className="text-[9px] text-[#2563eb] font-bold mt-1 uppercase tracking-wider">Tamanho Máximo: 5MB</p>
                 </div>
               )}
             </div>

             <div className="flex gap-3 pt-5 border-t border-[#f1f3f7]">
               <Button className="flex-1 text-xs" onClick={handleSave} disabled={isUploading}>
                  {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Arquivo'}
               </Button>
               <Button className="flex-1 text-xs" variant="outline" onClick={() => setIsAdding(false)} disabled={isUploading}>Voltar</Button>
             </div>
          </Card>
        ) : (
          <div className="space-y-4">
             {sortedDocs.map(d => (
                <Card key={d.id} className="p-4 flex flex-col gap-4 text-left shadow-xs hover:border-slate-200">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-[#f1f3f7]">
                      {(d.fileType?.includes('image') || (d.fileData && d.fileData.includes('image/'))) ? (
                        <img src={d.fileUrl || d.fileData} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-[#2563eb]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug truncate">{d.title}</h3>
                        <span className="text-[9px] font-black tracking-wide uppercase bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] px-2.5 py-0.5 rounded-full shrink-0">{d.type}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400">
                        Emitido em: {format(new Date(d.date + 'T12:00:00'), 'dd/MM/yyyy')}
                        {d.expirationDate && (
                          <span className="text-amber-600 block sm:inline sm:ml-2 font-extrabold">🚨 Vence: {format(new Date(d.expirationDate + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                        )}
                      </p>
                      {d.notes && <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2 pt-1">{d.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50">
                    <button onClick={() => handleViewPreview(d)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 transition-colors flex items-center justify-center gap-1 shadow-inner cursor-pointer border border-[#f1f3f7]">
                       <Eye className="w-3.5 h-3.5" /> Visualizar
                    </button>
                    <button onClick={() => handleDownloadFile(d)} className="flex-1 py-2 bg-[#eff6ff] hover:bg-[#dbeafe] rounded-xl text-[10px] font-black uppercase tracking-wider text-[#1e40af] transition-colors flex items-center justify-center gap-1 cursor-pointer border border-[#bfdbfe]/30">
                       <Download className="w-3.5 h-3.5" /> Baixar
                    </button>
                    <button onClick={() => handleEdit(d)} className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-[#f1f3f7] cursor-pointer">
                       Editar
                    </button>
                    <button onClick={() => handleDelete(d.id, d.fileName, d.title)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-100">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
             ))}
             {sortedDocs.length === 0 && (
               <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
                 <FileCheck className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                 <p className="text-xs text-slate-400 font-bold">Nenhum documento anexado ainda.</p>
                 <button onClick={handleOpenAdd} className="mt-2 text-[#2563eb] text-xs font-black underline cursor-pointer">Adicionar Novo Laudo</button>
               </div>
             )}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Documento"
        itemName={deleteData?.name || 'este documento'}
      />
      <FeedbackComponent />

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center">
            <div className="w-full flex justify-between items-center p-4 bg-gradient-to-b from-slate-950/80 to-transparent absolute top-0 z-10 max-w-lg">
               <div className="text-left">
                  <h3 className="text-white font-extrabold text-sm truncate max-w-[200px]">{previewDoc.title}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase truncate max-w-[200px]">{previewDoc.fileName}</p>
               </div>
               <div className="flex items-center gap-2">
                  {((previewDoc.fileType?.includes('image')) || (previewDoc.fileData && previewDoc.fileData.includes('image/'))) && (
                     <>
                        <button onClick={() => setZoomLevel(z => z + 0.25)} className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer">
                           <ZoomIn className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer">
                           <ZoomOut className="w-4 h-4"/>
                        </button>
                     </>
                  )}
                  <button onClick={() => setPreviewDoc(null)} className="p-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
               </div>
            </div>
            
            <div className="flex-1 w-full max-w-lg flex items-center justify-center overflow-auto p-4 pt-20">
               {((previewDoc.fileType?.includes('pdf') || (previewDoc.fileData && previewDoc.fileData.includes('application/pdf')))) ? (
                 <iframe 
                   src={previewDoc.fileUrl || previewDoc.fileData} 
                   className="w-full h-full max-h-[80vh] bg-white rounded-3xl shadow-2xl"
                   title="PDF Preview"
                 />
                ) : (
                 <img 
                   src={previewDoc.fileUrl || previewDoc.fileData} 
                   alt={previewDoc.title} 
                   style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s', transformOrigin: 'center' }}
                   className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-xl"
                   draggable={false}
                 />
                )}
            </div>
        </div>
      )}

    </div>
  );
}
