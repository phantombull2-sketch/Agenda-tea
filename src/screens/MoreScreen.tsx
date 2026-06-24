import React, { useRef } from 'react';
import { User, FileText, Pill, AlertTriangle, FileBarChart, Download, ArrowRight, ShieldCheck, Upload, LogIn } from 'lucide-react';
import { useAppStore } from '../store';
import { Tab } from '../components/Layout';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useFeedback } from '../components/FeedbackModal';

export function MoreScreen({ onNavigate }: { onNavigate: (tab: Tab | string) => void }) {
  const { getActiveProfile, state, replaceState, userUid, isDemoActive, realState } = useAppStore();
  const profile = getActiveProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess, confirm, FeedbackComponent } = useFeedback();
  const [showBackupChoice, setShowBackupChoice] = React.useState(false);

  const menuItems = [
    { id: 'profile', icon: <User className="text-blue-500" />, title: 'Meu Filho / Perfil', desc: 'Dados e configurações', bg: 'bg-blue-50' },
    { id: 'passport', icon: <ShieldCheck className="text-blue-500" />, title: 'Passaporte TEA', desc: 'Identificação e segurança', bg: 'bg-blue-50' },
    { id: 'medications', icon: <Pill className="text-indigo-500" />, title: 'Medicamentos', desc: 'Estoque e horários', bg: 'bg-indigo-50' },
    { id: 'crises', icon: <AlertTriangle className="text-red-500" />, title: 'Registro de Crises', desc: 'Histórico e gatilhos', bg: 'bg-red-50' },
    { id: 'documents', icon: <FileText className="text-amber-500" />, title: 'Documentos', desc: 'Laudos e exames', bg: 'bg-amber-50' },
    { id: 'reports', icon: <FileBarChart className="text-emerald-500" />, title: 'Relatórios', desc: 'Exportar para PDF', bg: 'bg-emerald-50' },
    { id: 'technical', icon: <ShieldCheck className="text-stone-500" />, title: 'Revisão Técnica', desc: 'Menu e Ferramentas do Desenvolvedor', bg: 'bg-stone-100' }
  ] as const;

  const triggerDownload = (dataToBackup: any, isDemoBackup = false) => {
    try {
      const dataStr = JSON.stringify(dataToBackup);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const fileSuffix = isDemoBackup ? 'demonstracao' : 'real';
      link.download = `agenda-azul-backup-${fileSuffix}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showError('Erro', 'Erro ao gerar backup. Seus arquivos anexados podem ser muito grandes.');
    }
  };

  const handleBackup = () => {
    if (isDemoActive) {
      setShowBackupChoice(true);
    } else {
      triggerDownload(state, false);
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    confirm(
      'Atenção',
      'A restauração de um backup irá apagar e sobresscrever TODOS os dados atuais neste dispositivo. Tem certeza que deseja continuar?',
      () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            if (parsed && parsed.profiles && Array.isArray(parsed.profiles)) {
              replaceState(parsed);
              showSuccess('Sucesso', 'Backup restaurado com sucesso!');
            } else {
              showError('Erro', 'Arquivo de backup inválido ou corrompido.');
            }
          } catch (err) {
            showError('Erro', 'Erro ao ler arquivo de backup.');
          }
        };
        reader.readAsText(file);
      }
    );
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      showError('Aviso', 'Firebase ainda não configurado ou credenciais inválidas. Verifique os arquivos de configuração.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      showError('Erro', 'Falha no login com Google.');
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    confirm(
      'Sair',
      'Tem certeza que deseja sair da conta? Os dados não serão mais sincronizados.',
      async () => {
        await signOut(auth);
      }
    );
  };

  return (
    <div className="p-5 space-y-6 pb-32 max-w-lg mx-auto">
      <header className="pt-4 pb-2 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-[#4a5568]">Mais</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Recursos adicionais</p>
        </div>
        {userUid && auth && auth.currentUser ? (
          <div className="flex flex-col items-end">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold uppercase overflow-hidden">
               {auth.currentUser.photoURL ? <img src={auth.currentUser.photoURL} alt="Foto" /> : auth.currentUser.email?.charAt(0) || 'U'}
            </div>
            <p className="text-[9px] font-bold text-stone-400 max-w-[100px] truncate mt-1">{auth.currentUser.email}</p>
            <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase mt-1">Sair da conta</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors">
            <LogIn className="w-3 h-3" /> Fazer Login
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Tab)}
            className="flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-sm transition-transform active:scale-95 text-left w-full hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg}`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-stone-800">{item.title}</h3>
                <p className="text-xs font-medium text-stone-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300" />
          </button>
        ))}
      </div>

      <div className="pt-4">
        <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 pl-2">Sistema & Segurança</h3>
        <div className="space-y-3">
          <button
            onClick={handleBackup}
            className="flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-sm w-full text-left transition-transform active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50">
                <Download className="text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold text-stone-800">Exportar Backup</h3>
                <p className="text-xs font-medium text-stone-400 mt-0.5">Salvar cópia de todos os dados</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-sm w-full text-left transition-transform active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-50">
                <Upload className="text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold text-stone-800">Restaurar Backup</h3>
                <p className="text-xs font-medium text-stone-400 mt-0.5">Carregar dados de um arquivo salvo</p>
              </div>
            </div>
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleRestore} 
            className="hidden" 
          />
        </div>
      </div>
      
      <div className="pt-4 text-center">
         <p className="text-xs text-stone-400 font-medium px-4">Os dados são sensíveis e ficam armazenados {userUid ? 'na nuvem com segurança.' : 'offline apenas neste aparelho.'}</p>
      </div>
      <FeedbackComponent />

      {/* Backup Selection Modal for Demo Mode */}
      {showBackupChoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4 text-center">
            <h3 className="text-base font-bold text-stone-900">Tipo de Backup</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              Você está utilizando o **Modo de Demonstração**. Que dados você deseja exportar em seu arquivo de backup?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowBackupChoice(false);
                  triggerDownload(realState || { profiles: [] }, false);
                }}
                className="w-full py-2.5 px-4 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Exportar Meus Dados Reais
              </button>
              <button
                onClick={() => {
                  setShowBackupChoice(false);
                  triggerDownload(state, true);
                }}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Exportar Dados de Demonstração
              </button>
              <button
                onClick={() => setShowBackupChoice(false)}
                className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
