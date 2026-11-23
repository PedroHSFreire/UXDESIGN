"use client";

import { useEffect, useMemo, useState } from "react";
import { appointmentService, type MedicationDoseLog, type PrescriptionMedication } from "../app/lib/service/appointmentService";

export function MedicationPlanCard({ appointmentId, medicines }: { appointmentId: string; medicines: PrescriptionMedication[] }) {
  const [logs, setLogs] = useState<MedicationDoseLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [clock, setClock] = useState(() => Date.now());
  const today = useMemo(() => localDateString(new Date(clock)), [clock]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    appointmentService.getMedicationDoseLogs(appointmentId)
      .then((result) => { if (mounted) setLogs(result); })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : "Falha ao carregar confirmações."); });
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    return () => { mounted = false; };
  }, [appointmentId]);

  useEffect(() => {
    if (permission !== "granted") return;
    const checkSchedule = () => {
      const now = new Date();
      if (localDateString(now) !== today) return;
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      medicines.forEach((medicine) => {
        if (!isActiveToday(medicine, today) || !medicine.times.includes(time)) return;
        const scheduledAt = `${today}T${time}`;
        if (logs.some((log) => log.medication_id === medicine.id && log.scheduled_at === scheduledAt)) return;
        const noticeKey = `medguide-reminder:${appointmentId}:${medicine.id}:${scheduledAt}`;
        if (localStorage.getItem(noticeKey)) return;
        new Notification(`Hora de ${medicine.name}`, { body: `${medicine.dosage} · abra o MedGuide para confirmar a dose.` });
        localStorage.setItem(noticeKey, "sent");
      });
    };
    checkSchedule();
    const timer = window.setInterval(checkSchedule, 15000);
    return () => window.clearInterval(timer);
  }, [appointmentId, logs, medicines, permission, today]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(await Notification.requestPermission());
  };

  const confirmDose = async (medicine: PrescriptionMedication, time: string, taken: boolean) => {
    const scheduledAt = `${today}T${time}`;
    const key = `${medicine.id}:${scheduledAt}`;
    setSavingKey(key);
    setError(null);
    try {
      setLogs(await appointmentService.recordMedicationDose(appointmentId, medicine.id, scheduledAt, taken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a confirmação.");
    } finally { setSavingKey(null); }
  };

  return (
    <section className="mt-4 rounded-xl border border-teal-100 bg-teal-50/70 p-4" aria-label="Plano de medicamentos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h5 className="font-semibold text-gray-900">Medicamentos recomendados</h5>
          <p className="text-xs text-gray-600">Os avisos aparecem enquanto esta página estiver aberta.</p>
        </div>
        {permission !== "granted" && <button type="button" onClick={() => void requestPermission()} className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100">Ativar notificações</button>}
      </div>
      <div className="mt-3 space-y-3">
        {medicines.map((medicine) => {
          const activeToday = isActiveToday(medicine, today);
          return <div key={medicine.id} className="rounded-lg border border-teal-100 bg-white p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="font-semibold text-gray-900">{medicine.name}</p><p className="text-sm text-gray-600">{medicine.dosage} · {medicine.duration_days} dias</p></div>
              <p className="text-xs text-gray-500">{activeToday ? `Horários: ${medicine.times.join(" · ")}` : "Fora do período prescrito"}</p>
            </div>
            {activeToday && <div className="mt-3 space-y-2">
              {medicine.times.map((time) => {
                const scheduledAt = `${today}T${time}`;
                const log = logs.find((item) => item.medication_id === medicine.id && item.scheduled_at === scheduledAt);
                const due = time <= currentLocalTime(new Date(clock));
                return <div key={scheduledAt} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-800">{time} {log ? (log.taken ? "· Dose tomada" : "· Dose não tomada") : due ? "· Aguardando confirmação" : "· Lembrete programado"}</span>
                  {!log && due && <div className="flex gap-2"><button type="button" disabled={savingKey === `${medicine.id}:${scheduledAt}`} onClick={() => void confirmDose(medicine, time, true)} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Tomei</button><button type="button" disabled={savingKey === `${medicine.id}:${scheduledAt}`} onClick={() => void confirmDose(medicine, time, false)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50">Não tomei</button></div>}
                </div>;
              })}
            </div>}
          </div>;
        })}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {permission === "unsupported" && <p className="mt-2 text-xs text-amber-800">Este navegador não oferece notificações.</p>}
    </section>
  );
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentLocalTime(now: Date) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function isActiveToday(medicine: PrescriptionMedication, today: string) {
  const start = new Date(`${medicine.start_date}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const elapsedDays = Math.floor((current.getTime() - start.getTime()) / 86400000);
  return elapsedDays >= 0 && elapsedDays < medicine.duration_days;
}
