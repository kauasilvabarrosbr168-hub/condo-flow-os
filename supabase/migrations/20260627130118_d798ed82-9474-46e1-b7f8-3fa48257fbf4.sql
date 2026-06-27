
CREATE TABLE public.feedback_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'feedback' CHECK (kind IN ('feedback','aviso','sugestao','elogio')),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feedback_posts_condo_created_idx ON public.feedback_posts(condo_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_posts TO authenticated;
GRANT ALL ON public.feedback_posts TO service_role;

ALTER TABLE public.feedback_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view condo feedback"
  ON public.feedback_posts FOR SELECT
  TO authenticated
  USING (public.is_condo_member(auth.uid(), condo_id));

CREATE POLICY "Members can post feedback in their condo"
  ON public.feedback_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_condo_member(auth.uid(), condo_id)
  );

CREATE POLICY "Author or admin can update feedback"
  ON public.feedback_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR public.is_condo_admin(auth.uid(), condo_id))
  WITH CHECK (author_id = auth.uid() OR public.is_condo_admin(auth.uid(), condo_id));

CREATE POLICY "Author or admin can delete feedback"
  ON public.feedback_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR public.is_condo_admin(auth.uid(), condo_id));

CREATE TRIGGER tg_feedback_posts_updated_at
  BEFORE UPDATE ON public.feedback_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
