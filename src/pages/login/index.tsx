import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
      <div className="bg-neutral-900 p-8 rounded-xl shadow-xl w-[380px] text-center">
        
        <h1 className="text-2xl font-semibold mb-2">Welcome to Primer</h1>
        <p className="text-neutral-400 mb-8 text-sm">
          Sign in or create an account to continue
        </p>

        <button
          onClick={() => login()}
          className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition flex items-center justify-center gap-2"
        >
          Continue with Browser
        </button>

      </div>
    </div>
  );
}
