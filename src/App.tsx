import React, { useState, useEffect } from 'react';
import { Layout, Tab } from './components/Layout';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TherapiesScreen } from './screens/TherapiesScreen';
import { DiaryScreen } from './screens/DiaryScreen';
import { RoutineScreen } from './screens/RoutineScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { PassportScreen } from './screens/PassportScreen';
import { MoreScreen } from './screens/MoreScreen';
import { MedicationsScreen } from './screens/MedicationsScreen';
import { CrisesScreen } from './screens/CrisesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { TechnicalReviewScreen } from './screens/TechnicalReviewScreen';
import { PWADiagnosticScreen } from './screens/PWADiagnosticScreen';
import { FeedbackModal } from './components/FeedbackModal';
import { PWAInstall } from './components/PWAInstall';

import { auth, isFirebaseConfigured } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchCloudState, uploadLocalStateToCloud } from './lib/sync';
import { useAppStore } from './store';
import { normalizeStatus } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab | string>('home');
  const [authResolved, setAuthResolved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { userUid, setUserUid, state, replaceState } = useAppStore();

  const [migrationState, setMigrationState] = useState<{cloudState: any, user: any} | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Normalize status migration run once at startup
  useEffect(() => {
    let hasChanges = false;
    const newState = { ...state };
    
    if (newState.therapySessions) {
      newState.therapySessions = newState.therapySessions.map(ts => {
        const norm = normalizeStatus(ts.status);
        if (norm !== ts.status) {
           hasChanges = true;
           return { ...ts, status: norm };
        }
        return ts;
      });
    }

    if (newState.appointments) {
      newState.appointments = newState.appointments.map(app => {
        const norm = normalizeStatus(app.status);
        if (norm !== app.status) {
           hasChanges = true;
           return { ...app, status: norm };
        }
        return app;
      });
    }

    if (hasChanges) {
       replaceState(newState);
       if (userUid) uploadLocalStateToCloud(userUid, newState);
    }
  }, [state.therapySessions, state.appointments, replaceState, userUid]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthResolved(true);
      if (!state.profiles[0]?.name) {
        setShowWelcome(true);
      }
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserUid(user.uid);
        const cloudState = await fetchCloudState(user.uid);
        if (cloudState) {
          if (state.profiles.length > 0 && state.profiles[0].name !== '') {
             setMigrationState({ cloudState, user });
          } else {
             replaceState(cloudState);
             useAppStore.getState().setSyncStatus('Sincronizado');
          }
        } else {
          if (state.profiles.length > 0 && state.profiles[0].name !== '') {
             const success = await uploadLocalStateToCloud(user.uid, state);
             if (success) useAppStore.getState().setSyncStatus('Sincronizado');
          }
        }
        setShowWelcome(false);
      } else {
        setUserUid(null);
        if (!state.profiles[0]?.name) {
          setShowWelcome(true);
        }
      }
      setAuthResolved(true);
    });
    return unsub;
  }, []);

  const handleMigration = async (keepLocal: boolean) => {
    if (!migrationState) return;
    const { user, cloudState } = migrationState;
    setMigrationState(null);
    useAppStore.getState().setSyncStatus('Salvando...');
    
    if (keepLocal) {
      const success = await uploadLocalStateToCloud(user.uid, state);
      if (success) {
        setSuccessMsg('Dados migrados e sincronizados com sucesso!');
        useAppStore.getState().setSyncStatus('Sincronizado');
      }
      const updatedCloud = await fetchCloudState(user.uid);
      if (updatedCloud) replaceState(updatedCloud);
    } else {
      replaceState(cloudState);
      useAppStore.getState().setSyncStatus('Sincronizado');
    }
  };

  if (!authResolved) return <div className="h-screen flex items-center justify-center text-stone-500 font-bold uppercase tracking-widest text-xs">Carregando Agenda Azul...</div>;

  if (showWelcome && !userUid) {
    return <WelcomeScreen onSkip={() => setShowWelcome(false)} onLoginSuccess={() => {}} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen onNavigate={setActiveTab as any} />;
      case 'therapies': return <TherapiesScreen />;
      case 'diary': return <DiaryScreen />;
      case 'routine': return <RoutineScreen />;
      case 'more': return <MoreScreen onNavigate={setActiveTab as any} />;
      case 'documents': return <DocumentsScreen onBack={() => setActiveTab('more')} />;
      case 'profile': return <ProfileScreen onBack={() => setActiveTab('more')} />;
      case 'passport': return <PassportScreen onBack={() => setActiveTab('more')} onEditProfile={() => setActiveTab('profile')} />;
      case 'medications': return <MedicationsScreen onBack={() => setActiveTab('more')} />;
      case 'crises': return <CrisesScreen onBack={() => setActiveTab('more')} />;
      case 'reports': return <ReportsScreen onBack={() => setActiveTab('more')} />;
      case 'technical': return <TechnicalReviewScreen onBack={() => setActiveTab('more')} />;
      case 'pwa-diagnostic': return <PWADiagnosticScreen onBack={() => setActiveTab('more')} />;
      default: return <HomeScreen onNavigate={setActiveTab as any} />;
    }
  };

  return (
    <Layout activeTab={activeTab as any} onTabChange={setActiveTab as any}>
      {renderScreen()}
      
      <FeedbackModal 
        isOpen={!!migrationState}
        type="info"
        title="Dados Locais Encontrados"
        message="Encontramos dados salvos neste aparelho. Deseja enviar para sua conta?"
        confirmText="Enviar e Mesclar"
        cancelText="Ignorar Locais"
        onConfirm={() => handleMigration(true)}
        onCancel={() => handleMigration(false)}
      />

      <FeedbackModal 
        isOpen={!!successMsg}
        type="success"
        title="Sucesso"
        message={successMsg}
        confirmText="Concluir"
        onConfirm={() => setSuccessMsg('')}
      />
      <PWAInstall />
    </Layout>
  );
}
