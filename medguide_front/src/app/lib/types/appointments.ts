// app/lib/types/appointments.ts
export interface Appointment {
  id: string;
  doctor_id: string;
  pacient_id: string;
  date_time: string;
  type: string;
  symptoms: string;
  status: "agendada" | "confirmada" | "cancelada" | "realizada" | "remarcada";
  doctor_name: string;
  specialty: string;
  diagnosis?: string;
  prescription?: string;
  doctor_notes?: string;
  prescription_details?: PrescriptionMedication[];
  created?: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  duration_days: number;
  start_date: string;
}

export interface MedicationDoseLog {
  id: string;
  appointment_id: string;
  medication_id: string;
  scheduled_at: string;
  taken: boolean;
  recorded_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CreateAppointmentRequest {
  doctor_id: string;
  pacient_id: string;
  date_time: string;
  type: string;
  symptoms: string;
  specialty: string;
  doctor_name: string;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  availableSlots: TimeSlot[];
}
