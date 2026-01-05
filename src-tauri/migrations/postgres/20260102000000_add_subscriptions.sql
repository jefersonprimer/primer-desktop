-- Add plan column to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
CHECK (plan IN ('free', 'plus', 'pro'));

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text NOT NULL,

  plan text NOT NULL CHECK (plan IN ('free', 'plus', 'pro')),
  status text NOT NULL CHECK (
    status IN (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete'
    )
  ),

  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);
