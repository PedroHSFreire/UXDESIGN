"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2, Pill } from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { appointmentService, type Appointment } from "../../lib/service/appointmentService";
import { MedicationPlanCard } from "../../../components/MedicationPlanCard";

export default function MedicamentosPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push("/pacient/login");
      return;
    }
    let mounted = true;
    appointmentService.getPatientAppointments(user.id)
      .then((result) => { if (mounted) setAppointments(result); })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : "Não foi possível carregar as prescrições."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [authLoading, isAuthenticated, router, user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-blue-50"><Loader2 className="h-8 w-8 animate-spin text-blue-700" aria-label="Carregando" /></div>;
  }
  if (!isAuthenticated || !user) return null;

  const plans = appointments.filter((appointment) => appointment.prescription_details?.length);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <button type="button" onClick={() => router.push("/pacient/dashboard")} className="mb-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</button>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl"><Pill className="h-7 w-7 text-teal-700" /> Medicamentos</h1>
            <p className="mt-1 text-sm text-gray-600">Prescrições registradas pelo seu médico e confirmações de dose.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {plans.length === 0 ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <Pill className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Nenhuma prescrição disponível</h2>
            <p className="mt-1 text-sm text-gray-600">Quando o médico registrar medicamentos em uma consulta, eles aparecerão aqui.</p>
          </section>
        ) : plans.map((appointment) => (
          <section key={appointment.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div><h2 className="font-semibold text-gray-900">Dr(a). {appointment.doctor_name}</h2><p className="text-sm text-gray-600">{appointment.specialty}</p></div>
              <p className="inline-flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-4 w-4" /> Atendimento em {new Date(appointment.date_time).toLocaleDateString("pt-BR")}</p>
            </div>
            <MedicationPlanCard appointmentId={appointment.id} medicines={appointment.prescription_details ?? []} />
            {appointment.doctor_notes && <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700"><strong>Orientações do médico:</strong> {appointment.doctor_notes}</p>}
          </section>
        ))}
        <p className="px-1 text-xs text-gray-500">As notificações do navegador dependem da sua permissão e aparecem enquanto o MedGuide estiver aberto. Em caso de dúvidas sobre a prescrição, fale com o profissional que a registrou.</p>
      </main>
    </div>
  );
}
