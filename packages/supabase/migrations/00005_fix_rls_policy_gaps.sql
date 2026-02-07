-- ==================== FIX RLS POLICY GAPS ====================
-- Several Mosaic tables had RLS enabled with only SELECT policies,
-- missing INSERT/UPDATE/DELETE. This blocks writes when not using
-- the service_role_key (e.g., direct mobile access or future JWT auth).

-- ==================== context_multipliers ====================
-- API writes via upsert in _recalculate_multiplier()

CREATE POLICY "Users can insert context multipliers for own children"
  ON public.context_multipliers FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM public.children WHERE parent_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own children context multipliers"
  ON public.context_multipliers FOR UPDATE
  USING (child_id IN (
    SELECT id FROM public.children WHERE parent_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own children context multipliers"
  ON public.context_multipliers FOR DELETE
  USING (child_id IN (
    SELECT id FROM public.children WHERE parent_user_id = auth.uid()
  ));

-- ==================== mosaic_assessments ====================
-- API writes via insert in mosaic_scoring.py

CREATE POLICY "Users can insert mosaic assessments for own children"
  ON public.mosaic_assessments FOR INSERT
  WITH CHECK (child_id IN (
    SELECT id FROM public.children WHERE parent_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own children mosaic assessments"
  ON public.mosaic_assessments FOR UPDATE
  USING (child_id IN (
    SELECT id FROM public.children WHERE parent_user_id = auth.uid()
  ));

-- ==================== archetype_matches ====================
-- API writes via insert in mosaic_scoring.py (linked through mosaic_assessment)

CREATE POLICY "Users can insert archetype matches for own assessments"
  ON public.archetype_matches FOR INSERT
  WITH CHECK (mosaic_assessment_id IN (
    SELECT id FROM public.mosaic_assessments WHERE child_id IN (
      SELECT id FROM public.children WHERE parent_user_id = auth.uid()
    )
  ));

-- ==================== ikigai_charts ====================
-- API writes via upsert in ikigai_service.py

CREATE POLICY "Users can insert ikigai charts for own assessments"
  ON public.ikigai_charts FOR INSERT
  WITH CHECK (mosaic_assessment_id IN (
    SELECT id FROM public.mosaic_assessments WHERE child_id IN (
      SELECT id FROM public.children WHERE parent_user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update own ikigai charts"
  ON public.ikigai_charts FOR UPDATE
  USING (mosaic_assessment_id IN (
    SELECT id FROM public.mosaic_assessments WHERE child_id IN (
      SELECT id FROM public.children WHERE parent_user_id = auth.uid()
    )
  ));

-- ==================== mosaic_gap_analysis ====================
-- API writes via insert in mosaic_scoring.py

CREATE POLICY "Users can insert gap analysis for own assessments"
  ON public.mosaic_gap_analysis FOR INSERT
  WITH CHECK (mosaic_assessment_id IN (
    SELECT id FROM public.mosaic_assessments WHERE child_id IN (
      SELECT id FROM public.children WHERE parent_user_id = auth.uid()
    )
  ));

-- ==================== mosaic_audit_log ====================
-- API writes audit entries; users can insert their own logs but never modify/delete

CREATE POLICY "Users can insert own audit log entries"
  ON public.mosaic_audit_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ==================== district_analytics ====================
-- Only service role should write (batch jobs). Add INSERT for service role context.
-- No user-level INSERT policy needed; service_role bypasses RLS.
-- Keeping read-only for users is correct.
