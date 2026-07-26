-- Corrige decide_membership_request para que o super admin possa aprovar
-- solicitações de funcionário diretamente, sem precisar passar pelo síndico.

CREATE OR REPLACE FUNCTION public.decide_membership_request(p_request_id UUID, p_decision TEXT, p_reason TEXT DEFAULT NULL)
RETURNS public.membership_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_req public.membership_requests;
  v_is_admin BOOLEAN;
  v_is_sindico BOOLEAN;
  v_new_condo_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_decision NOT IN ('approve', 'reject') THEN RAISE EXCEPTION 'invalid_decision'; END IF;

  SELECT * INTO v_req FROM public.membership_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_req.status IN ('approved', 'rejected') THEN RAISE EXCEPTION 'already_decided'; END IF;

  v_is_admin   := app_private.is_platform_admin(v_uid);
  v_is_sindico := (v_req.condo_id IS NOT NULL AND app_private.is_condo_admin(v_uid, v_req.condo_id));

  -- REJEITAR — síndico ou admin podem rejeitar
  IF p_decision = 'reject' THEN
    IF NOT (v_is_admin OR v_is_sindico) THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.membership_requests
      SET status = 'rejected',
          rejection_reason = p_reason,
          decided_by_admin    = CASE WHEN v_is_admin THEN v_uid ELSE decided_by_admin END,
          decided_admin_at    = CASE WHEN v_is_admin THEN now() ELSE decided_admin_at END,
          decided_by_sindico  = CASE WHEN v_is_sindico AND NOT v_is_admin THEN v_uid ELSE decided_by_sindico END,
          decided_sindico_at  = CASE WHEN v_is_sindico AND NOT v_is_admin THEN now() ELSE decided_sindico_at END
      WHERE id = p_request_id
      RETURNING * INTO v_req;
    RETURN v_req;
  END IF;

  -- APROVAR — lógica por papel solicitado
  IF v_req.requested_role = 'funcionario' THEN
    IF v_req.status = 'pending' THEN
      IF v_is_admin THEN
        -- Super admin pula etapa do síndico e aprova direto
        NULL; -- cai no bloco de aprovação final abaixo
      ELSIF v_is_sindico THEN
        -- Síndico faz primeira aprovação → sindico_approved
        UPDATE public.membership_requests
          SET status = 'sindico_approved',
              decided_by_sindico = v_uid,
              decided_sindico_at = now()
          WHERE id = p_request_id
          RETURNING * INTO v_req;
        RETURN v_req;
      ELSE
        RAISE EXCEPTION 'sindico_required';
      END IF;
    ELSIF v_req.status = 'sindico_approved' THEN
      IF NOT v_is_admin THEN RAISE EXCEPTION 'admin_required'; END IF;
    END IF;

  ELSIF v_req.requested_role = 'sindico' THEN
    -- Apenas super admin
    IF NOT v_is_admin THEN RAISE EXCEPTION 'admin_required'; END IF;
    -- Cria condomínio se foi proposto
    IF v_req.condo_id IS NULL AND v_req.proposed_condo_name IS NOT NULL THEN
      INSERT INTO public.condominiums(name, address, created_by)
        VALUES (v_req.proposed_condo_name, v_req.proposed_condo_address, v_req.user_id)
        RETURNING id INTO v_new_condo_id;
      UPDATE public.membership_requests SET condo_id = v_new_condo_id WHERE id = p_request_id;
      v_req.condo_id := v_new_condo_id;
    END IF;

  ELSIF v_req.requested_role = 'morador' THEN
    IF NOT (v_is_sindico OR v_is_admin) THEN RAISE EXCEPTION 'forbidden'; END IF;
  END IF;

  -- Aprovação final — atualiza perfil e insere role
  UPDATE public.profiles
    SET condo_id   = v_req.condo_id,
        unit_label = COALESCE(unit_label, v_req.unit_label)
    WHERE id = v_req.user_id;

  INSERT INTO public.user_roles(user_id, condo_id, role)
    VALUES (v_req.user_id, v_req.condo_id, v_req.requested_role)
    ON CONFLICT DO NOTHING;

  UPDATE public.membership_requests
    SET status           = 'approved',
        decided_by_admin = CASE WHEN v_is_admin THEN v_uid ELSE decided_by_admin END,
        decided_admin_at = CASE WHEN v_is_admin THEN now() ELSE decided_admin_at END
    WHERE id = p_request_id
    RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;
