import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface ResetPasswordResponse {
  message: string;
}

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!token) {
        setError("Token de recuperação inválido");
        setLoading(false);
        return;
      }

      if (!newPassword || !confirmPassword) {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("As senhas não coincidem");
        setLoading(false);
        return;
      }

      const response = await invoke<ResetPasswordResponse>("reset_password", {
        dto: {
          token: token,
          new_password: newPassword,
        },
      });

      setSuccess(response.message || "Senha redefinida com sucesso!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha. O token pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="bg-black border border-neutral-700 shadow-2xl p-10 w-full max-w-md">
        {/* Red Circle */}
        <div className="w-3 h-3 bg-red-500 rounded-full mb-6"></div>

        {/* Logo */}
        <h1 className="text-white text-3xl font-semibold text-center mb-8">
          perssua
        </h1>

        {/* Title */}
        <h2 className="text-white text-xl font-medium mb-4">
          Redefinir Senha
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm mb-1 block">Nova Senha</label>
            <input
              type="password"
              placeholder="Nova senha"
              className="w-full bg-[#111] text-white px-3 py-2 border border-neutral-700 focus:outline-none focus:border-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-white text-sm mb-1 block">Confirmar Nova Senha</label>
            <input
              type="password"
              placeholder="Confirmar nova senha"
              className="w-full bg-[#111] text-white px-3 py-2 border border-neutral-700 focus:outline-none focus:border-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-medium py-2 hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-white/70 hover:text-white underline"
          >
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}

