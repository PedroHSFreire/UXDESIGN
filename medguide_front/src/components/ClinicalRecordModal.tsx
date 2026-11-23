"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import type { PrescriptionMedication } from "../app/lib/service/appointmentService";

export interface ClinicalRecordFields {
  diagnosis?: string | null;
  prescription?: string | null;
  doctor_notes?: string | null;
  prescription_details?: PrescriptionMedication[];
}

interface ClinicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  initialValues?: ClinicalRecordFields;
  onSave: (data: ClinicalRecordFields) => Promise<void>;
}

interface FormData {
  diagnosis: string;
  prescription: string;
  doctor_notes: string;
  prescription_details: PrescriptionMedication[];
}

const INITIAL_FORM_DATA: FormData = {
  diagnosis: "",
  prescription: "",
  doctor_notes: "",
  prescription_details: [],
};

export default function ClinicalRecordModal({
  isOpen,
  onClose,
  patientName,
  initialValues,
  onSave,
}: ClinicalRecordModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(() => {
        setFormData({
          diagnosis: initialValues?.diagnosis ?? "",
          prescription: initialValues?.prescription ?? "",
          doctor_notes: initialValues?.doctor_notes ?? "",
          prescription_details: initialValues?.prescription_details ?? [],
        });
        setError(null);
        setSuccess(false);
        setLoading(false);
      }, 0);
      prevIsOpenRef.current = isOpen;
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialValues]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, loading]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSave({
        diagnosis: formData.diagnosis.trim() || null,
        prescription: formData.prescription.trim() || null,
        doctor_notes: formData.doctor_notes.trim() || null,
        prescription_details: formData.prescription_details,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar histórico do atendimento"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasExistingRecord = Boolean(
    initialValues?.diagnosis ||
      initialValues?.prescription ||
      initialValues?.doctor_notes
      || initialValues?.prescription_details?.length
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-0 z-[60] sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[94dvh] sm:max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="bg-linear-to-r from-blue-600 to-teal-500 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">
                {hasExistingRecord
                  ? "Editar atendimento"
                  : "Registrar atendimento"}
              </h2>
              <p className="text-blue-100 mt-1">
                Diagnóstico, prescrição e observações
              </p>
              {patientName && (
                <p className="text-blue-50 text-sm mt-2">
                  Paciente: {patientName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
              disabled={loading}
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  Atendimento salvo com sucesso!
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Erro ao salvar</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="w-4 h-4 inline mr-1" />
              Diagnóstico
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              placeholder="Descreva o diagnóstico..."
              rows={3}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClipboardList className="w-4 h-4 inline mr-1" />
              Orientações da prescrição
            </label>
            <textarea
              value={formData.prescription}
              onChange={(e) =>
                setFormData({ ...formData, prescription: e.target.value })
              }
              placeholder="Orientações adicionais da consulta..."
              rows={3}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3" aria-labelledby="prescription-list-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 id="prescription-list-title" className="font-semibold text-gray-900">Medicamentos e lembretes</h3>
                <p className="text-xs text-gray-600">O paciente verá os horários e poderá confirmar cada dose.</p>
              </div>
              <button type="button" disabled={loading || success} onClick={() => setFormData((prev) => ({
                ...prev,
                prescription_details: [...prev.prescription_details, {
                  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `med-${Date.now()}`,
                  name: "", dosage: "", times: ["08:00"], duration_days: 7,
                  start_date: new Date().toLocaleDateString("en-CA"),
                }],
              }))} className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
            {formData.prescription_details.map((medicine, index) => (
              <div key={medicine.id} className="rounded-lg border border-blue-100 bg-white p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">Nome do medicamento
                    <input required maxLength={120} value={medicine.name} onChange={(e) => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, name: e.target.value } : item) }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Ex.: medicamento" />
                  </label>
                  <label className="text-sm text-gray-700">Dosagem
                    <input required maxLength={120} value={medicine.dosage} onChange={(e) => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, dosage: e.target.value } : item) }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder="Ex.: 1 comprimido" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm text-gray-700">Início
                    <input type="date" required value={medicine.start_date} onChange={(e) => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, start_date: e.target.value } : item) }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
                  </label>
                  <label className="text-sm text-gray-700">Duração (dias)
                    <input type="number" min={1} max={365} required value={medicine.duration_days} onChange={(e) => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, duration_days: Number(e.target.value) } : item) }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-1 text-sm text-gray-700"><Clock className="h-4 w-4" /> Horários diários</p>
                  <div className="flex flex-wrap gap-2">
                    {medicine.times.map((time, timeIndex) => <div key={`${medicine.id}-${timeIndex}`} className="flex items-center gap-1">
                      <input type="time" required value={time} onChange={(e) => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, times: item.times.map((value, j) => j === timeIndex ? e.target.value : value) } : item) }))} className="rounded-lg border border-gray-300 px-2 py-2 text-gray-900" />
                      {medicine.times.length > 1 && <button type="button" aria-label="Remover horário" onClick={() => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, times: item.times.filter((_, j) => j !== timeIndex) } : item) }))} className="p-2 text-red-700"><Trash2 className="h-4 w-4" /></button>}
                    </div>)}
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.map((item, i) => i === index ? { ...item, times: [...item.times, "12:00"] } : item) }))} className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700">+ Horário</button>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, prescription_details: prev.prescription_details.filter((_, i) => i !== index) }))} className="text-sm text-red-700 hover:underline">Remover medicamento</button>
              </div>
            ))}
          </section>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Observações
            </label>
            <textarea
              value={formData.doctor_notes}
              onChange={(e) =>
                setFormData({ ...formData, doctor_notes: e.target.value })
              }
              placeholder="Observações clínicas adicionais..."
              rows={3}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 text-black bg-gray-300 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvo!
                </div>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
