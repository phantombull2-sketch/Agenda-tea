import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Card, Input, Textarea, Select, Button } from '../components/ui';
import { Plus, ChevronLeft, Trash2, Camera, Upload, X } from 'lucide-react';
import { ChildProfile } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { compressImage } from '../utils';

export function ProfileScreen({ onBack }: { onBack?: () => void }) {
  const { state, getActiveProfile, updateProfile, switchProfile, addProfile, deleteProfile } = useAppStore();
  const profile = getActiveProfile();
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ChildProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    updateProfile(profile.id, { [field]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
    
    try {
      const base64Data = await compressImage(file, 800, 800, 0.8);
      updateProfile(profile.id, { photoData: base64Data });
    } catch(err) {
      console.error(err);
      alert('Erro ao processar a imagem.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    updateProfile(profile.id, { photoData: '', photoUrl: '' });
  };


  const handleDeleteProfile = (id: string, name: string) => {
    setDeleteData({ id, name: name || 'esta criança' });
  };
  
  const confirmDelete = async () => {
    if (deleteData) {
      await deleteProfile(deleteData.id);
      setDeleteData(null);
    }
  };

  const handleAddProfile = () => {
    if (!newProfileName) return;
    addProfile({
      name: newProfileName,
      birthDate: '',
      diagnosis: 'Transtorno do Espectro Autista',
      supportLevel: 'Não especificado',
      verbalState: 'Pouco verbal',
      allergies: '',
      foodSelectivity: '',
      notes: ''
    });
    setNewProfileName('');
    setIsAddingProfile(false);
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-32 max-w-lg mx-auto">
      <div className="bg-white px-5 pt-4 pb-2 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="p-1 -ml-2 text-stone-500">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#4a5568]">Meu Filho / Perfil</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gerenciar informações básicas</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Profile Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {state.profiles.map(p => (
             <div 
               key={p.id}
               onClick={() => switchProfile(p.id)}
               className={`flex-shrink-0 snap-start px-4 py-2 rounded-2xl border-2 flex items-center space-x-2 cursor-pointer transition-all ${state.activeProfileId === p.id ? 'bg-[#3b82f6] bg-opacity-10 border-[#3b82f6] text-[#1e3a8a]' : 'bg-white border-gray-100 text-gray-500'}`}
             >
                <div className="text-xl">👦</div>
                <span className="font-bold text-sm tracking-wide">{p.name || 'Nova Criança'}</span>
             </div>
          ))}
          {!isAddingProfile && (
             <div 
               onClick={() => setIsAddingProfile(true)}
               className="flex-shrink-0 snap-start px-4 py-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 flex items-center space-x-2 cursor-pointer hover:border-gray-300 transition-all font-bold text-sm"
             >
               <Plus className="w-5 h-5" /> Adicionar
             </div>
          )}
        </div>

        {isAddingProfile && (
          <Card className="flex items-center gap-2 p-3">
            <Input 
              autoFocus 
              className="flex-1 h-10 border-gray-200" 
              placeholder="Nome da criança" 
              value={newProfileName} 
              onChange={e => setNewProfileName(e.target.value)} 
            />
            <Button variant="primary" className="h-10 px-4 py-0" onClick={handleAddProfile}>Salvar</Button>
            <Button variant="outline" className="h-10 px-4 py-0" onClick={() => setIsAddingProfile(false)}>Cancelar</Button>
          </Card>
        )}

        <Card className="space-y-4 p-5">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-28 h-28 rounded-full bg-stone-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden mb-3">
              {profile.photoData || profile.photoUrl ? (
                <img src={profile.photoData || profile.photoUrl} alt="Foto da Criança" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-10 h-10 text-stone-300" />
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
            />

            <div className="flex gap-2">
               <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="text-xs h-8 px-3">
                 <Upload className="w-3 h-3 mr-1" /> {profile.photoData || profile.photoUrl ? 'Trocar' : 'Adicionar foto'}
               </Button>
               {(profile.photoData || profile.photoUrl) && (
                 <Button onClick={removePhoto} variant="ghost" className="text-xs h-8 px-3 text-red-500">
                   <Trash2 className="w-3 h-3 mr-1" /> Remover
                 </Button>
               )}
            </div>
          </div>

          <Input label="Nome da Criança" value={profile.name} onChange={handleChange('name')} placeholder="Ex: João" />
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Data de Nasc." value={profile.birthDate} onChange={handleChange('birthDate')} />
            <Input label="Diagnóstico" value={profile.diagnosis} onChange={handleChange('diagnosis')} />
          </div>
          <Input label="CID" value={profile.cid || ''} onChange={handleChange('cid')} placeholder="Ex: F84.0" />
          
          <Select 
            label="Nível de Suporte" 
            value={profile.supportLevel} 
            onChange={handleChange('supportLevel')}
            options={[
              { label: 'Não especificado', value: 'Não especificado' },
              { label: 'Nível 1 (Leve)', value: 'Nível 1' },
              { label: 'Nível 2 (Moderado)', value: 'Nível 2' },
              { label: 'Nível 3 (Severo)', value: 'Nível 3' }
            ]}
          />

          <Select 
            label="Comunicação Verbal" 
            value={profile.verbalState} 
            onChange={handleChange('verbalState')}
            options={[
              { label: 'Verbal', value: 'Verbal' },
              { label: 'Pouco verbal', value: 'Pouco verbal' },
              { label: 'Não verbal', value: 'Não verbal' }
            ]}
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
              <input type="checkbox" checked={!!profile.usesPECS} onChange={e => updateProfile(profile.id, { usesPECS: e.target.checked })} className="w-4 h-4 rounded text-[#3b82f6] focus:ring-[#3b82f6]" />
              Utiliza PECS
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
              <input type="checkbox" checked={!!profile.usesAAC} onChange={e => updateProfile(profile.id, { usesAAC: e.target.checked })} className="w-4 h-4 rounded text-[#3b82f6] focus:ring-[#3b82f6]" />
              Painel de Comunicação
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea label="Alergias / Restrições" value={profile.allergies} onChange={handleChange('allergies')} placeholder="Ex: amendoim, corante..." />
            <Textarea label="Seletividade Alimentar" value={profile.foodSelectivity} onChange={handleChange('foodSelectivity')} placeholder="Preferências e aversões alimentares..." />
          </div>
          
          <Textarea label="Sensibilidades Sensoriais" value={profile.sensorySensitivities || ''} onChange={handleChange('sensorySensitivities')} placeholder="Ex: barulhos altos, etiquetas..." />
          <Textarea label="Como agir em caso de crise" value={profile.crisisInstructions || ''} onChange={handleChange('crisisInstructions')} placeholder="Instruções para cuidadores..." />
          <Textarea label="Observações Livres" value={profile.notes} onChange={handleChange('notes')} placeholder="Qualquer outra observação importante..." />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Convênio" value={profile.insurance || ''} onChange={handleChange('insurance')} placeholder="Plano e número..." />
            <Input label="Médico Responsável" value={profile.leadPhysician || ''} onChange={handleChange('leadPhysician')} placeholder="Dr. Nome (Especialidade)" />
            <Input label="Contatos de Emergência" value={profile.emergencyContacts || ''} onChange={handleChange('emergencyContacts')} placeholder="Nome - (11) 99999-9999" />
          </div>

          <div className="pt-6 border-t border-red-100 flex justify-end">
             <button 
                type="button"
                onClick={() => handleDeleteProfile(profile.id, profile.name)}
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Excluir Perfil
              </button>
          </div>
        </Card>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Perfil da Criança"
        itemName={deleteData?.name || 'este perfil'}
      />
    </div>
  );
}
