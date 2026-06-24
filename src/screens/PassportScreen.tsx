import React from 'react';
import { useAppStore } from '../store';
import { Button, Card, IconBubble } from '../components/ui';
import { Printer, ChevronLeft, Edit, ShieldAlert, Heart, Calendar, Speech, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { safeArray, printSection } from '../utils';

export function PassportScreen({ onBack, onEditProfile }: { onBack: () => void, onEditProfile: () => void }) {
  const { getActiveProfile, state } = useAppStore();
  const profile = getActiveProfile();

  // Find continuous medications to display
  const meds = safeArray(state.medications).filter(m => m.childId === profile.id);

  const handlePrint = () => {
    printSection('print-passport', 'Passaporte TEA - ' + (profile.name || ''));
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 text-slate-800 print:bg-white print:min-h-auto max-w-2xl mx-auto">
      {/* Hide controls on print */}
      <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-[#f1f3f7] sticky top-0 z-30 print:hidden shadow-xs">
        <button 
          onClick={onBack} 
          className="p-2.5 -ml-2 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5px]" /> Voltar
        </button>
        <div className="flex gap-2">
           <button 
             onClick={onEditProfile} 
             className="px-4 py-2.5 text-xs text-slate-600 bg-slate-50 border border-[#f1f3f7] hover:bg-slate-100 rounded-2xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
           >
              <Edit className="w-3.5 h-3.5" /> Editar
           </button>
           <button 
             onClick={handlePrint} 
             className="px-4 py-2.5 text-xs text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
           >
             <Printer className="w-4 h-4" /> Imprimir / PDF
           </button>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto print:p-0 print:max-w-none">
        
        {/* Passport Card */}
        <div id="print-passport" className="bg-white rounded-[32px] border border-[#f1f3f7] shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header Banner */}
          <div className="bg-[#2563eb] p-6 text-white flex justify-between items-center print:bg-[#2500eb] print:text-white print:break-inside-avoid">
            <div className="text-left">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#bfdbfe]/90">Identificação Familiar</span>
              <h1 className="text-2xl font-black uppercase tracking-tight pl-0.5 mt-0.5">Passaporte TEA</h1>
              <p className="text-xs font-bold pl-0.5 opacity-85 mt-1">Transtorno do Espectro Autista</p>
            </div>
            <div className="text-3xl">🧩</div>
          </div>

          {/* Main Info */}
          <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start border-b border-[#f1f3f7] print:break-inside-avoid">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[28px] bg-slate-50 shrink-0 border-4 border-white shadow-lg overflow-hidden relative">
              {profile.photoData || profile.photoUrl ? (
                <img src={profile.photoData || profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-blue-50/50">👦</div>
              )}
            </div>
            
            <div className="flex-1 space-y-3.5 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{profile.name || 'Nome Completo'}</h2>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mt-3">
                   {profile.diagnosis && <span className="bg-[#2563eb] text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">{profile.diagnosis}</span>}
                   {profile.cid && <span className="bg-slate-100 text-slate-600 border border-[#f1f3f7] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">CID: {profile.cid}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div className="text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">Data de Nascimento</span>
                  <span className="text-xs font-bold text-slate-700">{profile.birthDate ? format(new Date(profile.birthDate + 'T12:00:00'), 'dd/MM/yyyy') : 'Não informada'}</span>
                </div>
                <div className="text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">Nível de Suporte / Comunicação</span>
                  <span className="text-xs font-bold text-slate-700">{profile.supportLevel} • {profile.verbalState}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 print:break-inside-avoid">
            
            {/* Left Column */}
            <div className="space-y-6 text-left">
              {/* Communication */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-black text-[#2563eb] uppercase tracking-widest border-b border-[#f1f3f7] pb-1.5 flex items-center gap-1.5">
                   <Speech className="w-4 h-4" /> Comunicação & Interação
                </h3>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-600">
                  {profile.usesPECS && <li className="flex gap-2 items-center text-emerald-700">✓ Utiliza PECS (Troca de Figuras)</li>}
                  {profile.usesAAC && <li className="flex gap-2 items-center text-emerald-700">✓ Utiliza Comunicação Alternativa (AAC)</li>}
                  <li className="text-slate-600 leading-relaxed pt-1">
                    <span className="font-extrabold text-slate-800">Diretrizes:</span> {profile.notes || 'Sem observações adicionais.'}
                  </li>
                </ul>
              </section>

              {/* Sensitivities */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest border-b border-[#f1f3f7] pb-1.5 flex items-center gap-1.5">
                   <AlertCircle className="w-4 h-4 text-rose-500" /> Sensibilidades Sensoriais
                </h3>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3.5 border border-[#f1f3f7] rounded-2xl">{profile.sensorySensitivities || 'Nenhuma sensibilidade sensorial registrada.'}</p>
              </section>

              {/* Diet and Allergies */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-black text-[#10b981] uppercase tracking-widest border-b border-[#f1f3f7] pb-1.5 flex items-center gap-1.5">
                   <Heart className="w-4 h-4 text-[#10b981]" /> Alergias & Seletividade
                </h3>
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <p><span className="font-extrabold text-slate-800">Alergias:</span> {profile.allergies || 'Nenhuma alergia relatada.'}</p>
                  <p><span className="font-extrabold text-slate-800">Seletividade Alimentar:</span> {profile.foodSelectivity || 'Aceitação alimentar normal.'}</p>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6 text-left">
              
              {/* Crisis Instructions */}
              <section className="bg-rose-50 border border-rose-100 p-4 rounded-3xl">
                <h3 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
                   <ShieldAlert className="w-4 h-4" /> Crises: Guia de Autorregulação
                </h3>
                <p className="text-xs font-semibold text-rose-900 leading-relaxed mt-2.5 whitespace-pre-wrap">{profile.crisisInstructions || 'Ofereça espaço seguro e silencioso. Reduza os estímulos luminosos e diminua a fala.'}</p>
              </section>

              {/* Meds */}
              <section className="space-y-2.5">
                 <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b border-[#f1f3f7] pb-1.5">
                   Medicamentos Diários
                 </h3>
                 {meds.length > 0 ? (
                   <ul className="space-y-2 text-xs font-semibold text-slate-600">
                     {meds.map(m => (
                       <li key={m.id} className="bg-slate-50 p-2 border border-[#f1f3f7] rounded-xl">• {m.name} - {m.dosage} ({m.times.join(', ')})</li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-xs font-semibold text-slate-400">Nenhum medicamento contínuo configurado.</p>
                 )}
              </section>

              {/* Contacts & Health */}
              <section className="space-y-2.5">
                 <h3 className="text-xs font-black text-[#2563eb] uppercase tracking-widest border-b border-[#f1f3f7] pb-1.5">
                   Segurança & Emergência
                 </h3>
                 <div className="space-y-3.5 text-xs font-semibold text-slate-600 bg-slate-50/50 p-3.5 border border-[#f1f3f7] rounded-2xl">
                    <p className="whitespace-pre-wrap leading-relaxed"><span className="font-extrabold text-slate-800 block mb-1">Contatos de Emergência:</span> {profile.emergencyContacts || 'Não informado.'}</p>
                    <div className="pt-2.5 border-t border-slate-100 space-y-1">
                       <p><span className="font-extrabold text-slate-800">Médico Responsável:</span> {profile.leadPhysician || 'Não focado'}</p>
                       <p><span className="font-extrabold text-slate-800">Convênio Integrado:</span> {profile.insurance || 'Não focado'}</p>
                    </div>
                 </div>
              </section>
            </div>

          </div>

          <div className="bg-slate-50/60 p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-[#f1f3f7] print:break-inside-avoid">
            Esse passaporte compila informações vitais para o suporte à acessibilidade da criança.
          </div>
        </div>
      </div>
    </div>
  );
}
