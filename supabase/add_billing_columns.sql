-- Run SELECT plan, COUNT(*) FROM profiles GROUP BY plan; FIRST.
-- Every existing value must appear in the CHECK list below.

-- ── Fix plan CHECK constraint ──────────────────────────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'solo', 'starter', 'professional', 'pro', 'agency'));

-- ── Add billing columns (all IF NOT EXISTS — safe to re-run) ───────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_customer_id     text,        -- provider customer email (Flutterwave)
  ADD COLUMN IF NOT EXISTS payment_subscription_id text,        -- provider subscription ID
  ADD COLUMN IF NOT EXISTS subscription_status     text
    NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'cancelled', 'past_due')),
  ADD COLUMN IF NOT EXISTS billing_period          text
    CHECK (billing_period IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS subscription_start      timestamptz,
  ADD COLUMN IF NOT EXISTS next_renewal_at         timestamptz;

-- ── Transactions table ─────────────────────────────────────────────────────
-- reference UNIQUE is the idempotency key — duplicate webhook deliveries are no-ops.
-- amount is numeric(10,2) to store exact USD values (e.g. 29.00, 119.00).
CREATE TABLE IF NOT EXISTS public.transactions (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference  text           NOT NULL UNIQUE,
  amount     numeric(10,2)  NOT NULL,
  plan       text           NOT NULL,
  period     text           CHECK (period IN ('monthly', 'annual')),
  status     text           NOT NULL DEFAULT 'pending',
  provider   text           NOT NULL DEFAULT 'flutterwave',
  created_at timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
