import { Request, Response, NextFunction } from "express";
import { AppointmentModel } from "../models/AppointmentModel.js";
import { DoctorModel } from "../models/DoctorModels.js";
import { PacientModel } from "../models/PacientModels.js";
import { Appointment, ApiResponse, PrescriptionMedication } from "../types/index.js";

const sendError = (res: Response, status: number, error: string) =>
  res.status(status).json({ success: false, error });

async function getAuthorizedAppointment(req: Request, res: Response) {
  const appointment = await AppointmentModel.findById(String(req.params.id));
  if (!appointment) {
    sendError(res, 404, "Consulta não encontrada");
    return undefined;
  }
  const isPatient = req.user?.type === "pacient" && req.user.id === appointment.pacient_id;
  const isDoctor = req.user?.type === "doctor" && req.user.id === appointment.doctor_id;
  if (!isPatient && !isDoctor) {
    sendError(res, 403, "Você não tem acesso a esta consulta");
    return undefined;
  }
  return appointment;
}

function validatePrescription(value: unknown): value is PrescriptionMedication[] {
  return Array.isArray(value) && value.length <= 20 && value.every((item) =>
    item && typeof item.id === "string" && item.id.length <= 80 &&
    typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 120 &&
    typeof item.dosage === "string" && item.dosage.length <= 120 &&
    Array.isArray(item.times) && item.times.length > 0 && item.times.length <= 12 &&
    item.times.every((time: unknown) => typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) &&
    Number.isInteger(item.duration_days) && item.duration_days >= 1 && item.duration_days <= 365 &&
    typeof item.start_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.start_date)
  );
}

export class AppointmentController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.type !== "pacient") {
        sendError(res, 403, "Somente o paciente pode solicitar uma consulta");
        return;
      }
      const data = req.body as Appointment;
      if (data.pacient_id !== req.user.id) {
        sendError(res, 403, "O agendamento deve pertencer ao paciente autenticado");
        return;
      }
      const doctor = await DoctorModel.findById(data.doctor_id);
      if (!doctor) {
        sendError(res, 404, "Médico não encontrado");
        return;
      }
      const patient = await PacientModel.findById(data.pacient_id);
      if (!patient) {
        sendError(res, 404, "Paciente não encontrado");
        return;
      }
      const id = await AppointmentModel.create({
        date_time: data.date_time,
        status: "agendada",
        type: data.type,
        symptoms: data.symptoms,
        doctor_id: data.doctor_id,
        pacient_id: data.pacient_id,
        specialty: doctor.specialty,
        doctor_name: doctor.name,
      });
      const appointment = await AppointmentModel.findById(id);
      res.status(201).json({ success: true, data: appointment, message: "Consulta agendada com sucesso" });
    } catch (error) { next(error); }
  }

  static async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await getAuthorizedAppointment(req, res);
      if (appointment) res.json({ success: true, data: appointment });
    } catch (error) { next(error); }
  }

  static async findByPacientId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      if (req.user?.type !== "pacient" || req.user.id !== patientId) {
        sendError(res, 403, "Você só pode consultar suas próprias consultas");
        return;
      }
      const appointments = await AppointmentModel.findByPacientId(patientId);
      res.json({ success: true, data: appointments });
    } catch (error) { next(error); }
  }

  static async findByDoctorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = String(req.params.doctorId);
      if (req.user?.type !== "doctor" || req.user.id !== doctorId) {
        sendError(res, 403, "Você só pode consultar sua própria agenda");
        return;
      }
      const appointments = await AppointmentModel.findByDoctorId(doctorId);
      res.json({ success: true, data: appointments });
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const current = await getAuthorizedAppointment(req, res);
      if (!current) return;
      const body = req.body as Partial<Appointment>;
      const doctor = req.user?.type === "doctor";
      const update: Partial<Appointment> = {};
      if (doctor) {
        for (const field of ["diagnosis", "prescription", "doctor_notes"] as const) {
          if (body[field] !== undefined) {
            if (body[field] !== null && (typeof body[field] !== "string" || body[field]!.length > 5000)) {
              sendError(res, 400, `Campo ${field} inválido`);
              return;
            }
            update[field] = body[field];
          }
        }
        if (body.prescription_details !== undefined) {
          if (!validatePrescription(body.prescription_details)) {
            sendError(res, 400, "Confira os medicamentos, horários e duração informados");
            return;
          }
          update.prescription_details = body.prescription_details;
        }
      }
      if (body.status !== undefined) {
        const allowedStatuses = doctor
          ? ["agendada", "confirmada", "cancelada", "realizada", "remarcada"]
          : ["cancelada"];
        if (!allowedStatuses.includes(body.status)) {
          sendError(res, 403, "Status não permitido para este perfil");
          return;
        }
        update.status = body.status;
      }
      if (!Object.keys(update).length) {
        sendError(res, 400, "Nenhum campo permitido para atualização");
        return;
      }
      await AppointmentModel.update(current.id!, update);
      const updatedAppointment = await AppointmentModel.findById(current.id!);
      res.json({ success: true, data: updatedAppointment, message: "Consulta atualizada com sucesso" });
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await getAuthorizedAppointment(req, res);
      if (!appointment) return;
      await AppointmentModel.delete(appointment.id!);
      res.json({ success: true, message: "Consulta removida com sucesso" });
    } catch (error) { next(error); }
  }

  static async listDoseLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await getAuthorizedAppointment(req, res);
      if (!appointment) return;
      res.json({ success: true, data: await AppointmentModel.listDoseLogs(appointment.id!) });
    } catch (error) { next(error); }
  }

  static async recordDose(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await getAuthorizedAppointment(req, res);
      if (!appointment) return;
      if (req.user?.type !== "pacient") {
        sendError(res, 403, "Somente o paciente pode confirmar uma dose");
        return;
      }
      const { medication_id, scheduled_at, taken } = req.body as Record<string, unknown>;
      const medication = appointment.prescription_details?.find((item) => item.id === medication_id);
      const validDate = typeof scheduled_at === "string" && /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(scheduled_at);
      const scheduledDate = validDate ? String(scheduled_at).slice(0, 10) : "";
      const scheduledTime = validDate ? String(scheduled_at).slice(11) : "";
      const elapsedDays = medication && validDate
        ? (Date.parse(`${scheduledDate}T00:00:00Z`) - Date.parse(`${medication.start_date}T00:00:00Z`)) / 86400000
        : -1;
      if (!medication || !validDate || typeof taken !== "boolean" ||
          !Number.isInteger(elapsedDays) || elapsedDays < 0 || elapsedDays >= medication.duration_days ||
          !medication.times.includes(scheduledTime)) {
        sendError(res, 400, "Confirmação de dose inválida");
        return;
      }
      await AppointmentModel.recordDose(appointment.id!, medication.id, scheduled_at, taken);
      res.json({ success: true, data: await AppointmentModel.listDoseLogs(appointment.id!) });
    } catch (error) { next(error); }
  }
}
