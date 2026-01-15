
export type UserRole = 'Superuser' | 'Jefatura' | 'Médico' | 'Técnico' | 'Administrativo';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  photo?: string;
}

export type ActiveModule =
  | 'agrawall'
  | 'hr'
  | 'documentation'
  | 'timeoff'
  | 'procedures'
  | 'messaging'
  | 'dashboard'
  | 'institutions'
  | 'news'
  | 'signatures'
  | 'management'
  | 'shifts'
  | 'indicators'
  | 'workhub';

export type RolePermissions = Record<UserRole, ActiveModule[]>;
// ... resto del archivo se mantiene igual
export interface PatientMetadata {
  patientName: string;
  examType: string;
  reportDate: string;
  reportingPhysician: string;
  clinicalCenter: string;
}

export interface AgrawallAnalysis {
  id: string;
  timestamp: number;
  scaleLevel: number;
  levelName: string;
  category: string;
  errorType: 'Percepción' | 'Juicio' | 'Ninguno' | 'Forma' | 'No aplica';
  technicalAnalysis: string;
  safetyRecommendation: string;
  clinicalImpactDetails: string;
  findingsEvaluation: {
    identification: string;
    terminology: string;
    correlation: string;
  };
  metadata: PatientMetadata;
}

export type LoadingStatus = 'idle' | 'processing' | 'success' | 'error';

// Document & Documentation Types
export interface DocumentRecord {
  id: string;
  name: string;
  category: 'Legal' | 'Clinical' | 'Administrative' | 'Training' | 'Contract';
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Expired';
  createdDate: string;
  uploadDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  mandatory: boolean;
}

export interface DocumentProfile {
  id: string;
  name: string;
  description: string;
  requiredDocs: string[];
}

export interface EmployeeCompliance {
  id: string;
  employeeId: string;
  completionPercentage: number;
  lastUpdate: string;
  documents: DocumentRecord[];
}

// Signature Module Types
export type SignatureStatus = 'Pendiente' | 'Enviado' | 'Visto' | 'Firmado';

export interface SignatureDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  status: SignatureStatus;
  createdAt: string;
  viewedAt?: string;
  signedAt?: string;
  signatureData?: string;
  signerName: string;
  signerRole: string;
  signerEmail: string;
}

// Institution & Contract Types
export interface SLAValue {
  value: number;
  unit: 'horas' | 'días';
}

export interface ContractSLA {
  emergencies: SLAValue;
  inpatients: SLAValue;
  outpatient: SLAValue;
  oncology: SLAValue;
  others?: SLAValue;
}

export interface Contract {
  id: string;
  institutionId: string;
  title: string;
  bidNumber?: string;
  type: 'Contrato' | 'Licitación';
  status: 'Activo' | 'Inactivo' | 'Vencido' | 'Pendiente' | 'Renovación';
  startDate: string;
  endDate: string;
  sla: ContractSLA;
  fines?: string;
  value?: number;
  documents: DocumentRecord[];
}

export type InstitutionCategory = 'Hospital' | 'Clínica' | 'Centro Médico' | 'Laboratorio' | 'Ilustre Municipalidad' | 'Servicio de Salud' | 'Otro';

export interface Institution {
  id: string;
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  category: InstitutionCategory;
  active: boolean;
  logo?: string;
}

// Employee & HR Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  joinDate: string;
  university: string;
  superintendenciaId?: string;
  email: string;
  phone: string;
  photo?: string;
  idNumber: string;
  nationality: string;
  residenceCountry: string;
  residenceCity: string;
  role: 'Médico' | 'Técnico' | 'Enfermería' | 'Administrativo';
  department: string;
  subSpecialty?: string;
  group?: string;
  hiringEntity: string;
  contractType?: string;
  username?: string;
  signatureType?: string;
  laborRelation?: 'Sociedad' | 'Independiente' | 'Contrato';
  terminationDate?: string;
  tags?: string[];
  status: 'Activo' | 'Licencia Médica' | 'Vacaciones' | 'Suspendido' | 'Renuncia' | 'Baja Temporal';
  performance: number;
}

// Time Off Types
export type TimeOffType = 'Vacación' | 'Licencia Médica' | 'Permiso Administrativo' | 'Ausencia' | 'Capacitación';
export type TimeOffStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Finalizado';

export interface TimeOffEntry {
  id: string;
  employeeId: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason: string;
  status: TimeOffStatus;
  createdAt: string;
}

// News & Events Types
export type NewsCategory = 'Noticia' | 'Evento' | 'Fecha Importante' | 'Comunicado';

export interface NewsPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  content: string;
  category: NewsCategory;
  timestamp: string;
  eventDate?: string;
  targetRoles: UserRole[];
  targetUserIds: string[];
  attachments: {
    id: string;
    type: 'image' | 'video' | 'file' | 'link';
    name: string;
    url: string;
  }[];
}

// Procedures Types
export type ProcedureStatus = 'Pendiente Docs' | 'Listo' | 'Programado' | 'Completado' | 'Cancelado';
export type ProcedureModality = 'US' | 'TAC' | 'RM' | 'Rx' | 'Mamografía';

export interface ProcedureRequirement {
  id: string;
  name: string;
  isCompleted: boolean;
  fileUrl?: string;
}

export interface ProcedureEntry {
  id: string;
  patientName: string;
  patientRut: string;
  patientPhone: string;
  patientEmail: string;
  patientInsurance?: string;
  patientBirthDate?: string;
  patientAddress?: string;
  takesAnticoagulants?: boolean;
  procedureType: string;
  value: number;
  modality: ProcedureModality;
  referringPhysician: string;
  radiologistId: string;
  clinicalCenter: string;
  status: ProcedureStatus;
  createdAt: string;
  scheduledDate?: string;
  requirements: ProcedureRequirement[];
}

export interface ProcedureCatalogItem {
  id: string;
  name: string;
  baseValue: number;
  defaultModality: ProcedureModality;
  active: boolean;
  requiredDocs: string[];
}

// Messaging Types
export interface MessageAttachment {
  id: string;
  type: 'file' | 'image' | 'link';
  name: string;
  url: string;
  size?: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientIds: string[];
  ccIds?: string[];
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments: MessageAttachment[];
  folder: 'inbox' | 'sent' | 'trash';
  groupTag?: string;
}

// Shift & Operational Coverage Types
export interface ShiftAssignment {
  id: string;
  doctorId: string;
  doctorName: string;
  institutionId: string;
  institutionName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  group: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Conflict';
  notes?: string;
}

// Procedure Instructions Repository Types
export interface ProcedureInstructions {
  id: string;
  procedureType: string;
  clinicalCenter?: string;     // Centro clínico específico (opcional = aplica a todos)
  modality?: ProcedureModality;
  fullInstructions: string;    // Extended version for Email
  shortInstructions: string;   // Short version for WhatsApp (~280 chars)
  anticoagulantWarning: boolean;
  fastingHours?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== WORKHUB TYPES ====================

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;           // ISO datetime
  endDate: string;             // ISO datetime
  allDay: boolean;
  location?: string;
  creatorId: string;
  participantIds: string[];    // Staff invited
  visibility: 'private' | 'team' | 'public';
  color?: string;              // Event color coding
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  calendarId: string;          // Which calendar it belongs to
  createdAt: string;
  updatedAt: string;
}

// Shared Calendar with permissions
export interface SharedCalendar {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  color: string;
  members: CalendarMember[];
  isDefault?: boolean;         // User's personal calendar
  createdAt: string;
}

export interface CalendarMember {
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  addedAt: string;
}

// Chat Channel (Group or 1:1)
export interface ChatChannel {
  id: string;
  name: string;                // Channel name or empty for 1:1
  type: 'direct' | 'group';
  memberIds: string[];
  creatorId: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
}

// Chat Message
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];            // UserIds who have read this message
  attachments?: ChatAttachment[];
  replyToId?: string;          // For threaded replies
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
}
