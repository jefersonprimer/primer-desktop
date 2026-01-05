import { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-shell";
import CheckIcon from "@/components/ui/icons/CheckIcon";
import { useAuth } from "@/contexts/AuthContext";

export default function PremiumTab() {
  const { t } = useTranslation();
  const { isAuthenticated, login, userId } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const baseUrl = import.meta.env.PROD
    ? "https://primerai.vercel.app"
    : "http://localhost:3000";

  const plans = [
    {
      id: "plus",
      key: "premium.plans.plus",
      popular: true,
      gradient: "from-blue-600 to-blue-700",
      priceId: {
        monthly: "plus-monthly",
        yearly: "plus-yearly",
      },
    },
    {
      id: "pro",
      key: "premium.plans.pro",
      popular: false,
      gradient: "from-purple-600 to-purple-700",
      priceId: {
        monthly: "pro-monthly",
        yearly: "pro-yearly",
      },
    },
    {
      id: "free",
      key: "premium.plans.free",
      popular: false,
      gradient: "",
      priceId: null, // Free plan, no checkout
    },
  ];

  const handleSubscribe = async (priceId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (!isAuthenticated) {
        // User needs to login first, then redirect to pricing
        localStorage.setItem('pendingPriceId', priceId);
        await login();
        return;
      }

      // Redirect to website checkout with proper parameters
      const checkoutUrl = `${baseUrl}/pricing?plan=${priceId}&source=desktop&user_id=${userId}`;
      console.log("Opening checkout URL:", checkoutUrl);
      await open(checkoutUrl);
    } catch (error) {
      console.error("Subscribe error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 w-full h-full bg-white dark:bg-[#1D1D1F] text-gray-500 dark:text-neutral-400">
      <div className="mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold mb-2">{t('premium.title')}</h1>
            <p className="text-gray-400 text-sm">
              {t('premium.teams.interest')}{' '}
              <a href="#" className="text-blue-400 hover:underline">
                {t('premium.teams.link')}
              </a>
            </p>
          </div>
          
          <div className="flex items-center bg-[#1A1A1A] rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#2A2A2A] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('premium.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('premium.yearly')}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gradient-to-b ${plan.gradient} rounded-2xl p-6 flex flex-col transition-transform hover:scale-105 ${
              plan.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg text-white">
                  {t(`${plan.key}.name`)}
                </h3>
                {plan.popular && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {t('premium.popular')}
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline gap-2">
                {billingCycle === 'yearly' && plan.priceId && (
                  <span className="text-gray-300 line-through text-lg">
                    {t(`${plan.key}.originalPrice`)}
                  </span>
                )}
                <span className="text-4xl text-white">
                  {t(`${plan.key}.price.${billingCycle}`)}
                </span>
              </div>
            </div>

            <div className="relative py-4"/>
            <div className="flex-1 space-y-3 mb-6">
              <p className="text-sm font-semibold text-gray-200 mb-3">
                {t(`${plan.key}.features_prefix`)}
              </p>
              {(t(`${plan.key}.features`, { returnObjects: true }) as string[]).map(
                (feature: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-100"
                  >
                    <CheckIcon 
                      size={18} 
                      className="mt-0.5 text-white shrink-0" 
                    />
                    <span>{feature}</span>
                  </div>
                )
              )}
            </div>

            {plan.priceId ? (
              <button 
                onClick={() => handleSubscribe(plan.priceId![billingCycle])}
                disabled={isProcessing}
                className="w-fit bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-sm font-semibold transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t('common.loading') : t('premium.upgrade')}
              </button>
            ) : (
              <button 
                disabled
                className="w-fit bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-3 text-sm font-semibold text-gray-400 cursor-default"
              >
                {t('premium.currentPlan')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
