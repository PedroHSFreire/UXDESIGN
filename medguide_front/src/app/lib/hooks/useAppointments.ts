/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  useState,
  useCallback,
} from "react";
import {
  appointmentService,
  CreateAppointmentData,
} from "../service/appointmentService";

export const useAppointment =
  () => {
    const [
      loading,
      setLoading,
    ] =
      useState(
        false,
      );
    const [
      error,
      setError,
    ] =
      useState<
        | string
        | null
      >(
        null,
      );
    const [
      success,
      setSuccess,
    ] =
      useState(
        false,
      );

    const bookAppointment =
      async (
        appointmentData: CreateAppointmentData,
      ) => {
        try {
          setLoading(
            true,
          );
          setError(
            null,
          );
          setSuccess(
            false,
          );

          console.log(
            "🔍 Validando dados antes do agendamento:",
            appointmentData,
          );

          // 🔥 VALIDAÇÃO CLIENT-SIDE
          if (
            !appointmentData.doctor_id
          ) {
            throw new Error(
              "ID do médico é obrigatório",
            );
          }
          if (
            !appointmentData.pacient_id
          ) {
            throw new Error(
              "ID do paciente é obrigatório",
            );
          }
          if (
            !appointmentData.date_time
          ) {
            throw new Error(
              "Data e hora são obrigatórios",
            );
          }
          if (
            !appointmentData.symptoms
          ) {
            throw new Error(
              "Descrição dos sintomas é obrigatória",
            );
          }

          const result =
            await appointmentService.createAppointment(
              appointmentData,
            );

          setSuccess(
            true,
          );
          console.log(
            "✅ Consulta agendada com sucesso:",
            result,
          );

          return result;
        } catch (err: any) {
          console.error(
            "❌ Erro detalhado no agendamento:",
            {
              message:
                err.message,
              data: appointmentData,
              stack:
                err.stack,
            },
          );

          let errorMessage =
            err.message ||
            "Erro ao agendar consulta";

          //  TRATAMENTO DE ERROS ESPECÍFICOS
          if (
            err.message.includes(
              "restrição",
            )
          ) {
            errorMessage =
              "Dados inválidos para o agendamento. Verifique as informações.";
          } else if (
            err.message.includes(
              "chave estrangeira",
            )
          ) {
            errorMessage =
              "Médico ou paciente não encontrado.";
          } else if (
            err.message.includes(
              "duplicada",
            )
          ) {
            errorMessage =
              "Já existe um agendamento para este horário.";
          }

          setError(
            errorMessage,
          );
          throw err;
        } finally {
          setLoading(
            false,
          );
        }
      };

    const resetState =
      useCallback(() => {
        setError(
          null,
        );
        setSuccess(
          false,
        );
        setLoading(
          false,
        );
      }, []);

    return {
      bookAppointment,
      loading,
      error,
      success,
      resetState,
    };
  };
