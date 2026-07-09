-- Trigger function for synchronizing balances on transaction mutations (with currency safety)
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
declare
  v_is_counter boolean;
  v_old_is_counter boolean;
  v_acc_currency char(3);
  v_trans_acc_currency char(3);
begin
  -- Currency Validation for INSERT and UPDATE operations
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    -- Verify source account currency matches transaction currency
    select currency_code into v_acc_currency from public.accounts where id = new.account_id;
    if (v_acc_currency is not null and new.currency_code != v_acc_currency) then
      raise exception 'Transaction currency % does not match account currency %', new.currency_code, v_acc_currency;
    end if;

    -- Verify target account currency matches transaction currency for transfers
    if (new.txn_type = 'transfer' and new.transfer_account_id is not null) then
      select currency_code into v_trans_acc_currency from public.accounts where id = new.transfer_account_id;
      if (v_trans_acc_currency is not null and new.currency_code != v_trans_acc_currency) then
        raise exception 'Transfer transaction currency % does not match transfer target account currency %', new.currency_code, v_trans_acc_currency;
      end if;
    end if;
  end if;

  -- For INSERT
  if (TG_OP = 'INSERT') then
    v_is_counter := COALESCE((new.metadata->>'is_transfer_counter')::boolean, false);
    if v_is_counter then
      return new;
    end if;

    if (new.txn_type = 'income') then
      update public.accounts set current_balance = current_balance + new.amount where id = new.account_id;
    elsif (new.txn_type = 'expense') then
      update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
    elsif (new.txn_type = 'transfer') then
      update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
      if (new.transfer_account_id is not null) then
        update public.accounts set current_balance = current_balance + new.amount where id = new.transfer_account_id;
      end if;
    end if;
    return new;
  end if;

  -- For DELETE
  if (TG_OP = 'DELETE') then
    v_old_is_counter := COALESCE((old.metadata->>'is_transfer_counter')::boolean, false);
    if v_old_is_counter then
      return old;
    end if;

    if (old.txn_type = 'income') then
      update public.accounts set current_balance = current_balance - old.amount where id = old.account_id;
    elsif (old.txn_type = 'expense') then
      update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
    elsif (old.txn_type = 'transfer') then
      update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
      if (old.transfer_account_id is not null) then
        update public.accounts set current_balance = current_balance - old.amount where id = old.transfer_account_id;
      end if;
    end if;
    return old;
  end if;

  -- For UPDATE
  if (TG_OP = 'UPDATE') then
    -- Deduct old values (if not a counter transaction)
    v_old_is_counter := COALESCE((old.metadata->>'is_transfer_counter')::boolean, false);
    if not v_old_is_counter then
      if (old.txn_type = 'income') then
        update public.accounts set current_balance = current_balance - old.amount where id = old.account_id;
      elsif (old.txn_type = 'expense') then
        update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
      elsif (old.txn_type = 'transfer') then
        update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
        if (old.transfer_account_id is not null) then
          update public.accounts set current_balance = current_balance - old.amount where id = old.transfer_account_id;
        end if;
      end if;
    end if;

    -- Add new values (if not a counter transaction)
    v_is_counter := COALESCE((new.metadata->>'is_transfer_counter')::boolean, false);
    if not v_is_counter then
      if (new.txn_type = 'income') then
        update public.accounts set current_balance = current_balance + new.amount where id = new.account_id;
      elsif (new.txn_type = 'expense') then
        update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
      elsif (new.txn_type = 'transfer') then
        update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
        if (new.transfer_account_id is not null) then
          update public.accounts set current_balance = current_balance + new.amount where id = new.transfer_account_id;
        end if;
      end if;
    end if;

    return new;
  end if;

  return null;
end;
$$;

-- Add check constraint for currency code in transactions
ALTER TABLE public.transactions
  ADD CONSTRAINT chk_transactions_currency_format
  CHECK (char_length(currency_code) = 3 AND currency_code = upper(currency_code));
