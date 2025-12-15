export type UserRole = 'admin' | 'staff' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  image?: string;
  staffIds: string[];
  isActive: boolean;
}

export interface Staff {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  bio?: string;
  avatar?: string;
  serviceIds: string[];
  workingHours: WorkingHours[];
  isActive: boolean;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:mm format
  endTime: string;
  isWorking: boolean;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  notes?: string;
  consultationForms: ConsultationForm[];
  treatmentHistory: TreatmentNote[];
  createdAt: Date;
}

export interface ConsultationForm {
  id: string;
  clientId: string;
  formData: Record<string, any>;
  submittedAt: Date;
}

export interface TreatmentNote {
  id: string;
  clientId: string;
  staffId: string;
  appointmentId: string;
  notes: string;
  createdAt: Date;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  price: number;
  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  preferredDate: Date;
  preferredTimeRange?: string;
  status: 'waiting' | 'notified' | 'booked' | 'expired';
  createdAt: Date;
}
