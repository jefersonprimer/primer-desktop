ALTER TABLE public.subscriptions
ADD CONSTRAINT unique_stripe_customer UNIQUE (stripe_customer_id);

