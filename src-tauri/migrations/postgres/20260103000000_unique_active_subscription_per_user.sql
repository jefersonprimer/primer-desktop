CREATE UNIQUE INDEX unique_active_subscription_per_user
ON public.subscriptions (user_id)
WHERE status IN ('active', 'trialing', 'past_due');

