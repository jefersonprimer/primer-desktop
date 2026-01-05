import { useAuth } from "../../contexts/AuthContext";

export default function WelcomePage() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Left Column - Login Form */}
      <div className="w-1/2 flex items-center justify-center text-center p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Primer</h1>
          </div>
          
          <h2 className="text-3xl font-semibold mb-3">Welcome to Primer</h2>
          <p className="text-neutral-400 mb-8 text-base">
            The ultimate agent AI.
          </p>
          
          <button
            onClick={() => login()}
            className="w-[300px] py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition flex items-center justify-center gap-2 text-center mx-auto"
          >
            Continue
          </button>
          
          <footer className="mt-8 text-sm text-neutral-500">
            <p>
              By signing up, you agree to our{" "}
              <a 
                href="https://primerai.vercel.app/policy/terms-of-use" 
                className="text-neutral-300 hover:text-white underline"
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a 
                href="https://primerai.vercel.app/policy/privacy-policy"
                className="text-neutral-300 hover:text-white underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
      
      {/* Right Column - Image and Text */}
      <div className="w-1/2 bg-neutral-900 flex flex-col items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="/primer-preview.png" 
              alt="Primer AI Assistant" 
              className="w-full h-auto"
            />
          </div>
          <h3 className="text-2xl font-semibold mb-3">
            The real Ai agent, always ready to help
          </h3>
        </div>
      </div>
    </div>
  );
}
