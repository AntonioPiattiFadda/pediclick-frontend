-- ============================================================
-- MIGRATION: apply_client_credit_adjustment
-- File: 04_apply_client_credit_adjustment.sql
-- ============================================================
--
-- WHY THIS CHANGE:
-- The `clients` table migrated its primary key from bigint to uuid as part of
-- the offline-first sync initiative. This function adjusts a client's available
-- credit and current balance (POSITIVE = add credit, NEGATIVE = consume credit)
-- and must accept the new uuid client ID. A FOR UPDATE lock on the client row
-- prevents concurrent adjustments from racing each other.
--
-- WHAT CHANGED (vs current schema.sql):
--   - [UUID] p_client_id: bigint → uuid  (reason: clients PK migrated)
--   - [SECURITY] SECURITY DEFINER + SET search_path TO 'public' already present
--
-- OLD SIGNATURE:
--   apply_client_credit_adjustment(p_client_id bigint, p_amount numeric,
--     p_credit_direction text) RETURNS numeric
--
-- NEW SIGNATURE:
--   apply_client_credit_adjustment(p_client_id uuid, p_amount numeric,
--     p_credit_direction text) RETURNS numeric
--
-- EXECUTION ORDER: Level 1 — Base auxiliary, no dependencies on other RPCs
-- ============================================================

-- 1. Drop old signature
DROP FUNCTION IF EXISTS public.apply_client_credit_adjustment(bigint, numeric, text);

-- 2. Create updated function
CREATE OR REPLACE FUNCTION public.apply_client_credit_adjustment(p_client_id uuid, p_amount numeric, p_credit_direction text) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_available_credit numeric;
  v_new_balance numeric;
begin
  -- 1. Validaciones básicas
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than 0';
  end if;

  if p_credit_direction not in ('POSITIVE', 'NEGATIVE') then
    raise exception 'Invalid credit_direction: %', p_credit_direction;
  end if;

  -- 2. Lockear cliente y obtener crédito disponible
  select available_credit
  into v_available_credit
  from clients
  where client_id = p_client_id
  for update;

  if not found then
    raise exception 'Client not found (id=%)', p_client_id;
  end if;

  -- 3. Validar crédito suficiente si es NEGATIVE
  if p_credit_direction = 'NEGATIVE'
     and v_available_credit < p_amount then
    raise exception
      'Insufficient available credit. Available: %, Required: %',
      v_available_credit,
      p_amount;
  end if;

  -- 4. Aplicar ajuste
  update clients
  set
    current_balance =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(current_balance,0) + p_amount
        else
          coalesce(current_balance,0) - p_amount
      end,
    available_credit =
      case
        when p_credit_direction = 'POSITIVE'
          then coalesce(available_credit,0) + p_amount
        else
          available_credit - p_amount
      end,
    last_transaction_date = now()
  where client_id = p_client_id
  returning current_balance into v_new_balance;

  -- 5. Retornar nuevo balance
  return v_new_balance;
end;
$$;
