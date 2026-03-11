-- ============================================================
-- MIGRATION: register_order_payments
-- File: 19_register_order_payments.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `orders`, `clients`, and `terminal_sessions` tables all migrated their
-- primary keys from bigint to uuid. This function processes payments for a
-- given order and handles credit/debit adjustments for the associated client.
-- The p_order_id parameter and internal variables v_client_id and
-- v_terminal_session_id must be updated to uuid.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_order_id: bigint → uuid  (reason: orders PK migrated)
--   - [UUID] v_client_id: bigint → uuid  (reason: clients PK migrated)
--   - [UUID] v_terminal_session_id: bigint → uuid  (reason: terminal_sessions PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   register_order_payments(p_order_id bigint, p_payments jsonb) RETURNS void
--
-- NEW SIGNATURE:
--   register_order_payments(p_order_id uuid, p_payments jsonb) RETURNS void
--
-- EXECUTION ORDER: Level 3 — Main function, calls apply_client_credit_adjustment (04)
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.register_order_payments(bigint, jsonb);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.register_order_payments(p_order_id uuid, p_payments jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

declare
  v_payment             jsonb;
  v_client_id           uuid;
  v_terminal_session_id uuid;
  v_new_balance         numeric;
begin
  select client_id, terminal_session_id
  into v_client_id, v_terminal_session_id
  from orders
  where order_id = p_order_id;

  for v_payment in
    select * from jsonb_array_elements(p_payments)
  loop

    insert into payments(
      order_id,
      terminal_session_id,
      payment_method,
      amount,
      created_at,
      payment_direction,
      payment_type
    )
    values (
      p_order_id,
      v_terminal_session_id,
      (v_payment->>'payment_method')::payment_method,
      abs((v_payment->>'amount')::numeric),
      now(),
      (v_payment->>'payment_direction')::payment_direction,
      (v_payment->>'payment_type')::payment_type
    );
    if v_client_id is not null then

      ------------------------------------------------------------------
      -- ON_CREDIT → aumenta deuda
      ------------------------------------------------------------------
     if (v_payment->>'payment_method')::payment_method = 'ON_CREDIT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
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
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Consumo a crédito - orden #', p_order_id),
    'PAYMENT',
    now(),
    'ON_CREDIT',
    'PENDING',
    v_new_balance,
    now()
  );

      ------------------------------------------------------------------
      -- OVERPAYMENT → reduce deuda / saldo a favor
      ------------------------------------------------------------------
     elsif (v_payment->>'payment_method')::payment_method = 'OVERPAYMENT' then

  v_new_balance := apply_client_credit_adjustment(
    v_client_id,
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
    v_client_id,
    p_order_id,
    abs((v_payment->>'amount')::numeric),
    concat('Saldo a favor - orden #', p_order_id),
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
          v_client_id,
          p_order_id,
          abs((v_payment->>'amount')::numeric),
          concat('Pago de orden #', p_order_id),
          'PAYMENT',
          now(),
          (v_payment->>'payment_method')::payment_method,
          'PAID',
          current_balance,
          now()
        from clients
        where client_id = v_client_id;

      end if;
    end if;
  end loop;
end;
$$;
