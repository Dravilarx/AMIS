
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
  | 'indicators';

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
