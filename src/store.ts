import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { AppState, ChildProfile, Therapy, DiaryEntry, RoutineItem, AppDocument, Medication, Crisis } from './types';
import { saveToCloud, deleteFromCloud } from './lib/sync';
import { normalizeStatus } from './utils';

// Custom storage object for Zustand using idb-keyval
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

function generateId() {
  return crypto.randomUUID();
}

const defaultProfileId = generateId();

const defaultProfile: ChildProfile = {
  id: defaultProfileId,
  name: '',
  birthDate: '',
  diagnosis: 'Transtorno do Espectro Autista',
  supportLevel: 'Não especificado',
  verbalState: 'Pouco verbal',
  allergies: '',
  foodSelectivity: '',
  notes: '',
};

const defaultTherapyCategories: import('./types').TherapyCategory[] = [
  { id: 'fono', name: 'Fonoaudiologia', color: 'bg-blue-500', icon: '🎤' },
  { id: 'to', name: 'Terapia Ocupacional', color: 'bg-green-500', icon: '🧩' },
  { id: 'psico', name: 'Psicologia', color: 'bg-purple-500', icon: '🧠' },
  { id: 'aba', name: 'ABA', color: 'bg-orange-500', icon: '📚' },
  { id: 'neuro', name: 'Neuropediatra', color: 'bg-red-500', icon: '👨‍⚕️' },
  { id: 'psicoped', name: 'Psicopedagogia', color: 'bg-yellow-500', icon: '✏️' },
  { id: 'fisio', name: 'Fisioterapia', color: 'bg-sky-400', icon: '🏃' },
  { id: 'dent', name: 'Dentista', color: 'bg-amber-800', icon: '🦷' },
  { id: 'exame', name: 'Exames', color: 'bg-neutral-800', icon: '📄' },
  { id: 'escola', name: 'Escola', color: 'bg-gray-500', icon: '🏫' },
  { id: 'medico', name: 'Médico', color: 'bg-red-500', icon: '👨‍⚕️' },
  { id: 'outro', name: 'Outro', color: 'bg-stone-400', icon: '📍' },
  { id: 'reuniao', name: 'Reunião Escolar', color: 'bg-gray-500', icon: '🏫' },
  { id: 'vacina', name: 'Vacina', color: 'bg-red-400', icon: '💉' }
];

const defaultState: AppState = {
  profiles: [defaultProfile],
  activeProfileId: defaultProfileId,
  therapyCategories: defaultTherapyCategories,
  therapies: [],
  therapySessions: [],
  appointments: [],
  medications: [],
  crises: [],
  diaryEntries: [],
  routineItems: [],
  documents: [],
};

const STORAGE_KEY = 'mae_tea_data';

export const demoProfiles: ChildProfile[] = [
  {
    id: 'child-lucas',
    name: 'Lucas',
    birthDate: '2019-03-12', // 7 years old
    diagnosis: 'Transtorno do Espectro Autista (TEA)',
    supportLevel: 'Nível 2',
    verbalState: 'Pouco verbal',
    allergies: 'Glúten, Corante amarelo',
    foodSelectivity: 'Prefere alimentos de textura crocante e cores claras (batata, biscoitos, frango frito).',
    notes: 'Lucas tem sensibilidade a barulhos altos (fogos de artifício, liquidificador). Foco em rotina bem estruturada.',
    cid: 'F84.0',
    usesPECS: true,
    usesAAC: false,
    sensorySensitivities: 'Hipersensibilidade auditiva. Gosta de estímulos de pressão profunda.',
    crisisInstructions: 'Retirar estímulos sonoros, oferecer abafador e espaço calmo. Não tentar falar muito ou forçar contato físico.',
    emergencyContacts: 'Mãe (Mariana): (11) 99999-1111 / Pai (Roberto): (11) 99999-2222',
    insurance: 'Plano Saúde Azul Co-participativo',
    leadPhysician: 'Dra. Sandra Regina (Neuropediatra)',
  },
  {
    id: 'child-sofia',
    name: 'Sofia',
    birthDate: '2021-08-20', // 5 years old
    diagnosis: 'Transtorno do Espectro Autista (TEA)',
    supportLevel: 'Nível 1',
    verbalState: 'Verbal',
    allergies: 'Nenhuma conhecida',
    foodSelectivity: 'Não aceita verduras cozidas, mas come frutas variadas (banana, maçã, morango).',
    notes: 'Sofia é muito comunicativa, mas tem dificuldade em interagir socialmente e interpretar expressões faciais de pares.',
    cid: 'F84.0',
    usesPECS: false,
    usesAAC: false,
    sensorySensitivities: 'Busca sensorial por toques e texturas. Dificuldade de tolerar tecidos ásperos ou etiquetas de roupas.',
    crisisInstructions: 'Oferecer brinquedos de apertar (fidget toys) e conversar calmamente com tom suave.',
    emergencyContacts: 'Mãe (Clara): (11) 98888-3333 / Pai (Eduardo): (11) 98888-4444',
    insurance: 'Saúde Fácil Padrão',
    leadPhysician: 'Dr. Paulo Albuquerque (Pediatra)',
  }
];

export const generateDemoState = (): AppState => {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);
  const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0];

  return {
    profiles: demoProfiles,
    activeProfileId: 'child-lucas',
    therapyCategories: defaultTherapyCategories,
    therapies: [
      {
        id: 'therapy-lucas-fono',
        childId: 'child-lucas',
        type: 'Fonoaudiologia',
        professionalName: 'Dr. Fábio Mendes',
        location: 'Clínica Som e Voz - Sala 3',
        dayOfWeek: new Date().getDay(), // Active today to easily see on HomeScreen!
        time: '14:30',
        notes: 'Trabalho de linguagem pragmática e fonação.',
        insurance: 'Plano Saúde Azul',
        guideNumber: 'G-7482-A',
        authorizedQuantity: 24,
        usedQuantity: 12
      },
      {
        id: 'therapy-lucas-to',
        childId: 'child-lucas',
        type: 'Terapia Ocupacional',
        professionalName: 'Bruna Mendes',
        location: 'Clínica Espaço Integração',
        dayOfWeek: (new Date().getDay() + 2) % 7, 
        time: '09:00',
        notes: 'Integração sensorial e coordenação motora fina.',
        insurance: 'Plano Saúde Azul',
        guideNumber: 'G-7482-B',
        authorizedQuantity: 24,
        usedQuantity: 8
      },
      {
        id: 'therapy-lucas-psico',
        childId: 'child-lucas',
        type: 'Psicologia',
        professionalName: 'Márcia Toledo',
        location: 'Clínica Comportamental Crescer',
        dayOfWeek: (new Date().getDay() + 4) % 7,
        time: '10:30',
        notes: 'Abordagem ABA para redução de comportamentos disruptivos e estimulação social.',
        insurance: 'Plano Saúde Azul',
        guideNumber: 'G-7482-C',
        authorizedQuantity: 36,
        usedQuantity: 18
      },
      {
        id: 'therapy-sofia-aba',
        childId: 'child-sofia',
        type: 'ABA',
        professionalName: 'Carla Rocha',
        location: 'Clínica Crescer',
        dayOfWeek: new Date().getDay(), // Also active today
        time: '14:00',
        notes: 'Regulação emocional e brincar funcional/partilhado.',
        insurance: 'Saúde Fácil',
        guideNumber: 'G-1152',
        authorizedQuantity: 12,
        usedQuantity: 3
      }
    ],
    therapySessions: [
      {
        id: 'session-lucas-1',
        childId: 'child-lucas',
        therapyId: 'therapy-lucas-fono',
        date: yesterdayStr,
        time: '14:30',
        status: 'Realizada',
        notes: 'Sessão excelente! Lucas usou PECS para pedir água e participou de toda a atividade lúdica.'
      },
      {
        id: 'session-lucas-2',
        childId: 'child-lucas',
        therapyId: 'therapy-lucas-to',
        date: yesterdayStr,
        time: '09:00',
        status: 'Falta',
        notes: 'Lucas estava muito indisposto de manhã devido a uma crise de noite.'
      },
      {
        id: 'session-lucas-3',
        childId: 'child-lucas',
        therapyId: 'therapy-lucas-psico',
        date: todayStr,
        time: '10:30',
        status: 'Cancelada',
        notes: 'Cancelado pela terapeuta devido a congresso.'
      },
      {
        id: 'session-lucas-4',
        childId: 'child-lucas',
        therapyId: 'therapy-lucas-fono',
        date: tenDaysAgoStr,
        time: '14:30',
        status: 'Remarcada',
        notes: 'Remarcada para terça-feira devido a consulta médica do paciente.'
      },
      {
        id: 'session-sofia-1',
        childId: 'child-sofia',
        therapyId: 'therapy-sofia-aba',
        date: yesterdayStr,
        time: '14:00',
        status: 'Realizada',
        notes: 'Excelente engajamento e contato visual.'
      }
    ],
    appointments: [
      {
        id: 'apt-lucas-1',
        childId: 'child-lucas',
        type: 'Consulta médica',
        title: 'Neuropediatra',
        date: todayStr, // Active today so it's visible on HomeScreen
        time: '16:00',
        location: 'Consultório Particular Av. Paulista',
        professionalName: 'Dra. Sandra Regina',
        notes: 'Retorno com exames e relatórios das terapeutas para reavaliação de medicação.',
        status: 'Agendada'
      },
      {
        id: 'apt-sofia-1',
        childId: 'child-sofia',
        type: 'Consulta médica',
        title: 'Pediatra',
        date: todayStr,
        time: '11:00',
        location: 'Clínica Infantil Saúde',
        professionalName: 'Dr. Paulo Albuquerque',
        notes: 'Acompanhamento de rotina, altura, peso e vacinas.',
        status: 'Agendada'
      }
    ],
    medications: [
      {
        id: 'med-lucas-1',
        childId: 'child-lucas',
        name: 'Risperidona 1mg/ml',
        dosage: '0.5 ml pela manhã e 0.5 ml à noite',
        times: ['08:00', '20:00'],
        stock: 25,
        remindersEnabled: true
      },
      {
        id: 'med-lucas-2',
        childId: 'child-lucas',
        name: 'Melatonina 0.2mg/gota',
        dosage: '3 gotas antes de dormir',
        times: ['21:30'],
        stock: 50,
        remindersEnabled: true
      },
      {
        id: 'med-sofia-1',
        childId: 'child-sofia',
        name: 'Suplemento Vitamínico Infantil',
        dosage: '1 comprimido mastigável pela manhã',
        times: ['08:30'],
        stock: 15,
        remindersEnabled: false
      }
    ],
    crises: [
      {
        id: 'crisis-lucas-1',
        childId: 'child-lucas',
        date: yesterdayStr,
        time: '17:15',
        durationMins: 20,
        intensity: 'Forte',
        trigger: 'Barulho imprevisto de furadeira no apartamento vizinho durante o lanche.',
        description: 'Começou a gritar, chorar copiosamente, tapar os ouvidos e desferir tapas contra a parede.',
        resolution: 'Abafadores de som colocados e levado ao quarto com luz suave. Usou PECS e relaxou com almofada sensorial.'
      },
      {
        id: 'crisis-lucas-2',
        childId: 'child-lucas',
        date: tenDaysAgoStr,
        time: '10:00',
        durationMins: 15,
        intensity: 'Moderada',
        trigger: 'Troca repentina de itinerário para ir ao parque.',
        description: 'Lucas sentou no chão, recusou a andar e fez movimentos repetitivos intensos chorando.',
        resolution: 'Foi mostrado o cartão PECS da transição e prometida uma parada rápida na padaria preferida.'
      },
      {
        id: 'crisis-sofia-1',
        childId: 'child-sofia',
        date: yesterdayStr,
        time: '15:30',
        durationMins: 10,
        intensity: 'Leve',
        trigger: 'Etiqueta irritante na gola da camiseta nova.',
        description: 'Sofia começou a puxar a gola freneticamente, gritando e pulando de agitação.',
        resolution: 'A camiseta foi removida imediatamente e a etiqueta cortada. Sofia acalmou-se bebendo água gelada.'
      }
    ],
    diaryEntries: [
      {
        id: 'diary-lucas-1',
        childId: 'child-lucas',
        date: todayStr,
        sleep: 'Dormiu bem, acordou bem humorado',
        food: 'Aceitou batata e frango crocante, recusou o feijão',
        crises: 'Nenhuma crise hoje',
        behavior: 'Calmo, embora agitado em certos momentos',
        communication: 'Usou os cartões PECS de forma espontânea',
        school: 'A professora relatou que Lucas interagiu bem na roda de conversa',
        bowel: 'Normal',
        meds: 'Tomou Risperidona corretamente',
        notes: 'Dia proveitoso e tranquilo.'
      },
      {
        id: 'diary-lucas-2',
        childId: 'child-lucas',
        date: yesterdayStr,
        sleep: 'Dificuldade para pegar no sono, acordou estressado',
        food: 'Alimentação recusada no almoço, aceitou lanche da tarde',
        crises: 'Crise forte de 20 min por barulho de furadeira',
        behavior: 'Mais focado em autoestimulação e irritabilidade',
        communication: 'Precisou de apoio e cards para organizar desejos',
        school: 'Faltou à escola devido ao cansaço corporal',
        bowel: 'Ressecado',
        meds: 'Tomou medicação e melatonia',
        notes: 'Dia difícil devido ao barulho da obra.'
      },
      {
        id: 'diary-sofia-1',
        childId: 'child-sofia',
        date: todayStr,
        sleep: 'Excelente noite de sono, acordou muito sorridente',
        food: 'Alimentou-se super bem. Comeu maçã picada',
        crises: 'Nenhuma crise registrada hoje',
        behavior: 'Cooperativo e concentrado nas brincadeiras',
        communication: 'Muito falante, contando histórias das bonecas',
        school: 'Teve excelente mediação na escola, fez uma nova amiga',
        bowel: 'Normal',
        meds: 'Tomou suplemento pela manhã',
        notes: 'Dia formidável e cheio de alegria.'
      }
    ],
    routineItems: [
      {
        id: 'routine-lucas-1',
        childId: 'child-lucas',
        iconName: '☀️',
        title: 'Acordar e escovar os dentes',
        time: '07:30',
        completedDates: [todayStr]
      },
      {
        id: 'routine-lucas-2',
        childId: 'child-lucas',
        iconName: '🍽️',
        title: 'Café da manhã',
        time: '08:00',
        completedDates: [todayStr]
      },
      {
        id: 'routine-lucas-3',
        childId: 'child-lucas',
        iconName: '🏫',
        title: 'Ir para a escola',
        time: '12:30',
        completedDates: []
      },
      {
        id: 'routine-lucas-4',
        childId: 'child-lucas',
        iconName: '🧩',
        title: 'Sessão de Terapia Ocupacional',
        time: '15:00',
        completedDates: []
      },
      {
        id: 'routine-lucas-5',
        childId: 'child-lucas',
        iconName: '🚿',
        title: 'Banho relaxante',
        time: '18:30',
        completedDates: []
      },
      {
        id: 'routine-lucas-6',
        childId: 'child-lucas',
        iconName: '🛏️',
        title: 'Hora de dormir',
        time: '21:30',
        completedDates: []
      },
      {
        id: 'routine-sofia-1',
        childId: 'child-sofia',
        iconName: '☀️',
        title: 'Despertar e trocar de roupa',
        time: '08:00',
        completedDates: [todayStr]
      },
      {
        id: 'routine-sofia-2',
        childId: 'child-sofia',
        iconName: '🎒',
        title: 'Ir para a escolinha municipal',
        time: '08:45',
        completedDates: [todayStr]
      },
      {
        id: 'routine-sofia-3',
        childId: 'child-sofia',
        iconName: '🍽️',
        title: 'Almoço em família',
        time: '12:00',
        completedDates: []
      },
      {
        id: 'routine-sofia-4',
        childId: 'child-sofia',
        iconName: '🎨',
        title: 'Brincadeiras livres com brinquedo sensorial',
        time: '16:00',
        completedDates: []
      },
      {
        id: 'routine-sofia-5',
        childId: 'child-sofia',
        iconName: '🪥',
        title: 'Escovar dentes e ir dormir',
        time: '21:00',
        completedDates: []
      }
    ],
    documents: [
      {
        id: 'doc-lucas-1',
        childId: 'child-lucas',
        type: 'Laudo',
        title: 'Laudo Neuropsicológico Completo - Dra. Sandra Regina',
        date: '2025-11-20',
        notes: 'Confirmação diagnóstica de Transtorno do Espectro Autista (F84.0) e indicação terapêutica intensiva.',
        fileName: 'laudo_lucas_tea.pdf',
        fileSize: 4500000,
        fileType: 'application/pdf',
        expirationDate: ''
      },
      {
        id: 'doc-lucas-2',
        childId: 'child-lucas',
        type: 'Receita',
        title: 'Receituário de Uso Contínuo - Risperidona e Melatonina',
        date: '2026-05-15',
        notes: 'Válido por 180 dias. Retorno necessário em novembro para renovação.',
        fileName: 'receituario_risper_melat.png',
        fileSize: 180000,
        fileType: 'image/png',
        expirationDate: '2026-11-15'
      },
      {
        id: 'doc-sofia-1',
        childId: 'child-sofia',
        type: 'Laudo',
        title: 'Certificado de Avaliação - Equipe Multidisciplinar',
        date: '2026-01-10',
        notes: 'Laudo para acompanhamento escolar e solicitação de mediação pedagógica.',
        fileName: 'avaliacao_sofia_multi.pdf',
        fileSize: 2200000,
        fileType: 'application/pdf',
        expirationDate: ''
      }
    ]
  };
};

export interface AppStore {
  userUid: string | null;
  setUserUid: (uid: string | null) => void;
  syncStatus: 'Sincronizado' | 'Salvando...' | 'Sem conexão' | 'Erro';
  setSyncStatus: (status: 'Sincronizado' | 'Salvando...' | 'Sem conexão' | 'Erro') => void;
  state: AppState;
  isDemoActive?: boolean;
  realState?: AppState | null;
  savedDemoState?: AppState | null;
  enterDemoMode: () => void;
  exitDemoMode: (deleteData: boolean) => void;
  getActiveProfile: () => ChildProfile;
  addProfile: (profile: Omit<ChildProfile, 'id'>) => void;
  switchProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<ChildProfile>) => void;
  deleteProfile: (id: string) => Promise<void>;
  addTherapy: (therapy: Therapy) => void;
  updateTherapy: (id: string, updates: Partial<Therapy>) => void;
  deleteTherapy: (id: string) => void;
  addTherapySession: (session: import('./types').TherapySession) => void;
  updateTherapySession: (id: string, updates: Partial<import('./types').TherapySession>) => void;
  deleteTherapySession: (id: string) => void;
  addAppointment: (appointment: import('./types').Appointment) => void;
  updateAppointment: (id: string, updates: Partial<import('./types').Appointment>) => void;
  deleteAppointment: (id: string) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  updateDiaryEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteDiaryEntry: (id: string) => void;
  toggleRoutineItem: (id: string, dateStr: string) => void;
  addRoutineItem: (item: RoutineItem) => void;
  updateRoutineItem: (id: string, updates: Partial<RoutineItem>) => void;
  deleteRoutineItem: (id: string) => void;
  addDocument: (doc: AppDocument) => void;
  updateDocument: (id: string, updates: Partial<AppDocument>) => void;
  deleteDocument: (id: string) => void;
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  addCrisis: (crisis: import('./types').Crisis) => void;
  updateCrisis: (id: string, updates: Partial<import('./types').Crisis>) => void;
  deleteCrisis: (id: string) => void;
  addTherapyCategory: (category: import('./types').TherapyCategory) => void;
  updateTherapyCategory: (id: string, updates: Partial<import('./types').TherapyCategory>) => void;
  deleteTherapyCategory: (id: string) => void;
  replaceState: (newState: AppState) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      userUid: null,
      setUserUid: (uid) => set({ userUid: uid }),
      syncStatus: 'Sem conexão',
      setSyncStatus: (status) => set({ syncStatus: status }),
      state: defaultState,
      isDemoActive: false,
      realState: null,
      savedDemoState: null,

      enterDemoMode: () => {
        const current = get();
        if (current.isDemoActive) return;

        // Keep realState if we haven't already
        const realState = { ...current.state };
        const demoStateSelected = current.savedDemoState || generateDemoState();

        set(() => ({
          isDemoActive: true,
          realState: realState,
          state: demoStateSelected
        }));
      },

      exitDemoMode: (deleteData: boolean) => {
        const current = get();
        if (!current.isDemoActive) return;

        const updatedDemoState = deleteData ? null : { ...current.state };
        const originalState = current.realState || defaultState;

        set(() => ({
          isDemoActive: false,
          savedDemoState: updatedDemoState,
          realState: null,
          state: originalState
        }));
      },

      getActiveProfile: () => {
        const s = get().state;
        return s.profiles.find((p) => p.id === s.activeProfileId) || s.profiles[0] || defaultProfile;
      },

      addProfile: (profile) =>
        set((s) => {
          const newProfile = { ...profile, id: generateId() };
          if (s.userUid) saveToCloud(s.userUid, `children`, newProfile.id, newProfile);
          return {
            state: {
              ...s.state,
              profiles: [...s.state.profiles, newProfile],
              activeProfileId: newProfile.id,
            },
          };
        }),

      switchProfile: (id) =>
        set((s) => ({
          state: { ...s.state, activeProfileId: id },
        })),

      updateProfile: (id, updates) =>
        set((s) => {
          const p = s.state.profiles.find((x) => x.id === id);
          if (s.userUid && p) saveToCloud(s.userUid, `children`, id, { ...p, ...updates });
          return {
            state: {
              ...s.state,
              profiles: s.state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            },
          };
        }),

      deleteProfile: async (id) => {
         const s = get();
         const safeProfiles = Array.isArray(s.state.profiles) ? s.state.profiles : [];
         const remainingProfiles = safeProfiles.filter((p) => p.id !== id);
         
         let newActiveProfileId = s.state.activeProfileId;
         if (newActiveProfileId === id) {
           newActiveProfileId = remainingProfiles.length > 0 ? remainingProfiles[0].id : null;
         }

         let finalProfiles = remainingProfiles;
         if (finalProfiles.length === 0) {
            const defaultProfId = crypto.randomUUID();
            const newDefault = {
               id: defaultProfId,
               name: '',
               birthDate: '',
               diagnosis: 'Transtorno do Espectro Autista',
               supportLevel: 'Não especificado' as const,
               verbalState: 'Pouco verbal' as const,
               allergies: '',
               foodSelectivity: '',
               notes: '',
            };
            finalProfiles = [newDefault];
            newActiveProfileId = defaultProfId;
            if (s.userUid) await saveToCloud(s.userUid, `children`, defaultProfId, newDefault);
         }
         
         if (s.userUid) {
            try {
               await deleteFromCloud(s.userUid, `children`, id);
               
               // Attempt to delete subcollections, optionally ignoring errors here since child doc is deleted
               // A real cleanup would require cloud functions or iterating all subdocs.
               // For this client side logic, the core ask is deleting the 'children/${id}' document.
            } catch (err) {
               console.error('Erro ao excluir criança na nuvem', err);
               throw new Error('Não foi possível excluir o perfil agora. Seus dados não foram apagados. Tente novamente.');
            }
         }

         const safeArr = <T>(arr: T[] | undefined): T[] => Array.isArray(arr) ? arr : [];

         set((currentState) => ({
           ...currentState,
           state: {
             ...currentState.state,
             profiles: finalProfiles,
             activeProfileId: newActiveProfileId,
             therapies: safeArr(currentState.state.therapies).filter((t) => t.childId !== id),
             therapySessions: safeArr(currentState.state.therapySessions).filter((ts) => ts.childId !== id),
             appointments: safeArr(currentState.state.appointments).filter((a) => a.childId !== id),
             medications: safeArr(currentState.state.medications).filter((m) => m.childId !== id),
             crises: safeArr(currentState.state.crises).filter((c) => c.childId !== id),
             diaryEntries: safeArr(currentState.state.diaryEntries).filter((d) => d.childId !== id),
             routineItems: safeArr(currentState.state.routineItems).filter((r) => r.childId !== id),
             documents: safeArr(currentState.state.documents).filter((doc) => doc.childId !== id),
           },
         }));
      },

      addTherapy: (therapy) =>
        set((s) => {
          if (s.userUid) saveToCloud(s.userUid, `children/${therapy.childId}/therapies`, therapy.id, therapy);
          return {
            state: { ...s.state, therapies: [...s.state.therapies, therapy] },
          };
        }),

      updateTherapy: (id, updates) =>
        set((s) => {
          const therapies = s.state.therapies || [];
          const t = therapies.find((x) => x.id === id);
          if (s.userUid && t) saveToCloud(s.userUid, `children/${t.childId}/therapies`, id, { ...t, ...updates });
          return {
            state: {
              ...s.state,
              therapies: therapies.map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),

      deleteTherapy: (id) =>
        set((s) => {
          const therapies = s.state.therapies || [];
          const sessions = s.state.therapySessions || [];
          const t = therapies.find((x) => x.id === id);
          if (s.userUid && t) {
             deleteFromCloud(s.userUid, `children/${t.childId}/therapies`, id);
             const sessionsToDelete = sessions.filter(ts => ts.therapyId === id);
             sessionsToDelete.forEach(ts => {
                deleteFromCloud(s.userUid, `children/${ts.childId}/therapy_sessions`, ts.id);
             });
          }
          return {
            state: {
              ...s.state,
              therapies: therapies.filter((item) => item.id !== id),
              therapySessions: sessions.filter((ts) => ts.therapyId !== id),
            },
          };
        }),

      addTherapySession: (session) =>
        set((s) => {
          session.status = normalizeStatus(session.status);
          if (s.userUid) saveToCloud(s.userUid, `children/${session.childId}/therapy_sessions`, session.id, session);
          return {
            state: { ...s.state, therapySessions: [...(s.state.therapySessions || []), session] },
          };
        }),

      updateTherapySession: (id, updates) =>
        set((s) => {
          if (updates.status) updates.status = normalizeStatus(updates.status);
          const t = (s.state.therapySessions || []).find((x) => x.id === id);
          if (s.userUid && t) saveToCloud(s.userUid, `children/${t.childId}/therapy_sessions`, id, { ...t, ...updates });
          return {
            state: {
              ...s.state,
              therapySessions: (s.state.therapySessions || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
            },
          };
        }),

      deleteTherapySession: (id) =>
        set((s) => {
          const t = (s.state.therapySessions || []).find((x) => x.id === id);
          if (s.userUid && t) deleteFromCloud(s.userUid, `children/${t.childId}/therapy_sessions`, id);
          return {
            state: {
              ...s.state,
              therapySessions: (s.state.therapySessions || []).filter((t) => t.id !== id),
            },
          };
        }),

      addAppointment: (appointment) =>
        set((s) => {
          appointment.status = normalizeStatus(appointment.status);
          if (s.userUid) saveToCloud(s.userUid, `children/${appointment.childId}/appointments`, appointment.id, appointment);
          return {
            state: { ...s.state, appointments: [...(s.state.appointments || []), appointment] },
          };
        }),

      updateAppointment: (id, updates) =>
        set((s) => {
          if (updates.status) updates.status = normalizeStatus(updates.status);
          const a = (s.state.appointments || []).find((x) => x.id === id);
          if (s.userUid && a) saveToCloud(s.userUid, `children/${a.childId}/appointments`, id, { ...a, ...updates });
          return {
            state: {
              ...s.state,
              appointments: (s.state.appointments || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
            },
          };
        }),

      deleteAppointment: (id) =>
        set((s) => {
          const a = (s.state.appointments || []).find((x) => x.id === id);
          if (s.userUid && a) deleteFromCloud(s.userUid, `children/${a.childId}/appointments`, id);
          return {
            state: {
              ...s.state,
              appointments: (s.state.appointments || []).filter((t) => t.id !== id),
            },
          };
        }),

      addDiaryEntry: (entry) =>
        set((s) => {
          if (s.userUid) saveToCloud(s.userUid, `children/${entry.childId}/diary`, entry.id, entry);
          return {
            state: {
              ...s.state,
              diaryEntries: [
                entry,
                ...(s.state.diaryEntries || []).filter((e) => e.id !== entry.id),
              ],
            },
          };
        }),

      updateDiaryEntry: (id, updates) =>
        set((s) => {
          const diary = s.state.diaryEntries || [];
          const e = diary.find((x) => x.id === id);
          if (s.userUid && e) saveToCloud(s.userUid, `children/${e.childId}/diary`, id, { ...e, ...updates });
          return {
            state: {
              ...s.state,
              diaryEntries: diary.map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),
        
      deleteDiaryEntry: (id) =>
        set((s) => {
          const diary = s.state.diaryEntries || [];
          const e = diary.find((x) => x.id === id);
          if (s.userUid && e) deleteFromCloud(s.userUid, `children/${e.childId}/diary`, id);
          return {
            state: {
              ...s.state,
              diaryEntries: diary.filter((item) => item.id !== id),
            },
          };
        }),

      toggleRoutineItem: (id, dateStr) =>
        set((s) => {
          const routines = s.state.routineItems || [];
          const newState = { ...s.state, routineItems: [...routines] };
          const idx = newState.routineItems.findIndex((r) => r.id === id);
          if (idx !== -1) {
            const r = newState.routineItems[idx];
            // Backward compatibility with legacy completedAt
            const dates = Array.isArray(r.completedDates) ? [...r.completedDates] : 
                          (r.completedAt && r.completedAt.startsWith(dateStr) ? [dateStr] : []);
            
            const isCompletedToday = dates.includes(dateStr);
            
            let newDates;
            if (isCompletedToday) {
               newDates = dates.filter(d => d !== dateStr);
            } else {
               newDates = [...dates, dateStr];
            }

            newState.routineItems[idx] = { 
               ...r, 
               completedDates: newDates,
               // Keep completedAt in sync locally just in case other parts rely on it exactly for legacy:
               completedAt: !isCompletedToday ? new Date().toISOString() : undefined
            };
            if (s.userUid) saveToCloud(s.userUid, `children/${r.childId}/routines`, r.id, newState.routineItems[idx]);
          }
          return { state: newState };
        }),

      addRoutineItem: (item) =>
        set((s) => {
          const routines = s.state.routineItems || [];
          if (s.userUid) saveToCloud(s.userUid, `children/${item.childId}/routines`, item.id, item);
          return {
            state: {
              ...s.state,
              routineItems: [...routines, item].sort((a, b) => a.time.localeCompare(b.time)),
            },
          };
        }),

      updateRoutineItem: (id, updates) =>
        set((s) => {
          const routines = s.state.routineItems || [];
          const r = routines.find((x) => x.id === id);
          if (s.userUid && r) saveToCloud(s.userUid, `children/${r.childId}/routines`, id, { ...r, ...updates });
          return {
            state: {
              ...s.state,
              routineItems: routines.map((item) => (item.id === id ? { ...item, ...updates } : item)).sort((a, b) => a.time.localeCompare(b.time)),
            },
          };
        }),

      deleteRoutineItem: (id) =>
        set((s) => {
          const routines = s.state.routineItems || [];
          const r = routines.find((x) => x.id === id);
          if (s.userUid && r) deleteFromCloud(s.userUid, `children/${r.childId}/routines`, id);
          return {
            state: {
              ...s.state,
              routineItems: routines.filter((item) => item.id !== id),
            },
          };
        }),

      addDocument: (doc) =>
        set((s) => {
          if (s.userUid) saveToCloud(s.userUid, `children/${doc.childId}/documents`, doc.id, doc);
          return {
            state: { ...s.state, documents: [...(s.state.documents || []), doc] },
          };
        }),

      updateDocument: (id, updates) =>
        set((s) => {
          const docs = s.state.documents || [];
          const d = docs.find((x) => x.id === id);
          if (s.userUid && d) saveToCloud(s.userUid, `children/${d.childId}/documents`, id, { ...d, ...updates });
          return {
            state: {
              ...s.state,
              documents: docs.map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),

      deleteDocument: (id) =>
        set((s) => {
          const docs = s.state.documents || [];
          const d = docs.find((x) => x.id === id);
          if (s.userUid && d) deleteFromCloud(s.userUid, `children/${d.childId}/documents`, id);
          return {
            state: {
              ...s.state,
              documents: docs.filter((item) => item.id !== id),
            },
          };
        }),

      addMedication: (med) =>
        set((s) => {
          if (s.userUid) saveToCloud(s.userUid, `children/${med.childId}/medications`, med.id, med);
          return {
            state: { ...s.state, medications: [...(s.state.medications || []), med] },
          };
        }),

      updateMedication: (id, updates) =>
        set((s) => {
          const meds = s.state.medications || [];
          const m = meds.find((x) => x.id === id);
          if (s.userUid && m) saveToCloud(s.userUid, `children/${m.childId}/medications`, id, { ...m, ...updates });
          return {
            state: {
              ...s.state,
              medications: meds.map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),

      deleteMedication: (id) =>
        set((s) => {
          const meds = s.state.medications || [];
          const m = meds.find((x) => x.id === id);
          if (s.userUid && m) deleteFromCloud(s.userUid, `children/${m.childId}/medications`, id);
          return {
            state: {
              ...s.state,
              medications: meds.filter((item) => item.id !== id),
            },
          };
        }),

      addCrisis: (crisis) =>
        set((s) => {
          if (s.userUid) saveToCloud(s.userUid, `children/${crisis.childId}/crises`, crisis.id, crisis);
          return {
            state: { ...s.state, crises: [...(s.state.crises || []), crisis] },
          };
        }),

      updateCrisis: (id, updates) =>
        set((s) => {
          const crises = s.state.crises || [];
          const c = crises.find((x) => x.id === id);
          if (s.userUid && c) saveToCloud(s.userUid, `children/${c.childId}/crises`, id, { ...c, ...updates });
          return {
            state: {
              ...s.state,
              crises: crises.map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),

      deleteCrisis: (id) =>
        set((s) => {
          const crises = s.state.crises || [];
          const c = crises.find((x) => x.id === id);
          if (s.userUid && c) deleteFromCloud(s.userUid, `children/${c.childId}/crises`, id);
          return {
            state: {
              ...s.state,
              crises: crises.filter((item) => item.id !== id),
            },
          };
        }),
        
      addTherapyCategory: (category) =>
        set((s) => {
          return { state: { ...s.state, therapyCategories: [...(s.state.therapyCategories || []), category] } };
        }),
        
      updateTherapyCategory: (id, updates) =>
        set((s) => {
          return {
            state: {
              ...s.state,
              therapyCategories: (s.state.therapyCategories || []).map((item) => (item.id === id ? { ...item, ...updates } : item)),
            },
          };
        }),
        
      deleteTherapyCategory: (id) =>
        set((s) => {
          return {
            state: {
              ...s.state,
              therapyCategories: (s.state.therapyCategories || []).filter((item) => item.id !== id),
            },
          };
        }),
        
      replaceState: (newState) =>
        set(() => ({ 
          state: {
            profiles: Array.isArray(newState.profiles) ? newState.profiles : defaultState.profiles,
            activeProfileId: newState.activeProfileId || defaultState.activeProfileId,
            therapyCategories: Array.isArray(newState.therapyCategories) ? newState.therapyCategories : defaultTherapyCategories,
            therapies: Array.isArray(newState.therapies) ? newState.therapies : [],
            therapySessions: Array.isArray(newState.therapySessions) ? newState.therapySessions : [],
            appointments: Array.isArray(newState.appointments) ? newState.appointments : [],
            medications: Array.isArray(newState.medications) ? newState.medications : [],
            crises: Array.isArray(newState.crises) ? newState.crises : [],
            diaryEntries: Array.isArray(newState.diaryEntries) ? newState.diaryEntries : [],
            routineItems: Array.isArray(newState.routineItems) ? newState.routineItems : [],
            documents: Array.isArray(newState.documents) ? newState.documents : []
          } 
        }))
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        userUid: persistedState?.userUid ?? currentState.userUid,
        isDemoActive: persistedState?.isDemoActive ?? currentState.isDemoActive,
        realState: persistedState?.realState ?? currentState.realState,
        savedDemoState: persistedState?.savedDemoState ?? currentState.savedDemoState,
        state: {
          profiles: Array.isArray(persistedState?.state?.profiles) ? persistedState.state.profiles : defaultState.profiles,
          activeProfileId: persistedState?.state?.activeProfileId || defaultState.activeProfileId,
          therapyCategories: Array.isArray(persistedState?.state?.therapyCategories) && persistedState.state.therapyCategories.length > 0 ? persistedState.state.therapyCategories : defaultTherapyCategories,
          therapies: Array.isArray(persistedState?.state?.therapies) ? persistedState.state.therapies : [],
          therapySessions: Array.isArray(persistedState?.state?.therapySessions) ? persistedState.state.therapySessions : [],
          appointments: Array.isArray(persistedState?.state?.appointments) ? persistedState.state.appointments : [],
          medications: Array.isArray(persistedState?.state?.medications) ? persistedState.state.medications : [],
          crises: Array.isArray(persistedState?.state?.crises) ? persistedState.state.crises : [],
          diaryEntries: Array.isArray(persistedState?.state?.diaryEntries) ? persistedState.state.diaryEntries : [],
          routineItems: Array.isArray(persistedState?.state?.routineItems) ? persistedState.state.routineItems : [],
          documents: Array.isArray(persistedState?.state?.documents) ? persistedState.state.documents : []
        }
      }),
      migrate: (persistedState: any, version: number) => {
        try {
          const legacyStr = window.localStorage.getItem('mae_tea_data'); // Check local storage for really old legacy
          if (legacyStr) {
             const legacyData = JSON.parse(legacyStr);
             // Migrate old routine items with text icons to emoji icons
             const iconMap: Record<string, string> = {
               'Sun': '☀️', 'Bath': '🚿', 'Utensils': '🍽️', 'Backpack': '🎒', 
               'Puzzle': '🧩', 'Moon': '🌙', 'Bed': '🛏️', 'School': '🏫', 
               'Toothbrush': '🪥', 'Shower': '🚿', 'Medication': '💊', 
               'Therapy': '🧩', 'Food': '🍽️'
             };
             if (legacyData.state?.routineItems) {
               legacyData.state.routineItems = legacyData.state.routineItems.map((r: any) => ({
                 ...r,
                 iconName: iconMap[r.iconName] || r.iconName || '🌟'
               }));
             }
             return legacyData;
          }
        } catch(e) {}
        
        // Also migrate existing persistedState icons if any
        if (persistedState?.state?.routineItems) {
           const iconMap: Record<string, string> = {
             'Sun': '☀️', 'Bath': '🚿', 'Utensils': '🍽️', 'Backpack': '🎒', 
             'Puzzle': '🧩', 'Moon': '🌙', 'Bed': '🛏️', 'School': '🏫', 
             'Toothbrush': '🪥', 'Shower': '🚿', 'Medication': '💊', 
             'Therapy': '🧩', 'Food': '🍽️'
           };
           persistedState.state.routineItems = persistedState.state.routineItems.map((r: any) => ({
             ...r,
             iconName: iconMap[r.iconName] || r.iconName || '🌟'
           }));
        }
        
        return persistedState;
      }
    }
  )
);
