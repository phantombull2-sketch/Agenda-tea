export type SupportLevel = 'Nível 1' | 'Nível 2' | 'Nível 3' | 'Não especificado';
export type VerbalState = 'Verbal' | 'Pouco verbal' | 'Não verbal';

export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  diagnosis: string;
  supportLevel: SupportLevel;
  verbalState: VerbalState;
  allergies: string;
  foodSelectivity: string;
  notes: string;
  
  // Passport specific
  cid?: string;
  usesPECS?: boolean;
  usesAAC?: boolean;
  sensorySensitivities?: string;
  crisisInstructions?: string;
  emergencyContacts?: string;
  insurance?: string;
  leadPhysician?: string;
  photoUrl?: string; // Firebase URL
  photoData?: string; // Local Base64
}

export interface TherapyCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type TherapyType = string;
export type TherapyStatus = 'Agendada' | 'Realizada' | 'Falta' | 'Cancelada' | 'Remarcada';

export interface Therapy {
  id: string;
  childId: string;
  type: TherapyType;
  professionalName: string;
  location: string;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  time: string; // HH:mm
  status?: TherapyStatus; 
  notes: string;
  startDate?: string;
  endDate?: string;
  // Advanced Guide Control
  insurance?: string;
  guideNumber?: string;
  authorizedQuantity?: number;
  usedQuantity?: number;
  issueDate?: string; 
  expirationDate?: string;
}

export interface TherapySession {
  id: string;
  childId: string;
  therapyId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: TherapyStatus;
  notes?: string;
}

export type AppointmentType = string;

export interface Appointment {
  id: string;
  childId: string;
  title?: string;
  type: AppointmentType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  professionalName: string;
  notes: string;
  status: TherapyStatus;
}

export interface Medication {
  id: string;
  childId: string;
  name: string;
  dosage: string;
  times: string[]; // ['08:00', '20:00']
  stock: number;
  remindersEnabled: boolean;
}

export interface Crisis {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMins: number;
  intensity: 'Leve' | 'Moderada' | 'Forte' | 'Severa';
  trigger: string;
  description: string;
  resolution: string;
}

export interface AttachedPhoto {
  fileData?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface DiaryEntry {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  sleep: string;
  food: string;
  crises: string;
  behavior: string;
  communication: string;
  school: string;
  bowel: string;
  meds: string;
  notes: string;
  photos?: AttachedPhoto[];
}

export interface RoutineItem {
  id: string;
  childId: string;
  iconName: string;
  title: string;
  time: string; // HH:mm
  completedAt?: string; // Legacy ISO string
  completedDates?: string[]; // Array of YYYY-MM-DD
  isTemplate?: boolean; 
  order?: number;
}

export type DocumentType = 'Laudo' | 'Receita' | 'Guia' | 'Autorização' | 'Relatório' | 'Carteirinha' | 'Exame' | 'Outro';

export interface AppDocument {
  id: string;
  childId: string;
  type: DocumentType;
  title: string;
  date: string; // YYYY-MM-DD
  notes: string;
  fileData?: string; 
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string; // Added for true firebase compatibility
  expirationDate?: string; 
}

export interface AppState {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  therapyCategories: TherapyCategory[];
  therapies: Therapy[];
  therapySessions: TherapySession[];
  appointments: Appointment[]; // Added appointments
  medications: Medication[];
  crises: Crisis[];
  diaryEntries: DiaryEntry[];
  routineItems: RoutineItem[];
  documents: AppDocument[];
}
