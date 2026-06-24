import React, { useState } from 'react';
import { Button } from '../components/ui';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export function WelcomeScreen({ onSkip, onLoginSuccess }: { onSkip: () => void, onLoginSuccess: (uid: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const cred = await signInWithPopup(auth, googleProvider);
      onLoginSuccess(cred.user.uid);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao fazer login com o Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
       <div className="w-24 h-24 bg-[#3b82f6] bg-opacity-20 rounded-full flex items-center justify-center mb-8">
         <span className="text-4xl text-blue-500">💙</span>
       </div>
       <h1 className="text-3xl font-bold text-stone-800 mb-2">Agenda Azul</h1>
       <h2 className="text-[14px] font-bold text-blue-500 uppercase tracking-widest mb-6">Organizando a jornada da sua família.</h2>
       <p className="text-stone-500 font-medium mb-10 max-w-sm">
         Centralize terapias, consultas, documentos, medicamentos, rotina e informações importantes em um único lugar.
       </p>

       <div className="w-full max-w-xs space-y-4">
         {isFirebaseConfigured ? (
           <>
             <Button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 rounded-full text-base">
               {loading ? 'Aguarde...' : 'Entrar com Google'}
             </Button>
             <Button variant="ghost" onClick={onSkip} className="w-full text-stone-500 font-medium text-sm">
               Usar sem conta por enquanto
             </Button>
           </>
         ) : (
           <>
             <div className="bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-100">
               <p className="text-xs text-amber-800 font-medium font-bold">Modo local ativo.</p>
               <p className="text-[10px] text-amber-700 mt-1">Os dados serão armazenados apenas neste dispositivo.</p>
             </div>
             <Button onClick={onSkip} className="w-full py-4 rounded-full text-base">
               Continuar
             </Button>
           </>
         )}
       </div>

       {error && <p className="text-red-500 mt-4 text-xs font-medium">{error}</p>}
       
       {isFirebaseConfigured && (
         <p className="text-[10px] text-stone-400 mt-12 font-bold uppercase tracking-widest max-w-xs">
           Fazendo o login, seus dados ficam protegidos e sincronizados na nuvem.
         </p>
       )}
    </div>
  );
}
