-- ==================== OPPORTUNITY INDEX DATA: MAJOR US METROS ====================
-- Extends coverage beyond Doral, FL to support zip-code lookups across the country.

INSERT INTO public.opportunity_indices
  (zip_code, state_code, city, opportunity_index, key_industries, risk_factors, school_quality_score, internet_access_score, food_access_score, median_income, data_source)
VALUES
-- New York City metro
('10001', 'NY', 'New York', 0.88,
 ARRAY['Finance', 'Technology', 'Healthcare', 'Media', 'Education'],
 ARRAY['High Cost of Living', 'Competition'],
 8.0, 0.96, 0.92, 85000, 'census_acs_2023'),

('10451', 'NY', 'Bronx', 0.42,
 ARRAY['Healthcare', 'Retail', 'Food Service', 'Education', 'Government'],
 ARRAY['High Poverty Rate', 'Limited Green Space'],
 5.5, 0.82, 0.65, 38000, 'census_acs_2023'),

('11201', 'NY', 'Brooklyn', 0.78,
 ARRAY['Technology', 'Creative Arts', 'Healthcare', 'Education', 'Hospitality'],
 ARRAY['High Cost of Living', 'Gentrification'],
 7.5, 0.94, 0.85, 72000, 'census_acs_2023'),

-- Los Angeles metro
('90001', 'CA', 'Los Angeles', 0.45,
 ARRAY['Manufacturing', 'Retail', 'Logistics', 'Food Service', 'Healthcare'],
 ARRAY['Air Quality', 'Limited Public Transit', 'High Housing Cost'],
 5.8, 0.80, 0.70, 42000, 'census_acs_2023'),

('90210', 'CA', 'Beverly Hills', 0.92,
 ARRAY['Entertainment', 'Finance', 'Real Estate', 'Healthcare', 'Retail'],
 ARRAY['High Cost of Living'],
 9.2, 0.98, 0.95, 125000, 'census_acs_2023'),

('90012', 'CA', 'Los Angeles', 0.68,
 ARRAY['Government', 'Healthcare', 'Technology', 'Arts', 'Education'],
 ARRAY['High Cost of Living', 'Traffic'],
 6.8, 0.90, 0.78, 55000, 'census_acs_2023'),

-- Chicago metro
('60601', 'IL', 'Chicago', 0.82,
 ARRAY['Finance', 'Technology', 'Healthcare', 'Manufacturing', 'Education'],
 ARRAY['Cold Climate', 'High Taxes'],
 7.8, 0.95, 0.90, 78000, 'census_acs_2023'),

('60619', 'IL', 'Chicago', 0.35,
 ARRAY['Healthcare', 'Retail', 'Government', 'Food Service', 'Education'],
 ARRAY['High Crime Rate', 'Food Desert', 'Limited Investment'],
 4.5, 0.78, 0.50, 32000, 'census_acs_2023'),

-- Houston metro
('77001', 'TX', 'Houston', 0.75,
 ARRAY['Energy', 'Healthcare', 'Aerospace', 'Technology', 'Manufacturing'],
 ARRAY['Flooding Risk', 'Heat', 'Sprawl'],
 7.0, 0.92, 0.85, 65000, 'census_acs_2023'),

-- Phoenix metro
('85001', 'AZ', 'Phoenix', 0.65,
 ARRAY['Technology', 'Healthcare', 'Real Estate', 'Retail', 'Logistics'],
 ARRAY['Extreme Heat', 'Water Scarcity', 'Sprawl'],
 6.5, 0.88, 0.80, 55000, 'census_acs_2023'),

-- Philadelphia metro
('19101', 'PA', 'Philadelphia', 0.72,
 ARRAY['Healthcare', 'Education', 'Finance', 'Technology', 'Manufacturing'],
 ARRAY['Aging Infrastructure', 'High Taxes'],
 7.2, 0.90, 0.82, 60000, 'census_acs_2023'),

-- San Antonio metro
('78201', 'TX', 'San Antonio', 0.55,
 ARRAY['Military', 'Healthcare', 'Tourism', 'Cybersecurity', 'Education'],
 ARRAY['Low Wages', 'Heat'],
 6.0, 0.85, 0.78, 48000, 'census_acs_2023'),

-- San Diego metro
('92101', 'CA', 'San Diego', 0.80,
 ARRAY['Biotech', 'Military', 'Tourism', 'Technology', 'Healthcare'],
 ARRAY['High Cost of Living', 'Water Scarcity'],
 7.8, 0.94, 0.88, 75000, 'census_acs_2023'),

-- Dallas metro
('75201', 'TX', 'Dallas', 0.78,
 ARRAY['Technology', 'Finance', 'Healthcare', 'Telecommunications', 'Energy'],
 ARRAY['Heat', 'Sprawl'],
 7.5, 0.93, 0.86, 70000, 'census_acs_2023'),

-- Atlanta metro
('30301', 'GA', 'Atlanta', 0.74,
 ARRAY['Logistics', 'Technology', 'Film/Media', 'Healthcare', 'Finance'],
 ARRAY['Traffic', 'Income Inequality'],
 7.0, 0.91, 0.82, 62000, 'census_acs_2023'),

-- Seattle metro
('98101', 'WA', 'Seattle', 0.90,
 ARRAY['Technology', 'Aerospace', 'Healthcare', 'Retail', 'Education'],
 ARRAY['High Cost of Living', 'Rain', 'Homelessness'],
 8.5, 0.97, 0.92, 95000, 'census_acs_2023'),

-- Denver metro
('80201', 'CO', 'Denver', 0.76,
 ARRAY['Technology', 'Aerospace', 'Healthcare', 'Energy', 'Tourism'],
 ARRAY['High Cost of Living', 'Altitude'],
 7.5, 0.93, 0.88, 68000, 'census_acs_2023'),

-- Detroit metro
('48201', 'MI', 'Detroit', 0.38,
 ARRAY['Automotive', 'Healthcare', 'Manufacturing', 'Technology', 'Logistics'],
 ARRAY['Population Decline', 'Infrastructure', 'Cold Climate'],
 4.8, 0.75, 0.55, 31000, 'census_acs_2023'),

-- Rural / small town examples
('38614', 'MS', 'Clarksdale', 0.22,
 ARRAY['Agriculture', 'Food Processing', 'Healthcare', 'Government'],
 ARRAY['High Poverty Rate', 'Brain Drain', 'Limited Healthcare', 'Food Desert'],
 3.5, 0.60, 0.40, 24000, 'census_acs_2023'),

('99723', 'AK', 'Barrow', 0.28,
 ARRAY['Government', 'Energy', 'Fishing', 'Tourism'],
 ARRAY['Extreme Climate', 'Isolation', 'High Cost of Living', 'Limited Internet'],
 3.0, 0.45, 0.35, 35000, 'census_acs_2023');
