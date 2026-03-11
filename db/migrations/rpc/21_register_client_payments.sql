-- ============================================================
-- MIGRATION: register_client_payments
-- File: 21_register_client_payments.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `clients` table migrated its primary key from bigint to uuid. This
-- function registers direct client payments (not tied to a specific order)
-- and updates the client's credit balance via apply_client_credit_adjustment.
-- The p_client_id parameter must be updated to uuid to match the new PK type.
-- The terminal_session_id in the payments insert was already uuid (auth user),
-- so that field required no change.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_client_id: bigint → uuid  (reason: clients PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   register_client_payments(p_client_id bigint, p_payments jsonb) RETURNS void
--
-- NEW SIGNATURE:
--   register_client_payments(p_client_id uuid, p_payments jsonb) RETURNS void
--
-- EXECUTION ORDER: Level 3 — Main function, calls apply_client_credit_adjustment (04)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.register_client_payments(bigint, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.register_client_payments(p_client_id uuid, p_payments jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_payment     jsonb;
  v_new_balance numeric;
begin
  -- Validación básica
  if p_client_id is null then
    raise exception 'p_client_id cannot be null';
  end if;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop
    ------------------------------------------------------------------
    -- 1. Registrar el pago
    ------------------------------------------------------------------
    insert into payments(
      client_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type,
      terminal_session_id
    )
    values (
      p_client_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type,
      (v_payment->>'terminal_session_id')::uuid

    );

    ------------------------------------------------------------------
    -- ON_CREDIT → aumenta deuda
    ------------------------------------------------------------------
    if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'NEGATIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Consumo a crédito',
        'PAYMENT',
        now(),
        'ON_CREDIT',
        'PENDING',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- OVERPAYMENT → saldo a favor
    ------------------------------------------------------------------
    elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

      v_new_balance := apply_client_credit_adjustment(
        p_client_id,
        abs((v_payment->>'amount')::numeric),
        'POSITIVE'
      );

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      values (
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Saldo a favor',
        'PAYMENT',
        now(),
        'OVERPAYMENT',
        'PAID',
        v_new_balance,
        now()
      );

    ------------------------------------------------------------------
    -- Pagos normales (CASH / CARD / etc.)
    ------------------------------------------------------------------
    else

      insert into client_transactions(
        client_id,
        order_id,
        amount,
        description,
        transaction_type,
        transaction_date,
        payment_method,
        payment_status,
        balance_after_transaction,
        created_at
      )
      select
        p_client_id,
        null,
        abs((v_payment->>'amount')::numeric),
        'Pago',
        'PAYMENT',
        now(),
        (v_payment->>'payment_method')::payment_method,
        'PAID',
        current_balance,
        now()
      from clients
      where client_id = p_client_id;

    end if;
  end loop;
end;
$$;
