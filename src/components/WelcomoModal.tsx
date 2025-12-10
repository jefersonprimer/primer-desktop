import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeModal: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
      <div className="bg-neutral-900 text-white w-[420px] p-8 rounded-xl shadow-xl border border-neutral-800">
        <div className="w-20 h-20 rounded-xl border border-neutral-700 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold">P</span>
        </div>

        <h1 className="text-2xl text-center font-semibold mb-2">
          Welcome to Perssua
        </h1>

        <p className="text-center text-neutral-400 mb-8 leading-relaxed">
          Your realtime assistant during meetings, classes, podcasts,
          interviews, and online activities
        </p>

        <div className="flex gap-4 mb-6">
          <button className="flex-1 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition">
            🇺🇸 English
          </button>

          <button className="flex-1 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition">
            🇧🇷 Português (Brasil)
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition"
        >
          Login or Create Account
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;

