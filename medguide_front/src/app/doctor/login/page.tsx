/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function DoctorSignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // CORREÇÃO NO doctor/login/page.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      console.log("🔐 Iniciando login médico...", {
        login: formData.login,
        passwordLength: formData.password.length,
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = apiUrl?.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const endpoint = `${baseUrl}/api/doctor/login`;

      console.log("🔗 Endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: formData.login,
          password: formData.password,
        }),
      });

      const responseText = await response.text();
      console.log("📨 Resposta bruta:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta:", parseError);
        throw new Error("Resposta inválida do servidor");
      }

      console.log("📊 Resposta parseada:", data);

      if (!response.ok) {
        let errorMessage = "Erro ao fazer login";

        if (response.status === 401) {
          errorMessage = "Email/CRM ou senha incorretos";
        } else if (response.status === 400) {
          errorMessage = data.error || "Dados inválidos";
        } else if (response.status === 404) {
          errorMessage = "Médico não encontrado";
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }

        throw new Error(errorMessage);
      }

      const token = data.data?.token || data.token || data.accessToken;
      const userData = data.data?.doctor || data.data || data.user;

      if (!token) {
        throw new Error("Token não encontrado na resposta");
      }

      console.log("✅ Login bem-sucedido:", {
        token: token ? "PRESENTE" : "AUSENTE",
        userData: userData ? "PRESENTE" : "AUSENTE",
      });

      setSuccess(true);

      console.log("💾 Salvando no localStorage...");
      localStorage.setItem("token", token);
      if (userData) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...userData,
            role: "doctor",
          })
        );
      }

      try {
        console.log("🔄 Sincronizando com NextAuth...");

        const result = await signIn("credentials", {
          redirect: false,
          login: formData.login,
          password: formData.password,
        });

        if (result?.error) {
          console.warn(
            "⚠️ NextAuth signIn falhou, mas continuando com localStorage:",
            result.error
          );
        }
      } catch (authError) {
        console.warn(
          "⚠️ Erro no NextAuth, continuando com localStorage:",
          authError
        );
      }

      console.log("🎯 Redirecionando para dashboard...");

      setTimeout(() => {
        router.push("/doctor/dashboard");

        setTimeout(() => {
          if (window.location.pathname !== "/doctor/dashboard") {
            console.log("🔄 Forçando redirecionamento...");
            window.location.href = "/doctor/dashboard";
          }
        }, 2000);
      }, 1000);
    } catch (err: any) {
      console.error("❌ Erro completo no login médico:", {
        message: err.message,
        stack: err.stack,
      });

      setError(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar para Home
            </Link>
            <div className="text-lg font-semibold text-gray-900">MedGuide</div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 w-full">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Login do Médico
              </h1>
              <p className="text-gray-600">Acesse sua área de atendimento</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    Login realizado com sucesso! Redirecionando...
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/CRM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ou CRM
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="seu@email.com ou CRM"
                    disabled={isSubmitting}
                    className="w-full text-black pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Sua senha"
                    disabled={isSubmitting}
                    className="w-full text-black pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.login || !formData.password}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600 text-sm">
                É paciente?{" "}
                <Link
                  href="/pacient/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Faça login como paciente
                </Link>
              </p>
              <p className="text-center text-gray-600 text-sm mt-2">
                Não tem conta?{" "}
                <Link
                  href="/doctor/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Cadastre-se como médico
                </Link>
              </p>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">
                  🔍 API: {process.env.NEXT_PUBLIC_API_URL}/api/doctor/login
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
