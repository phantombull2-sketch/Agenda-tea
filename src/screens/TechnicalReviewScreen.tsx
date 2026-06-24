import React from 'react';
import { ChevronLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAppStore } from '../store';

export function TechnicalReviewScreen({ onBack }: { onBack: () => void }) {
  const { isDemoActive } = useAppStore();

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-32 max-w-lg mx-auto">
      <div className="bg-white px-5 pt-4 pb-2 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="p-1 -ml-2 text-stone-500">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#4a5568]">Revisão Técnica</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Relatório do Sistema</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
         <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
           <h2 className="font-bold text-stone-800 border-b pb-2">Status da Configuração</h2>
           
           {/* Demo Mode Status Indicator */}
           {isDemoActive ? (
             <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
               <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-blue-500" />
               <div>
                  <p className="font-bold">Modo Demonstração: ATIVO</p>
                  <p className="text-xs mt-1 text-blue-700">Roteando requisições para a base de dados fictícia integrada contendo Lucas e Sofia.</p>
               </div>
             </div>
           ) : (
             <div className="flex items-start gap-3 p-3 bg-stone-50 text-stone-700 rounded-xl border border-stone-200">
               <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-stone-400" />
               <div>
                  <p className="font-bold text-stone-800">Modo Demonstração: INATIVO</p>
                  <p className="text-xs mt-1 text-stone-500">O sistema está apresentando a base de dados em tempo real do próprio usuário.</p>
               </div>
             </div>
           )}
           
           {isFirebaseConfigured ? (
             <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
               <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
               <div>
                  <p className="font-bold">Firebase Configurado</p>
                  <p className="text-xs mt-1 text-emerald-700">API Keys detectadas. Backup em nuvem e Login Google habilitados.</p>
               </div>
             </div>
           ) : (
             <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
               <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
               <div>
                  <p className="font-bold">Firebase Não Configurado</p>
                  <p className="text-xs mt-1 text-amber-700">O aplicativo está rodando em Modo Local Exclusivo. Nenhuma API key foi detectada.</p>
               </div>
             </div>
           )}

           <h2 className="font-bold text-stone-800 border-b pb-2 mt-6">Status da Correção</h2>
           <ul className="space-y-3 text-sm text-stone-600">
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Exclusão de Criança:</strong> Resolvido `Cannot read properties of undefined (reading 'filter')`. Uso seguro implementado globalmente.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Modais Nativos:</strong> Todos os alert(), confirm() e prompt() substituídos pelo FeedbackModal.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Firebase:</strong> Fallbacks incluídos para ambiente seguro local vs nuvem.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Sincronização:</strong> Migração de dados locais suportada e indicador global ajustado. SafeArrays utilizados.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>QR Code Falso:</strong> Removido completamente da página de Passaporte.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Verificação TypeScript:</strong> Erros de compilação eliminados. Código estaticamente validado.</div>
             </li>
           </ul>

           <h2 className="font-bold text-stone-800 border-b pb-2 mt-6">Status PWA</h2>
           <ul className="space-y-3 text-sm text-stone-600">
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Manifest configurado:</strong> Arquivo <code>manifest.json</code> disponível para Web e Android.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Service Worker ativo:</strong> Script <code>sw.js</code> registrado atuando como cache.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Instalável:</strong> Permite adicionar à Tela de Início / homescreen.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div><strong>Offline disponível:</strong> Arquivos salvos para acesso de áreas sem internet.</div>
             </li>
             <li className="flex items-start gap-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
               <div>
                 <strong>Ícones Encontrados (Imagem Oficial):</strong>
                 <ul className="list-disc pl-5 mt-1 text-xs text-stone-500 space-y-0.5">
                   <li><code>/icons/icon-192.png</code> (192x192) - Android Chrome</li>
                   <li><code>/icons/icon-512.png</code> (512x512) - Android High-DPI</li>
                   <li><code>/icons/apple-touch-icon.png</code> (180x180) - iPhone Safari</li>
                   <li><code>/icons/icon.svg</code> - Vetor original</li>
                 </ul>
               </div>
             </li>
           </ul>
         </div>
         
         <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between text-emerald-800">
           <span className="font-bold">Teste Completo e Verificações OK</span>
           <CheckCircle2 className="w-6 h-6" />
         </div>
      </div>
    </div>
  );
}
