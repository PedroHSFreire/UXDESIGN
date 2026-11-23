import {
  Appointment,
  CreateAppointmentDTO,
  MedicationDoseLog,
} from "../types/index.js";
import { runQuery, getQuery, allQuery } from "../database/connection.js";
import { v4 as uuidv4 } from "uuid";
export class AppointmentModel {
  static async create(appointment: CreateAppointmentDTO): Promise<string> {
    const id = uuidv4();
    const sql = `
      INSERT INTO Appointment (
        id, date_time, status, type, symptoms, diagnosis,
        prescription, doctor_notes, specialty, doctor_id,
        doctor_name, pacient_id, prescription_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runQuery(sql, [
      id,
      appointment.date_time,
      appointment.status,
      appointment.type,
      appointment.symptoms,
      appointment.diagnosis || null,
      appointment.prescription || null,
      appointment.doctor_notes || null,
      appointment.specialty,
      appointment.doctor_id,
      appointment.doctor_name,
      appointment.pacient_id,
      JSON.stringify(appointment.prescription_details ?? []),
    ]);
    return id;
  }

  static async findById(id: string): Promise<Appointment | undefined> {
    const sql = `SELECT * FROM Appointment WHERE id = ?`;
    const row = await getQuery<
      Appointment & { prescription_details?: string }
    >(sql, [id]);
    return row ? this.deserialize(row) : undefined;
  }

  static async findByPacientId(pacient_id: string): Promise<Appointment[]> {
    const sql = `SELECT * FROM Appointment WHERE pacient_id = ? ORDER BY date_time DESC`;
    const rows = await allQuery<
      Appointment & { prescription_details?: string }
    >(sql, [pacient_id]);
    return rows.map((row) => this.deserialize(row));
  }

  static async findByDoctorId(doctor_id: string): Promise<Appointment[]> {
    const sql = `SELECT Appointment.*, Pacient.name AS patient_name, Pacient.email AS patient_email
      FROM Appointment LEFT JOIN Pacient ON Pacient.id = Appointment.pacient_id
      WHERE Appointment.doctor_id = ? ORDER BY Appointment.date_time DESC`;
    const rows = await allQuery<
      Appointment & { prescription_details?: string }
    >(sql, [doctor_id]);
    return rows.map((row) => this.deserialize(row));
  }

  static async update(
    id: string,
    appointment: Partial<Omit<Appointment, "id" | "created">>
  ): Promise<boolean> {
    const allowedFields = [
      "status",
      "diagnosis",
      "prescription",
      "doctor_notes",
      "prescription_details",
    ] as const;
    const entries = Object.entries(appointment).filter(([key]) =>
      allowedFields.includes(key as (typeof allowedFields)[number])
    );
    if (!entries.length) return false;
    const fields = entries
      .map(([key]) => `${key} = ?`)
      .join(", ");
    const values = entries.map(([key, value]) =>
      key === "prescription_details" ? JSON.stringify(value ?? []) : value
    );
    const sql = `UPDATE Appointment SET ${fields} WHERE id = ?`;
    await runQuery(sql, [...values, id]);
    return true;
  }

  static async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM Appointment WHERE id = ?`;
    await runQuery(sql, [id]);
    return true;
  }

  private static deserialize(row: Appointment & { prescription_details?: string | unknown }): Appointment {
    const raw = row.prescription_details;
    let prescription_details = row.prescription_details as Appointment["prescription_details"];
    if (typeof raw === "string") {
      try { prescription_details = JSON.parse(raw); } catch { prescription_details = []; }
    }
    return { ...row, prescription_details: prescription_details ?? [] };
  }

  static async listDoseLogs(appointmentId: string): Promise<MedicationDoseLog[]> {
    const rows = await allQuery<Omit<MedicationDoseLog, "taken"> & { taken: number }>(
      "SELECT * FROM MedicationDoseLog WHERE appointment_id = ? ORDER BY scheduled_at DESC",
      [appointmentId]
    );
    return rows.map((row) => ({ ...row, taken: Boolean(row.taken) }));
  }

  static async recordDose(
    appointmentId: string,
    medicationId: string,
    scheduledAt: string,
    taken: boolean
  ): Promise<void> {
    await runQuery(
      `INSERT INTO MedicationDoseLog (id, appointment_id, medication_id, scheduled_at, taken)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(appointment_id, medication_id, scheduled_at) DO UPDATE SET taken = excluded.taken, recorded_at = CURRENT_TIMESTAMP`,
      [uuidv4(), appointmentId, medicationId, scheduledAt, taken ? 1 : 0]
    );
  }
}
