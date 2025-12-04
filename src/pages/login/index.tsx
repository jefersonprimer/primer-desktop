import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";

interface LoginResponse {
  token: string;
  user_id: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !senha) {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
        return;
      }

      const response = await invoke<LoginResponse>("login", {
        dto: {
          email,
          password: senha,
        },
      });

      // Use AuthContext to handle login
      login(response.token, response.user_id, email);

      // Redirect to home page
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="bg-neutral-900 p-8 rounded-xl shadow-xl w-[380px]">
        
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit}>
          <label className="text-sm mb-1 block">Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg mb-4 focus:outline-none focus:border-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label className="text-sm mb-1 block">Senha</label>
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg mb-4 focus:outline-none focus:border-white"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-neutral-400">
          <Link to="/forgot-password" className="hover:text-white underline">
            Esqueceu a senha?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-neutral-400">
          Não tem uma conta?{" "}
          <Link to="/register" className="text-white hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}