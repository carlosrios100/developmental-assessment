-- Developmental Assessment Database Schema
-- Migration: 00001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== ENUMS ====================

CREATE TYPE user_role AS ENUM ('parent', 'caregiver', 'professional', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE response_value AS ENUM ('yes', 'sometimes', 'not_yet');
CREATE TYPE risk_level AS ENUM ('typical', 'monitoring', 'at_risk', 'concern');
CREATE TYPE assessment_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');
CREATE TYPE video_processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE video_context AS ENUM ('free_play', 'structured_activity', 'caregiver_interaction', 'feeding', 'book_reading', 'physical_activity', 'peer_interaction', 'self_care_routine');
CREATE TYPE recommendation_type AS ENUM ('activity', 'referral', 'monitoring', 'reassessment');
CREATE TYPE recommendation_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE report_type AS ENUM ('parent_summary', 'professional_detailed', 'referral', 'progress_comparison', 'video_analysis');
CREATE TYPE report_format AS ENUM ('pdf', 'html', 'json');
CREATE TYPE milestone_status AS ENUM ('not_started', 'emerging', 'achieved');

-- ==================== USERS & PROFILES ====================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'parent',
    profile_photo_url TEXT,
    settings JSONB DEFAULT '{"notifications": {"assessmentReminders": true, "milestoneAlerts": true, "weeklyProgress": true}, "privacy": {"shareWithProfessionals": false, "allowAnonymousResearch": false}, "language": "en", "timezone": "America/New_York"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CHILDREN ====================

CREATE TABLE public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    date_of_birth DATE NOT NULL,
    gender gender_type,
    premature_weeks INTEGER DEFAULT 0 CHECK (premature_weeks >= 0 AND premature_weeks <= 20),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_children_parent ON public.children(parent_user_id);

-- ==================== ASSESSMENTS ====================

CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    age_at_assessment INTEGER NOT NULL CHECK (age_at_assessment >= 0 AND age_at_assessment <= 72),
    questionnaire_version INTEGER NOT NULL CHECK (questionnaire_version IN (2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 42, 48, 54, 60)),
    status assessment_status DEFAULT 'draft',
    completed_by user_role DEFAULT 'parent',
    completed_by_user_id UUID REFERENCES public.profiles(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    overall_risk_level risk_level,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_child ON public.assessments(child_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessments_completed_at ON public.assessments(completed_at DESC);

-- ==================== QUESTIONNAIRE RESPONSES ====================

CREATE TABLE public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- e.g., 'comm_12_1'
    response response_value NOT NULL,
    response_value INTEGER NOT NULL CHECK (response_value IN (0, 5, 10)),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, item_id)
);

CREATE INDEX idx_responses_assessment ON public.questionnaire_responses(assessment_id);

-- ==================== DOMAIN SCORES ====================

CREATE TABLE public.domain_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    domain TEXT NOT NULL CHECK (domain IN ('communication', 'gross_motor', 'fine_motor', 'problem_solving', 'personal_social')),
    raw_score NUMERIC(5,2) NOT NULL,
    max_score INTEGER DEFAULT 60,
    percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
    z_score NUMERIC(5,2),
    risk_level risk_level NOT NULL,
    cutoff_score NUMERIC(5,2) NOT NULL,
    monitoring_zone_cutoff NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, domain)
);

CREATE INDEX idx_domain_scores_assessment ON public.domain_scores(assessment_id);

-- ==================== VIDEO UPLOADS ====================

CREATE TABLE public.video_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    uploaded_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    duration NUMERIC(10,2) NOT NULL, -- seconds
    context video_context NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    thumbnail_path TEXT,
    thumbnail_url TEXT,
    processing_status video_processing_status DEFAULT 'pending',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_child ON public.video_uploads(child_id);
CREATE INDEX idx_videos_assessment ON public.video_uploads(assessment_id);
CREATE INDEX idx_videos_status ON public.video_uploads(processing_status);

-- ==================== VIDEO ANALYSIS RESULTS ====================

CREATE TABLE public.video_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES public.video_uploads(id) ON DELETE CASCADE,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    duration NUMERIC(10,2) NOT NULL,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    movement_metrics JSONB,
    interaction_metrics JSONB,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_video ON public.video_analysis_results(video_id);

-- ==================== DETECTED BEHAVIORS ====================

CREATE TABLE public.detected_behaviors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES public.video_analysis_results(id) ON DELETE CASCADE,
    behavior_type TEXT NOT NULL,
    start_time NUMERIC(10,2) NOT NULL,
    end_time NUMERIC(10,2) NOT NULL,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT,
    related_milestones TEXT[],
    bounding_box JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behaviors_analysis ON public.detected_behaviors(analysis_id);

-- ==================== VIDEO EVIDENCE LINKS ====================

CREATE TABLE public.video_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.video_uploads(id) ON DELETE CASCADE,
    timestamp_start NUMERIC(10,2),
    timestamp_end NUMERIC(10,2),
    confidence NUMERIC(3,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_response ON public.video_evidence(response_id);
CREATE INDEX idx_evidence_video ON public.video_evidence(video_id);

-- ==================== RECOMMENDATIONS ====================

CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    priority recommendation_priority NOT NULL,
    domain TEXT NOT NULL,
    type recommendation_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    activities JSONB, -- Array of activity objects
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_assessment ON public.recommendations(assessment_id);

-- ==================== MILESTONE PROGRESS ====================

CREATE TABLE public.milestone_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    milestone_id TEXT NOT NULL,
    status milestone_status DEFAULT 'not_started',
    first_observed_at TIMESTAMPTZ,
    achieved_at TIMESTAMPTZ,
    video_evidence_ids UUID[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, milestone_id)
);

CREATE INDEX idx_milestone_child ON public.milestone_progress(child_id);

-- ==================== REPORTS ====================

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    generated_by_user_id UUID REFERENCES public.profiles(id),
    type report_type NOT NULL,
    format report_format NOT NULL,
    storage_path TEXT,
    storage_url TEXT,
    content JSONB,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_assessment ON public.reports(assessment_id);
CREATE INDEX idx_reports_child ON public.reports(child_id);

-- ==================== LONGITUDINAL TRENDS ====================

CREATE TABLE public.longitudinal_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    metric TEXT NOT NULL,
    trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
    data_points JSONB NOT NULL,
    significance NUMERIC(5,4),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, domain, metric)
);

CREATE INDEX idx_trends_child ON public.longitudinal_trends(child_id);

-- ==================== SHARED ACCESS ====================

-- For sharing child data with professionals
CREATE TABLE public.shared_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES public.profiles(id),
    shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id),
    access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, shared_with_user_id)
);

CREATE INDEX idx_shared_child ON public.shared_access(child_id);
CREATE INDEX idx_shared_with ON public.shared_access(shared_with_user_id);

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON public.questionnaire_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.video_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_milestone_updated_at BEFORE UPDATE ON public.milestone_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate age in months
CREATE OR REPLACE FUNCTION calculate_age_months(dob DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, dob)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, dob));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.longitudinal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Children policies
CREATE POLICY "Users can view own children" ON public.children FOR SELECT USING (parent_user_id = auth.uid() OR id IN (SELECT child_id FROM public.shared_access WHERE shared_with_user_id = auth.uid()));
CREATE POLICY "Users can insert own children" ON public.children FOR INSERT WITH CHECK (parent_user_id = auth.uid());
CREATE POLICY "Users can update own children" ON public.children FOR UPDATE USING (parent_user_id = auth.uid());
CREATE POLICY "Users can delete own children" ON public.children FOR DELETE USING (parent_user_id = auth.uid());

-- Assessments policies
CREATE POLICY "Users can view assessments for their children" ON public.assessments FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()) OR child_id IN (SELECT child_id FROM public.shared_access WHERE shared_with_user_id = auth.uid()));
CREATE POLICY "Users can insert assessments for their children" ON public.assessments FOR INSERT WITH CHECK (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can update assessments for their children" ON public.assessments FOR UPDATE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can delete assessments for their children" ON public.assessments FOR DELETE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Questionnaire responses policies
CREATE POLICY "Users can view responses for their assessments" ON public.questionnaire_responses FOR SELECT USING (assessment_id IN (SELECT id FROM public.assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can insert responses for their assessments" ON public.questionnaire_responses FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM public.assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can update responses for their assessments" ON public.questionnaire_responses FOR UPDATE USING (assessment_id IN (SELECT id FROM public.assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Video uploads policies
CREATE POLICY "Users can view videos for their children" ON public.video_uploads FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()) OR child_id IN (SELECT child_id FROM public.shared_access WHERE shared_with_user_id = auth.uid()));
CREATE POLICY "Users can insert videos for their children" ON public.video_uploads FOR INSERT WITH CHECK (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can update videos for their children" ON public.video_uploads FOR UPDATE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can delete videos for their children" ON public.video_uploads FOR DELETE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Similar policies for other tables following the same pattern
CREATE POLICY "Users can view domain scores" ON public.domain_scores FOR SELECT USING (assessment_id IN (SELECT id FROM public.assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can view video analysis" ON public.video_analysis_results FOR SELECT USING (video_id IN (SELECT id FROM public.video_uploads WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can view detected behaviors" ON public.detected_behaviors FOR SELECT USING (analysis_id IN (SELECT id FROM public.video_analysis_results WHERE video_id IN (SELECT id FROM public.video_uploads WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()))));
CREATE POLICY "Users can view recommendations" ON public.recommendations FOR SELECT USING (assessment_id IN (SELECT id FROM public.assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can view milestone progress" ON public.milestone_progress FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can manage milestone progress" ON public.milestone_progress FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can view reports" ON public.reports FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can view trends" ON public.longitudinal_trends FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can manage shared access" ON public.shared_access FOR ALL USING (shared_by_user_id = auth.uid());
