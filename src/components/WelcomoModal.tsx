import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Draggable from "react-draggable";

const WelcomeModal: React.FC = () => {
  const navigate = useNavigate();
  const nodeRef = useRef(null);

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
      <Draggable nodeRef={nodeRef} handle=".drag-handle">
        <div ref={nodeRef} className="bg-neutral-900 text-white w-[420px] p-8 rounded-xl shadow-xl border border-neutral-800">
          
          {/* Icon (Handle) */}
          <div className="drag-handle flex justify-center mb-6 cursor-move">
            <div className="w-20 h-20 rounded-xl border border-neutral-700 flex items-center justify-center pointer-events-none">
              {/* Coloque sua logo real aqui */}
              <span className="text-3xl font-bold">P</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl text-center font-semibold mb-2">
            Welcome to Perssua
          </h1>

          {/* Subtitle */}
          <p className="text-center text-neutral-400 mb-8 leading-relaxed">
            Your realtime assistant during meetings, classes, podcasts,
            interviews, and online activities
          </p>

          {/* Language buttons */}
          <div className="flex gap-4 mb-6">
            <button className="flex-1 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition">
              🇺🇸 English
            </button>

            <button className="flex-1 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition">
              🇧🇷 Português (Brasil)
            </button>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition"
          >
            Login or Create Account
          </button>
        </div>
      </Draggable>
    </div>
  );
};

export default WelcomeModal;

