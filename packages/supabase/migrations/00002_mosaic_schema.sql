-- Mosaic Protocol Database Schema
-- Migration: 00002_mosaic_schema.sql
-- Comprehensive holistic child assessment platform

-- ==================== NEW ENUMS ====================

CREATE TYPE cognitive_domain AS ENUM ('math', 'logic', 'verbal', 'spatial', 'memory');
CREATE TYPE emotional_dimension AS ENUM ('empathy', 'risk_tolerance', 'delayed_gratification', 'cooperation', 'failure_resilience', 'emotional_regulation');
CREATE TYPE scenario_type AS ENUM ('sharing', 'delayed_gratification', 'failure_recovery', 'empathy_response', 'risk_assessment', 'cooperation');
CREATE TYPE archetype_type AS ENUM ('diplomat', 'systems_architect', 'operator', 'caregiver', 'creator', 'analyst', 'builder', 'explorer', 'connector', 'guardian');
CREATE TYPE consent_status AS ENUM ('pending', 'granted', 'revoked', 'expired');
CREATE TYPE consent_category AS ENUM ('socioeconomic', 'location', 'family_context', 'research_aggregate', 'district_analytics');

-- ==================== COGNITIVE ASSESSMENT TABLES ====================

-- Adaptive test item bank with IRT parameters
CREATE TABLE public.cognitive_test_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain cognitive_domain NOT NULL,
    difficulty NUMERIC(4,2) NOT NULL, -- IRT b parameter (-3 to +3)
    discrimination NUMERIC(4,2) NOT NULL DEFAULT 1.0, -- IRT a parameter (0.5 to 2.5)
    guessing NUMERIC(3,2) NOT NULL DEFAULT 0.25, -- IRT c parameter (0 to 0.5)
    min_age_months INTEGER NOT NULL CHECK (min_age_months >= 24 AND min_age_months <= 96),
    max_age_months INTEGER NOT NULL CHECK (max_age_months >= 24 AND max_age_months <= 96),
    content JSONB NOT NULL, -- Question content, images, options, correct answer
    instructions TEXT,
    requires_audio BOOLEAN DEFAULT FALSE,
    requires_touch BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (max_age_months >= min_age_months)
);

CREATE INDEX idx_cognitive_items_domain ON public.cognitive_test_items(domain);
CREATE INDEX idx_cognitive_items_age ON public.cognitive_test_items(min_age_months, max_age_months);
CREATE INDEX idx_cognitive_items_difficulty ON public.cognitive_test_items(difficulty);

-- Cognitive test sessions
CREATE TABLE public.cognitive_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    domain cognitive_domain NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    ability_estimate NUMERIC(4,2), -- Theta estimate (-3 to +3)
    standard_error NUMERIC(4,3), -- SE of ability estimate
    items_administered INTEGER DEFAULT 0,
    stopping_reason TEXT, -- 'min_se', 'max_items', 'time_limit', 'user_stopped'
    raw_score NUMERIC(5,2),
    percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
    status assessment_status DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cognitive_assessments_child ON public.cognitive_assessments(child_id);
CREATE INDEX idx_cognitive_assessments_domain ON public.cognitive_assessments(domain);

-- Individual cognitive item responses
CREATE TABLE public.cognitive_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.cognitive_assessments(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.cognitive_test_items(id),
    response JSONB NOT NULL, -- Selected answer(s)
    is_correct BOOLEAN NOT NULL,
    reaction_time_ms INTEGER, -- Time to respond in milliseconds
    theta_before NUMERIC(4,2), -- Ability estimate before this item
    theta_after NUMERIC(4,2), -- Ability estimate after this item
    se_before NUMERIC(4,3),
    se_after NUMERIC(4,3),
    item_sequence INTEGER NOT NULL, -- Order in which item was presented
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cognitive_responses_assessment ON public.cognitive_responses(assessment_id);

-- Aggregate cognitive profile scores
CREATE TABLE public.cognitive_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    math_score NUMERIC(4,2),
    math_percentile INTEGER CHECK (math_percentile >= 0 AND math_percentile <= 100),
    logic_score NUMERIC(4,2),
    logic_percentile INTEGER CHECK (logic_percentile >= 0 AND logic_percentile <= 100),
    verbal_score NUMERIC(4,2),
    verbal_percentile INTEGER CHECK (verbal_percentile >= 0 AND verbal_percentile <= 100),
    spatial_score NUMERIC(4,2),
    spatial_percentile INTEGER CHECK (spatial_percentile >= 0 AND spatial_percentile <= 100),
    memory_score NUMERIC(4,2),
    memory_percentile INTEGER CHECK (memory_percentile >= 0 AND memory_percentile <= 100),
    composite_score NUMERIC(4,2), -- Weighted average
    composite_percentile INTEGER CHECK (composite_percentile >= 0 AND composite_percentile <= 100),
    strengths cognitive_domain[],
    growth_areas cognitive_domain[],
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id)
);

CREATE INDEX idx_cognitive_profiles_child ON public.cognitive_profiles(child_id);

-- ==================== BEHAVIORAL ASSESSMENT TABLES ====================

-- RPG scenario definitions
CREATE TABLE public.behavioral_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_type scenario_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    story_content JSONB NOT NULL, -- Narrative, characters, settings
    choices JSONB NOT NULL, -- Array of choice objects with outcomes
    min_age_months INTEGER NOT NULL CHECK (min_age_months >= 24 AND min_age_months <= 96),
    max_age_months INTEGER NOT NULL CHECK (max_age_months >= 24 AND max_age_months <= 96),
    estimated_duration_seconds INTEGER DEFAULT 120,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    emotional_dimensions emotional_dimension[] NOT NULL,
    assets JSONB, -- Lottie animations, character sprites, backgrounds
    audio_assets JSONB, -- Voice-over, sound effects
    active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (max_age_months >= min_age_months)
);

CREATE INDEX idx_scenarios_type ON public.behavioral_scenarios(scenario_type);
CREATE INDEX idx_scenarios_age ON public.behavioral_scenarios(min_age_months, max_age_months);

-- Gameplay sessions
CREATE TABLE public.behavioral_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.behavioral_scenarios(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_duration_ms INTEGER,
    choices_made INTEGER DEFAULT 0,
    engagement_score NUMERIC(3,2), -- 0 to 1, based on completion and interaction
    status assessment_status DEFAULT 'in_progress',
    device_info JSONB, -- Screen size, touch capability, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavioral_sessions_child ON public.behavioral_sessions(child_id);
CREATE INDEX idx_behavioral_sessions_scenario ON public.behavioral_sessions(scenario_id);

-- Individual choices with reaction times
CREATE TABLE public.behavioral_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.behavioral_sessions(id) ON DELETE CASCADE,
    choice_id TEXT NOT NULL, -- Reference to choice in scenario JSONB
    choice_index INTEGER NOT NULL, -- Order of choice in session
    selected_option TEXT NOT NULL,
    reaction_time_ms INTEGER NOT NULL, -- Time to make decision
    hesitation_count INTEGER DEFAULT 0, -- How many times they hovered/switched
    emotional_dimensions emotional_dimension[] NOT NULL,
    dimension_scores JSONB NOT NULL, -- Score contribution per dimension
    context_state JSONB, -- Game state at time of choice
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavioral_choices_session ON public.behavioral_choices(session_id);

-- Aggregate emotional/behavioral profiles
CREATE TABLE public.emotional_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    empathy_score NUMERIC(4,2) CHECK (empathy_score >= 0 AND empathy_score <= 100),
    risk_tolerance_score NUMERIC(4,2) CHECK (risk_tolerance_score >= 0 AND risk_tolerance_score <= 100),
    delayed_gratification_score NUMERIC(4,2) CHECK (delayed_gratification_score >= 0 AND delayed_gratification_score <= 100),
    cooperation_score NUMERIC(4,2) CHECK (cooperation_score >= 0 AND cooperation_score <= 100),
    failure_resilience_score NUMERIC(4,2) CHECK (failure_resilience_score >= 0 AND failure_resilience_score <= 100),
    emotional_regulation_score NUMERIC(4,2) CHECK (emotional_regulation_score >= 0 AND emotional_regulation_score <= 100),
    composite_eq_score NUMERIC(4,2), -- Weighted emotional quotient
    instinct_index NUMERIC(3,2), -- Based on fast reaction times (more instinctive)
    consistency_index NUMERIC(3,2), -- How consistent are responses across scenarios
    sessions_completed INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id)
);

CREATE INDEX idx_emotional_profiles_child ON public.emotional_profiles(child_id);

-- ==================== CONTEXT TABLES ====================

-- Cached opportunity index data by zip code
CREATE TABLE public.opportunity_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code TEXT NOT NULL,
    state_code TEXT NOT NULL,
    city TEXT,
    opportunity_index NUMERIC(4,3) NOT NULL CHECK (opportunity_index >= 0 AND opportunity_index <= 1),
    key_industries TEXT[] NOT NULL,
    local_grants JSONB, -- Array of {name, description, eligibility, url}
    risk_factors TEXT[],
    growth_trends JSONB, -- Industry growth projections
    school_quality_score NUMERIC(3,2) CHECK (school_quality_score >= 0 AND school_quality_score <= 10),
    internet_access_score NUMERIC(3,2) CHECK (internet_access_score >= 0 AND internet_access_score <= 1),
    food_access_score NUMERIC(3,2) CHECK (food_access_score >= 0 AND food_access_score <= 1),
    median_income INTEGER,
    education_attainment JSONB, -- Percentage breakdown by education level
    data_source TEXT,
    data_version TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zip_code)
);

CREATE INDEX idx_opportunity_zip ON public.opportunity_indices(zip_code);
CREATE INDEX idx_opportunity_state ON public.opportunity_indices(state_code);

-- Opt-in family context information
CREATE TABLE public.family_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    zip_code TEXT,
    household_size INTEGER CHECK (household_size >= 1 AND household_size <= 20),
    parent_education_level TEXT CHECK (parent_education_level IN ('less_than_high_school', 'high_school', 'some_college', 'associates', 'bachelors', 'masters', 'doctorate')),
    household_income_bracket TEXT CHECK (household_income_bracket IN ('under_25k', '25k_50k', '50k_75k', '75k_100k', '100k_150k', '150k_200k', 'over_200k', 'prefer_not_say')),
    single_parent BOOLEAN,
    languages_spoken TEXT[],
    primary_language TEXT,
    receives_assistance BOOLEAN, -- Any government assistance
    assistance_types TEXT[], -- SNAP, WIC, Medicaid, etc.
    childcare_type TEXT CHECK (childcare_type IN ('parent_home', 'relative', 'nanny', 'daycare', 'preschool', 'other')),
    screen_time_hours_daily NUMERIC(3,1),
    outdoor_time_hours_daily NUMERIC(3,1),
    books_in_home INTEGER,
    consent_version INTEGER NOT NULL DEFAULT 1,
    encrypted_fields TEXT[], -- List of fields that are encrypted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id)
);

CREATE INDEX idx_family_context_child ON public.family_contexts(child_id);

-- Consent tracking for context data
CREATE TABLE public.context_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    category consent_category NOT NULL,
    status consent_status DEFAULT 'pending',
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    consent_text TEXT NOT NULL, -- The exact text the user agreed to
    consent_version INTEGER NOT NULL DEFAULT 1,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, child_id, category)
);

CREATE INDEX idx_consents_user ON public.context_consents(user_id);
CREATE INDEX idx_consents_child ON public.context_consents(child_id);

-- Pre-calculated context multipliers
CREATE TABLE public.context_multipliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    opportunity_index NUMERIC(4,3), -- From zip code
    socio_econ_status NUMERIC(4,3), -- Calculated from family context
    gap_score NUMERIC(4,3), -- opportunity_index - socio_econ_status
    adversity_multiplier NUMERIC(4,3) CHECK (adversity_multiplier >= 1.0 AND adversity_multiplier <= 1.5),
    calculation_details JSONB, -- Breakdown of how multiplier was calculated
    data_completeness NUMERIC(3,2), -- 0 to 1, how much context data is available
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id)
);

CREATE INDEX idx_multipliers_child ON public.context_multipliers(child_id);

-- ==================== MOSAIC OUTPUT TABLES ====================

-- Unified Mosaic assessments
CREATE TABLE public.mosaic_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    cognitive_profile_id UUID REFERENCES public.cognitive_profiles(id),
    emotional_profile_id UUID REFERENCES public.emotional_profiles(id),
    context_multiplier_id UUID REFERENCES public.context_multipliers(id),
    raw_cognitive_score NUMERIC(4,2),
    raw_emotional_score NUMERIC(4,2),
    raw_combined_score NUMERIC(4,2), -- (cognitive * 0.4) + (emotional * 0.6)
    adversity_multiplier NUMERIC(4,3) DEFAULT 1.0,
    true_potential_score NUMERIC(5,2), -- raw_combined * adversity_multiplier
    true_potential_percentile INTEGER CHECK (true_potential_percentile >= 0 AND true_potential_percentile <= 100),
    confidence_level NUMERIC(3,2), -- Based on data completeness
    primary_archetype archetype_type,
    secondary_archetype archetype_type,
    local_viability_score NUMERIC(4,2), -- How well archetype matches local economy
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(child_id, version)
);

CREATE INDEX idx_mosaic_child ON public.mosaic_assessments(child_id);
CREATE INDEX idx_mosaic_archetype ON public.mosaic_assessments(primary_archetype);

-- Archetype definitions with trait weights
CREATE TABLE public.archetypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type archetype_type NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT, -- Icon identifier
    color_primary TEXT, -- Hex color
    color_secondary TEXT,
    trait_weights JSONB NOT NULL, -- Weights for cognitive + emotional dimensions
    career_pathways JSONB NOT NULL, -- Array of {industry, roles, growth_outlook}
    industry_matches TEXT[] NOT NULL, -- Industries this archetype excels in
    strengths TEXT[] NOT NULL,
    growth_areas TEXT[] NOT NULL,
    famous_examples TEXT[], -- Optional inspiring figures
    affirmation TEXT, -- Positive message for child
    parent_guidance TEXT, -- Guidance for parents
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child-archetype match scores
CREATE TABLE public.archetype_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosaic_assessment_id UUID NOT NULL REFERENCES public.mosaic_assessments(id) ON DELETE CASCADE,
    archetype_type archetype_type NOT NULL,
    match_score NUMERIC(4,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_rank INTEGER NOT NULL CHECK (match_rank >= 1 AND match_rank <= 10),
    trait_breakdown JSONB NOT NULL, -- Score per trait
    local_viability BOOLEAN DEFAULT FALSE, -- Matches local industries
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mosaic_assessment_id, archetype_type)
);

CREATE INDEX idx_archetype_matches_mosaic ON public.archetype_matches(mosaic_assessment_id);

-- Ikigai chart data
CREATE TABLE public.ikigai_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosaic_assessment_id UUID NOT NULL REFERENCES public.mosaic_assessments(id) ON DELETE CASCADE,
    talents JSONB NOT NULL, -- Array of {name, score, source}
    passions JSONB NOT NULL, -- Array of {name, engagement_score, inferred_from}
    world_needs JSONB NOT NULL, -- Array of {need, local_demand, growth_trend}
    viable_careers JSONB NOT NULL, -- Array of {career, match_score, local_availability, salary_range}
    ikigai_center JSONB, -- The intersection - ideal paths
    visualization_data JSONB, -- Pre-calculated chart coordinates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mosaic_assessment_id)
);

CREATE INDEX idx_ikigai_mosaic ON public.ikigai_charts(mosaic_assessment_id);

-- Gap analysis with resource matching
CREATE TABLE public.mosaic_gap_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosaic_assessment_id UUID NOT NULL REFERENCES public.mosaic_assessments(id) ON DELETE CASCADE,
    gap_type TEXT NOT NULL CHECK (gap_type IN ('skill', 'experience', 'resource', 'access')),
    gap_name TEXT NOT NULL,
    gap_description TEXT,
    current_level NUMERIC(4,2),
    target_level NUMERIC(4,2),
    priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    related_archetype archetype_type,
    matched_resources JSONB, -- Array of {resource_type, name, description, url, local}
    local_programs JSONB, -- Local programs that can help
    estimated_effort TEXT, -- 'weeks', 'months', 'years'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gap_analysis_mosaic ON public.mosaic_gap_analysis(mosaic_assessment_id);

-- District-level anonymized analytics
CREATE TABLE public.district_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code TEXT NOT NULL,
    state_code TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sample_size INTEGER NOT NULL CHECK (sample_size >= 50), -- Minimum for privacy
    age_group TEXT NOT NULL, -- '2-4', '4-6', '6-8'
    archetype_distribution JSONB NOT NULL, -- {archetype: count}
    cognitive_domain_averages JSONB NOT NULL, -- {domain: {mean, stddev}}
    emotional_dimension_averages JSONB NOT NULL,
    opportunity_utilization NUMERIC(4,2), -- How well local opportunities match talents
    top_gaps JSONB, -- Most common gaps in the district
    recommended_programs JSONB, -- Programs that would help most
    differential_privacy_epsilon NUMERIC(5,4), -- Privacy parameter used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zip_code, period_start, period_end, age_group)
);

CREATE INDEX idx_district_zip ON public.district_analytics(zip_code);
CREATE INDEX idx_district_period ON public.district_analytics(period_start, period_end);

-- Audit log for sensitive data access
CREATE TABLE public.mosaic_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- 'view', 'export', 'share', 'delete'
    resource_type TEXT NOT NULL, -- 'mosaic_assessment', 'family_context', etc.
    resource_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON public.mosaic_audit_log(user_id);
CREATE INDEX idx_audit_resource ON public.mosaic_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created ON public.mosaic_audit_log(created_at);

-- ==================== TRIGGERS ====================

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_cognitive_items_updated_at BEFORE UPDATE ON public.cognitive_test_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cognitive_assessments_updated_at BEFORE UPDATE ON public.cognitive_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_behavioral_scenarios_updated_at BEFORE UPDATE ON public.behavioral_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emotional_profiles_updated_at BEFORE UPDATE ON public.emotional_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cognitive_profiles_updated_at BEFORE UPDATE ON public.cognitive_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_family_contexts_updated_at BEFORE UPDATE ON public.family_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_context_consents_updated_at BEFORE UPDATE ON public.context_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_archetypes_updated_at BEFORE UPDATE ON public.archetypes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE public.cognitive_test_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosaic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ikigai_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosaic_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosaic_audit_log ENABLE ROW LEVEL SECURITY;

-- Test items are public read
CREATE POLICY "Anyone can view active cognitive items" ON public.cognitive_test_items FOR SELECT USING (active = TRUE);

-- Scenarios are public read
CREATE POLICY "Anyone can view active scenarios" ON public.behavioral_scenarios FOR SELECT USING (active = TRUE);

-- Archetypes are public read
CREATE POLICY "Anyone can view active archetypes" ON public.archetypes FOR SELECT USING (active = TRUE);

-- Opportunity indices are public read
CREATE POLICY "Anyone can view opportunity indices" ON public.opportunity_indices FOR SELECT USING (TRUE);

-- District analytics are public read (already anonymized)
CREATE POLICY "Anyone can view district analytics" ON public.district_analytics FOR SELECT USING (TRUE);

-- Cognitive assessments policies
CREATE POLICY "Users can view own children cognitive assessments" ON public.cognitive_assessments
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can insert cognitive assessments for own children" ON public.cognitive_assessments
    FOR INSERT WITH CHECK (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can update own children cognitive assessments" ON public.cognitive_assessments
    FOR UPDATE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Cognitive responses policies
CREATE POLICY "Users can view own children cognitive responses" ON public.cognitive_responses
    FOR SELECT USING (assessment_id IN (SELECT id FROM public.cognitive_assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can insert cognitive responses" ON public.cognitive_responses
    FOR INSERT WITH CHECK (assessment_id IN (SELECT id FROM public.cognitive_assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Cognitive profiles policies
CREATE POLICY "Users can view own children cognitive profiles" ON public.cognitive_profiles
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can manage own children cognitive profiles" ON public.cognitive_profiles
    FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Behavioral sessions policies
CREATE POLICY "Users can view own children behavioral sessions" ON public.behavioral_sessions
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can insert behavioral sessions" ON public.behavioral_sessions
    FOR INSERT WITH CHECK (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can update own children behavioral sessions" ON public.behavioral_sessions
    FOR UPDATE USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Behavioral choices policies
CREATE POLICY "Users can view own children behavioral choices" ON public.behavioral_choices
    FOR SELECT USING (session_id IN (SELECT id FROM public.behavioral_sessions WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));
CREATE POLICY "Users can insert behavioral choices" ON public.behavioral_choices
    FOR INSERT WITH CHECK (session_id IN (SELECT id FROM public.behavioral_sessions WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Emotional profiles policies
CREATE POLICY "Users can view own children emotional profiles" ON public.emotional_profiles
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can manage own children emotional profiles" ON public.emotional_profiles
    FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Family contexts policies
CREATE POLICY "Users can view own children family contexts" ON public.family_contexts
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));
CREATE POLICY "Users can manage own children family contexts" ON public.family_contexts
    FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Context consents policies
CREATE POLICY "Users can view own consents" ON public.context_consents
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own consents" ON public.context_consents
    FOR ALL USING (user_id = auth.uid());

-- Context multipliers policies
CREATE POLICY "Users can view own children context multipliers" ON public.context_multipliers
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Mosaic assessments policies
CREATE POLICY "Users can view own children mosaic assessments" ON public.mosaic_assessments
    FOR SELECT USING (child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid()));

-- Archetype matches policies
CREATE POLICY "Users can view own children archetype matches" ON public.archetype_matches
    FOR SELECT USING (mosaic_assessment_id IN (SELECT id FROM public.mosaic_assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Ikigai charts policies
CREATE POLICY "Users can view own children ikigai charts" ON public.ikigai_charts
    FOR SELECT USING (mosaic_assessment_id IN (SELECT id FROM public.mosaic_assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Gap analysis policies
CREATE POLICY "Users can view own children gap analysis" ON public.mosaic_gap_analysis
    FOR SELECT USING (mosaic_assessment_id IN (SELECT id FROM public.mosaic_assessments WHERE child_id IN (SELECT id FROM public.children WHERE parent_user_id = auth.uid())));

-- Audit log - only viewable by owner
CREATE POLICY "Users can view own audit logs" ON public.mosaic_audit_log
    FOR SELECT USING (user_id = auth.uid());

-- ==================== SEED ARCHETYPES ====================

INSERT INTO public.archetypes (type, name, description, icon, color_primary, color_secondary, trait_weights, career_pathways, industry_matches, strengths, growth_areas, affirmation, parent_guidance) VALUES
('diplomat', 'The Diplomat', 'Natural communicators who excel at understanding and connecting with others. They navigate social situations with grace and bring people together.', 'handshake', '#4A90D9', '#7BB5E8',
 '{"empathy": 0.25, "cooperation": 0.25, "verbal": 0.2, "emotional_regulation": 0.15, "logic": 0.15}',
 '[{"industry": "International Relations", "roles": ["Diplomat", "Trade Specialist", "Cultural Liaison"], "growth_outlook": "stable"},
   {"industry": "Hospitality", "roles": ["Hotel Manager", "Event Coordinator", "Customer Experience"], "growth_outlook": "growing"},
   {"industry": "Import/Export", "roles": ["Trade Negotiator", "Supply Chain Manager", "Logistics Coordinator"], "growth_outlook": "growing"}]',
 ARRAY['Import/Export', 'Hospitality', 'International Relations', 'Public Relations', 'Human Resources'],
 ARRAY['Cross-cultural communication', 'Conflict resolution', 'Building consensus', 'Active listening'],
 ARRAY['Setting boundaries', 'Decisive action under pressure'],
 'You have a gift for bringing people together and helping them understand each other.',
 'Encourage activities that involve teamwork and communication. Consider debate clubs, language learning, or community service projects.'),

('systems_architect', 'The Systems Architect', 'Logical thinkers who see patterns and connections others miss. They love building and understanding how things work together.', 'cpu', '#6B5B95', '#9B8DC4',
 '{"logic": 0.3, "spatial": 0.25, "math": 0.2, "delayed_gratification": 0.15, "memory": 0.1}',
 '[{"industry": "Technology", "roles": ["Software Architect", "Systems Engineer", "DevOps Lead"], "growth_outlook": "rapidly_growing"},
   {"industry": "Logistics", "roles": ["Operations Analyst", "Supply Chain Architect", "Process Engineer"], "growth_outlook": "growing"},
   {"industry": "Engineering", "roles": ["Structural Engineer", "Industrial Designer", "Quality Engineer"], "growth_outlook": "stable"}]',
 ARRAY['Technology', 'Logistics', 'Engineering', 'Data Science', 'Architecture'],
 ARRAY['Pattern recognition', 'Systematic thinking', 'Long-term planning', 'Technical problem-solving'],
 ARRAY['Patience with less logical thinkers', 'Communicating complex ideas simply'],
 'You have an amazing ability to see how things connect and build systems that work.',
 'Provide building toys (LEGO, circuits), coding games, and puzzles. Encourage them to explain their thought process.'),

('operator', 'The Operator', 'Reliable and balanced individuals who excel at getting things done. They are the backbone of any team, bringing stability and execution excellence.', 'settings', '#45B7A0', '#7DD4C4',
 '{"delayed_gratification": 0.2, "cooperation": 0.2, "failure_resilience": 0.2, "logic": 0.15, "emotional_regulation": 0.15, "memory": 0.1}',
 '[{"industry": "Management", "roles": ["Operations Manager", "Project Manager", "General Manager"], "growth_outlook": "stable"},
   {"industry": "Healthcare Administration", "roles": ["Hospital Administrator", "Practice Manager", "Healthcare Coordinator"], "growth_outlook": "growing"},
   {"industry": "Business Operations", "roles": ["COO", "Business Analyst", "Process Improvement Specialist"], "growth_outlook": "stable"}]',
 ARRAY['Management', 'Healthcare Administration', 'Business Operations', 'Consulting', 'Military'],
 ARRAY['Consistent execution', 'Team coordination', 'Process optimization', 'Reliability'],
 ARRAY['Taking creative risks', 'Delegating effectively'],
 'You are someone people can always count on. Your reliability is a superpower.',
 'Give responsibilities and acknowledge follow-through. Team sports and group projects help develop leadership skills.'),

('caregiver', 'The Caregiver', 'Deeply empathetic individuals who find joy in helping others grow and thrive. They create nurturing environments wherever they go.', 'heart', '#E8778B', '#F4A5B2',
 '{"empathy": 0.35, "cooperation": 0.25, "emotional_regulation": 0.2, "verbal": 0.1, "memory": 0.1}',
 '[{"industry": "Healthcare", "roles": ["Nurse", "Physical Therapist", "Occupational Therapist"], "growth_outlook": "rapidly_growing"},
   {"industry": "Education", "roles": ["Teacher", "School Counselor", "Special Education Specialist"], "growth_outlook": "stable"},
   {"industry": "Social Work", "roles": ["Social Worker", "Family Therapist", "Child Advocate"], "growth_outlook": "growing"}]',
 ARRAY['Healthcare', 'Education', 'Social Work', 'Nonprofit', 'Childcare'],
 ARRAY['Emotional support', 'Patient guidance', 'Creating safe spaces', 'Intuitive understanding'],
 ARRAY['Self-care and boundaries', 'Avoiding burnout'],
 'Your caring heart makes the world a better place. You help others feel safe and loved.',
 'Encourage caring for pets or plants. Volunteer opportunities and role-playing games about helping others reinforce these gifts.'),

('creator', 'The Creator', 'Imaginative souls who see the world differently and love expressing their unique vision. They bring beauty and innovation to everything they touch.', 'palette', '#FF6B6B', '#FF9E9E',
 '{"spatial": 0.25, "verbal": 0.2, "risk_tolerance": 0.2, "emotional_regulation": 0.15, "empathy": 0.1, "memory": 0.1}',
 '[{"industry": "Arts & Design", "roles": ["Graphic Designer", "UX Designer", "Art Director"], "growth_outlook": "growing"},
   {"industry": "Marketing", "roles": ["Creative Director", "Brand Strategist", "Content Creator"], "growth_outlook": "growing"},
   {"industry": "Entertainment", "roles": ["Game Designer", "Animator", "Film Producer"], "growth_outlook": "stable"}]',
 ARRAY['Arts & Design', 'Marketing', 'Entertainment', 'Fashion', 'Media'],
 ARRAY['Original thinking', 'Visual communication', 'Storytelling', 'Aesthetic sensitivity'],
 ARRAY['Meeting deadlines', 'Accepting constructive criticism'],
 'Your imagination creates things that never existed before. The world needs your unique vision.',
 'Provide diverse art supplies, music, and creative tools. Celebrate the process, not just the outcome.'),

('analyst', 'The Analyst', 'Detail-oriented minds who love diving deep into data and uncovering hidden truths. They bring clarity and precision to complex problems.', 'bar-chart', '#5C6BC0', '#8E99D9',
 '{"math": 0.3, "logic": 0.25, "memory": 0.2, "delayed_gratification": 0.15, "spatial": 0.1}',
 '[{"industry": "Finance", "roles": ["Financial Analyst", "Investment Banker", "Risk Manager"], "growth_outlook": "stable"},
   {"industry": "Data Science", "roles": ["Data Scientist", "ML Engineer", "Business Intelligence Analyst"], "growth_outlook": "rapidly_growing"},
   {"industry": "Research", "roles": ["Research Scientist", "Market Researcher", "Policy Analyst"], "growth_outlook": "stable"}]',
 ARRAY['Finance', 'Data Science', 'Research', 'Consulting', 'Insurance'],
 ARRAY['Attention to detail', 'Quantitative reasoning', 'Pattern detection', 'Objective analysis'],
 ARRAY['Embracing ambiguity', 'Communicating findings to non-experts'],
 'You have a gift for finding the truth hidden in the details. Your insights help everyone make better decisions.',
 'Encourage puzzles, strategy games, and science experiments. Teach them to explain findings in simple terms.'),

('builder', 'The Builder', 'Hands-on problem solvers who love creating tangible things. They have the patience and precision to bring ideas to physical reality.', 'hammer', '#8D6E63', '#BCAAA4',
 '{"spatial": 0.25, "delayed_gratification": 0.25, "failure_resilience": 0.2, "math": 0.15, "logic": 0.15}',
 '[{"industry": "Construction", "roles": ["Architect", "Civil Engineer", "General Contractor"], "growth_outlook": "stable"},
   {"industry": "Manufacturing", "roles": ["Industrial Engineer", "Production Manager", "Quality Control"], "growth_outlook": "stable"},
   {"industry": "Skilled Trades", "roles": ["Electrician", "Plumber", "HVAC Technician"], "growth_outlook": "growing"}]',
 ARRAY['Construction', 'Manufacturing', 'Skilled Trades', 'Engineering', 'Robotics'],
 ARRAY['Spatial reasoning', 'Patient craftsmanship', 'Practical problem-solving', 'Physical precision'],
 ARRAY['Abstract planning', 'Theoretical concepts'],
 'You can build things with your hands that others can only imagine. Your creations will stand the test of time.',
 'Provide building materials, woodworking kits, and real tools (age-appropriate). Let them see projects through to completion.'),

('explorer', 'The Explorer', 'Adventurous spirits who thrive on discovery and new experiences. They push boundaries and inspire others to see beyond the familiar.', 'compass', '#FFA726', '#FFD180',
 '{"risk_tolerance": 0.3, "spatial": 0.2, "failure_resilience": 0.2, "empathy": 0.15, "verbal": 0.15}',
 '[{"industry": "Travel & Tourism", "roles": ["Travel Writer", "Tour Guide", "Adventure Tourism Operator"], "growth_outlook": "growing"},
   {"industry": "Journalism", "roles": ["Foreign Correspondent", "Documentary Filmmaker", "Investigative Reporter"], "growth_outlook": "stable"},
   {"industry": "Entrepreneurship", "roles": ["Startup Founder", "Venture Scout", "Business Developer"], "growth_outlook": "growing"}]',
 ARRAY['Travel & Tourism', 'Journalism', 'Entrepreneurship', 'Research', 'Military'],
 ARRAY['Adaptability', 'Curiosity', 'Risk assessment', 'Cross-cultural navigation'],
 ARRAY['Long-term commitment', 'Routine tasks'],
 'Your courage to explore opens doors for everyone. You show us that the world is full of wonders.',
 'Plan varied experiences, encourage safe risk-taking, and discuss lessons from setbacks.'),

('connector', 'The Connector', 'Natural networkers who build bridges between people and ideas. They see potential in others and bring out the best in everyone.', 'users', '#26A69A', '#80CBC4',
 '{"empathy": 0.25, "verbal": 0.25, "cooperation": 0.2, "risk_tolerance": 0.15, "emotional_regulation": 0.15}',
 '[{"industry": "Sales", "roles": ["Account Executive", "Business Development", "Sales Manager"], "growth_outlook": "stable"},
   {"industry": "Human Resources", "roles": ["Recruiter", "HR Business Partner", "Talent Acquisition Director"], "growth_outlook": "growing"},
   {"industry": "Community Development", "roles": ["Community Organizer", "Program Director", "Volunteer Coordinator"], "growth_outlook": "growing"}]',
 ARRAY['Sales', 'Human Resources', 'Community Development', 'Recruiting', 'Public Relations'],
 ARRAY['Relationship building', 'Influence', 'Network thinking', 'Talent recognition'],
 ARRAY['Deep solo work', 'Handling rejection'],
 'You have a special gift for seeing the best in people and bringing them together.',
 'Facilitate playdates, encourage introducing friends to each other, and discuss relationship dynamics.'),

('guardian', 'The Guardian', 'Protectors who combine strength with compassion. They stand up for what is right and create safety for those around them.', 'shield', '#42A5F5', '#90CAF9',
 '{"cooperation": 0.25, "failure_resilience": 0.25, "emotional_regulation": 0.2, "empathy": 0.15, "logic": 0.15}',
 '[{"industry": "Public Safety", "roles": ["Police Officer", "Firefighter", "Emergency Medical Technician"], "growth_outlook": "stable"},
   {"industry": "Military", "roles": ["Military Officer", "Security Specialist", "Intelligence Analyst"], "growth_outlook": "stable"},
   {"industry": "Law", "roles": ["Attorney", "Judge", "Legal Advocate"], "growth_outlook": "stable"}]',
 ARRAY['Public Safety', 'Military', 'Law', 'Security', 'Emergency Services'],
 ARRAY['Courage under pressure', 'Moral clarity', 'Physical and emotional resilience', 'Protective instincts'],
 ARRAY['Flexibility with rules', 'Accepting shades of gray'],
 'You have the heart of a hero. Your strength protects those who need it most.',
 'Discuss ethics and fairness, encourage physical activities, and praise standing up for others appropriately.');

-- ==================== SAMPLE OPPORTUNITY DATA (DORAL, FL) ====================

INSERT INTO public.opportunity_indices (zip_code, state_code, city, opportunity_index, key_industries, local_grants, risk_factors, growth_trends, school_quality_score, internet_access_score, food_access_score, median_income, data_source) VALUES
('33178', 'FL', 'Doral', 0.85,
 ARRAY['Import/Export', 'Logistics', 'Hospitality', 'Technology', 'Retail'],
 '[{"name": "Mom & Pop Grant (District 12)", "description": "Small business grant for family-owned businesses", "eligibility": "Doral residents, family business", "url": "https://www.miamidade.gov/grants"},
   {"name": "Children''s Trust Innovation Grant", "description": "Funding for innovative early childhood programs", "eligibility": "501(c)(3) organizations serving children 0-18", "url": "https://www.thechildrenstrust.org"},
   {"name": "CareerSource STEM Grant", "description": "Training funds for STEM career pathways", "eligibility": "Miami-Dade residents seeking STEM training", "url": "https://careersourcesfl.com"}]',
 ARRAY['High Cost of Living', 'Competition', 'Hurricane Risk'],
 '{"Technology": 0.15, "Logistics": 0.08, "Hospitality": 0.05, "Healthcare": 0.12, "Import/Export": 0.06}',
 8.2, 0.95, 0.88, 72500, 'census_acs_2023'),

('33122', 'FL', 'Doral', 0.82,
 ARRAY['Logistics', 'Warehousing', 'Import/Export', 'Manufacturing', 'Transportation'],
 '[{"name": "Miami-Dade Workforce Development", "description": "Job training and placement services", "eligibility": "Miami-Dade County residents", "url": "https://www.miamidade.gov/workforce"}]',
 ARRAY['High Cost of Living', 'Traffic Congestion'],
 '{"Logistics": 0.10, "Warehousing": 0.08, "Manufacturing": 0.03, "Transportation": 0.07}',
 7.8, 0.92, 0.85, 68000, 'census_acs_2023'),

('33166', 'FL', 'Doral', 0.80,
 ARRAY['Aviation', 'Logistics', 'Hospitality', 'Retail', 'Food Service'],
 '[{"name": "Airport Area Enterprise Zone", "description": "Tax incentives for businesses near MIA", "eligibility": "Businesses within enterprise zone", "url": "https://www.miami-airport.com/business"}]',
 ARRAY['Airport Noise', 'High Traffic'],
 '{"Aviation": 0.04, "Logistics": 0.09, "Hospitality": 0.06, "Food Service": 0.05}',
 7.5, 0.90, 0.82, 62000, 'census_acs_2023');
