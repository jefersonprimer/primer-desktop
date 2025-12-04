import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface RegisterResponse {
  message: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validation
      if (!email || !senha || !confirmar) {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
        return;
      }

      if (!email.includes("@")) {
        setError("Por favor, insira um endereço de email válido");
        setLoading(false);
        return;
      }

      if (senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (senha !== confirmar) {
        setError("As senhas não coincidem");
        setLoading(false);
        return;
      }

      const response = await invoke<RegisterResponse>("register", {
        dto: {
          email,
          password: senha,
        },
      });

      setSuccess(response.message || "Conta criada com sucesso!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center relative">
      
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent)]"></div>

      {/* Card */}
      <div className="relative bg-black/90 border border-neutral-800 p-10 rounded-2xl shadow-2xl w-[420px]">

        {/* MacOS red dot */}
        <div className="absolute top-3 left-3 w-3 h-3 bg-red-500 rounded-full"></div>

        {/* Logo */}
        <h1 className="text-center text-3xl font-light mb-8">
          perssua
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label className="text-sm mb-1 block">Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg mb-4 focus:outline-none focus:border-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          {/* Senha */}
          <label className="text-sm mb-1 block">Senha</label>
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg mb-4 focus:outline-none focus:border-white"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loading}
          />

          {/* Confirmar senha */}
          <label className="text-sm mb-1 block">Confirmar Senha</label>
          <input
            type="password"
            placeholder="Confirmar Senha"
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg mb-4 focus:outline-none focus:border-white"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Botão criar conta */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        {/* Link login */}
        <div className="text-center text-sm text-neutral-400 mb-4">
          Já tem uma conta?{" "}
          <Link to="/login" className="text-white hover:underline">
            Entrar
          </Link>
        </div>

        {/* Termos */}
        <p className="text-xs text-center text-neutral-500">
          Ao continuar, você concorda com nossos<br />
          <a href="#" className="underline">Termos de Serviço</a> e{" "}
          <a href="#" className="underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}

