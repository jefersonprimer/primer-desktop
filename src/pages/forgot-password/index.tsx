import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!email.includes("@")) {
        setError("Por favor, insira um endereço de email válido");
        setLoading(false);
        return;
      }

      // TODO: Implement forgot_password command in backend
      // await invoke("forgot_password", { email });
      
      setSuccess("Se o email existir, você receberá um link de recuperação em breve.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email de recuperação.");
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
          Recuperar Senha
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm mb-1 block">Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full bg-[#111] text-white px-3 py-2 border border-neutral-700 focus:outline-none focus:border-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Enviando..." : "Enviar link de recuperação"}
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
