-- Seed Data: Behavioral Scenarios & Cognitive Test Items
-- Migration: 00003_seed_scenarios_and_items.sql
-- Populates the item banks required for Mosaic Protocol assessments

-- ==================== BEHAVIORAL SCENARIOS ====================

-- 1. SHARING SCENARIO (ages 3-6)
INSERT INTO public.behavioral_scenarios (scenario_type, title, description, story_content, choices, min_age_months, max_age_months, estimated_duration_seconds, difficulty_level, emotional_dimensions) VALUES
('sharing', 'The Treasure Chest', 'A magical adventure where you find treasure and must decide how to share it.',
 '{"narrative": "You are an explorer in a magical forest. You discover a treasure chest filled with sparkling gems! But your friend Bunny helped you find the way here.", "characters": [{"name": "Explorer", "role": "player"}, {"name": "Bunny", "role": "friend"}], "setting": "enchanted_forest", "segments": [{"id": "intro", "text": "You open the treasure chest and count 6 beautiful gems inside!", "next": "choice_1"}, {"id": "after_choice_1", "text": "Bunny smiles and thanks you. Then you notice there are more gems hidden under a leaf!", "next": "choice_2"}, {"id": "ending", "text": "What a wonderful adventure! You and Bunny head home together."}]}',
 '[
   {"id": "choice_1", "prompt": "How many gems do you give to Bunny?", "options": [
     {"id": "share_equal", "label": "Give Bunny 3 gems (half)", "dimension_scores": {"empathy": 0.8, "cooperation": 0.9}, "feedback": "You split the treasure fairly! Bunny is so happy!", "next_segment_id": "after_choice_1"},
     {"id": "share_most", "label": "Give Bunny 4 gems (more than half)", "dimension_scores": {"empathy": 1.0, "cooperation": 0.8}, "feedback": "How generous! Bunny is overjoyed!", "next_segment_id": "after_choice_1"},
     {"id": "share_few", "label": "Give Bunny 1 gem", "dimension_scores": {"empathy": 0.3, "cooperation": 0.3}, "feedback": "Bunny takes the gem quietly.", "next_segment_id": "after_choice_1"},
     {"id": "share_none", "label": "Keep all the gems", "dimension_scores": {"empathy": 0.1, "cooperation": 0.1}, "feedback": "Bunny looks a little sad.", "next_segment_id": "after_choice_1"}
   ]},
   {"id": "choice_2", "prompt": "You found 2 more hidden gems! What do you do?", "options": [
     {"id": "share_extra", "label": "Give both to Bunny as a surprise", "dimension_scores": {"empathy": 1.0, "cooperation": 0.7}, "feedback": "Bunny''s eyes light up with surprise and joy!", "next_segment_id": "ending"},
     {"id": "split_extra", "label": "Share one with Bunny", "dimension_scores": {"empathy": 0.7, "cooperation": 0.8}, "feedback": "One for you, one for Bunny. Fair and square!", "next_segment_id": "ending"},
     {"id": "keep_extra", "label": "Hide them in your pocket", "dimension_scores": {"empathy": 0.2, "cooperation": 0.2}, "feedback": "You secretly keep the extra gems.", "next_segment_id": "ending"}
   ]}
 ]',
 36, 72, 120, 2, ARRAY['empathy', 'cooperation']::emotional_dimension[]),

-- 2. DELAYED GRATIFICATION SCENARIO (ages 3-6)
('delayed_gratification', 'The Magic Garden', 'Plant seeds and choose between instant small rewards or waiting for bigger ones.',
 '{"narrative": "Welcome to the Magic Garden! Here, seeds grow into wonderful things. You have a special seed to plant!", "characters": [{"name": "Gardener", "role": "player"}, {"name": "Wise Owl", "role": "guide"}], "setting": "magic_garden", "segments": [{"id": "intro", "text": "Wise Owl says: You can pick one small flower right now, OR plant your seed and wait to get a whole bouquet tomorrow!", "next": "choice_1"}, {"id": "after_wait", "text": "The next day, your seed has grown into 5 beautiful flowers! Wise Owl has another offer...", "next": "choice_2"}, {"id": "after_now", "text": "You pick the small flower. It''s pretty! Wise Owl has another offer for you...", "next": "choice_2"}, {"id": "ending", "text": "What a magical day in the garden!"}]}',
 '[
   {"id": "choice_1", "prompt": "What do you choose?", "options": [
     {"id": "wait_big", "label": "Plant the seed and wait for the bouquet", "dimension_scores": {"delayed_gratification": 1.0, "emotional_regulation": 0.8}, "feedback": "Great patience! Let''s see what grows!", "next_segment_id": "after_wait"},
     {"id": "take_now", "label": "Pick the small flower right now", "dimension_scores": {"delayed_gratification": 0.2, "emotional_regulation": 0.3}, "feedback": "You got a pretty flower right away!", "next_segment_id": "after_now"}
   ]},
   {"id": "choice_2", "prompt": "Wise Owl offers: Take 1 cookie now, or wait until after lunch for 3 cookies?", "options": [
     {"id": "wait_cookies", "label": "Wait until after lunch for 3 cookies", "dimension_scores": {"delayed_gratification": 1.0, "emotional_regulation": 0.9}, "feedback": "After lunch, you enjoy 3 delicious cookies!", "next_segment_id": "ending"},
     {"id": "one_cookie", "label": "Take 1 cookie now", "dimension_scores": {"delayed_gratification": 0.2, "emotional_regulation": 0.3}, "feedback": "Mmm, that cookie is tasty!", "next_segment_id": "ending"}
   ]}
 ]',
 36, 72, 90, 2, ARRAY['delayed_gratification', 'emotional_regulation']::emotional_dimension[]),

-- 3. FAILURE RECOVERY SCENARIO (ages 3-7)
('failure_recovery', 'The Tower Challenge', 'Build a tower that falls down and decide how to respond.',
 '{"narrative": "You are building the tallest tower in the kingdom! You''ve been stacking blocks all morning.", "characters": [{"name": "Builder", "role": "player"}, {"name": "Fox", "role": "friend"}], "setting": "building_workshop", "segments": [{"id": "intro", "text": "Oh no! A gust of wind knocks your tower down! All your hard work...", "next": "choice_1"}, {"id": "after_choice_1", "text": "Fox comes over and sees what happened. Fox offers to help you build again.", "next": "choice_2"}, {"id": "ending", "text": "You learned something important today about never giving up!"}]}',
 '[
   {"id": "choice_1", "prompt": "Your tower fell down! How do you feel?", "options": [
     {"id": "try_again", "label": "Take a deep breath and start rebuilding", "dimension_scores": {"failure_resilience": 1.0, "emotional_regulation": 0.9}, "feedback": "That''s the spirit! You dust yourself off and start again.", "next_segment_id": "after_choice_1"},
     {"id": "upset_then_try", "label": "Feel sad for a moment, then try again", "dimension_scores": {"failure_resilience": 0.7, "emotional_regulation": 0.7}, "feedback": "It''s okay to feel sad. You take a moment, then get back to work.", "next_segment_id": "after_choice_1"},
     {"id": "give_up", "label": "Walk away and do something else", "dimension_scores": {"failure_resilience": 0.2, "emotional_regulation": 0.4}, "feedback": "Sometimes things feel too hard. Maybe you''ll come back later.", "next_segment_id": "after_choice_1"},
     {"id": "angry", "label": "Kick the remaining blocks", "dimension_scores": {"failure_resilience": 0.1, "emotional_regulation": 0.1}, "feedback": "You feel really frustrated right now.", "next_segment_id": "after_choice_1"}
   ]},
   {"id": "choice_2", "prompt": "Fox wants to help rebuild. What do you do?", "options": [
     {"id": "accept_help", "label": "Build together with Fox", "dimension_scores": {"failure_resilience": 0.8, "cooperation": 0.9}, "feedback": "Together you build an even better tower!", "next_segment_id": "ending"},
     {"id": "do_alone", "label": "Say thanks but build it yourself", "dimension_scores": {"failure_resilience": 0.9, "cooperation": 0.4}, "feedback": "You rebuild it on your own. It feels great!", "next_segment_id": "ending"},
     {"id": "decline_all", "label": "Say you don''t want to build anymore", "dimension_scores": {"failure_resilience": 0.2, "cooperation": 0.3}, "feedback": "Fox looks disappointed but understands.", "next_segment_id": "ending"}
   ]}
 ]',
 36, 84, 120, 3, ARRAY['failure_resilience', 'emotional_regulation']::emotional_dimension[]),

-- 4. EMPATHY RESPONSE SCENARIO (ages 3-6)
('empathy_response', 'The Rainy Day Friend', 'A friend is sad and needs comfort on a rainy day.',
 '{"narrative": "It''s a rainy day at school. During recess, you notice your classmate Duckling sitting alone and looking sad.", "characters": [{"name": "You", "role": "player"}, {"name": "Duckling", "role": "sad_friend"}, {"name": "Teacher Bear", "role": "teacher"}], "setting": "school_playground", "segments": [{"id": "intro", "text": "Duckling is sitting under the tree with tears in their eyes. They dropped their favorite toy in a puddle.", "next": "choice_1"}, {"id": "after_choice_1", "text": "Duckling tells you they also miss their mommy today. They look like they need a friend.", "next": "choice_2"}, {"id": "ending", "text": "Duckling says ''Thank you for being my friend today.''"}]}',
 '[
   {"id": "choice_1", "prompt": "You see Duckling is sad about their toy. What do you do?", "options": [
     {"id": "help_toy", "label": "Help pick up the toy and dry it off", "dimension_scores": {"empathy": 1.0, "cooperation": 0.7}, "feedback": "You carefully pick up the toy and wipe it clean. Duckling starts to smile.", "next_segment_id": "after_choice_1"},
     {"id": "comfort_words", "label": "Sit next to Duckling and say ''It''s okay''", "dimension_scores": {"empathy": 0.8, "cooperation": 0.5}, "feedback": "Your kind words make Duckling feel a little better.", "next_segment_id": "after_choice_1"},
     {"id": "tell_teacher", "label": "Go tell Teacher Bear that Duckling is sad", "dimension_scores": {"empathy": 0.5, "cooperation": 0.6}, "feedback": "Teacher Bear comes over to check on Duckling.", "next_segment_id": "after_choice_1"},
     {"id": "ignore", "label": "Keep playing by yourself", "dimension_scores": {"empathy": 0.1, "cooperation": 0.1}, "feedback": "You continue playing while Duckling sits alone.", "next_segment_id": "after_choice_1"}
   ]},
   {"id": "choice_2", "prompt": "Duckling misses their mommy. How do you help?", "options": [
     {"id": "stay_with", "label": "Stay and play together until mommy comes", "dimension_scores": {"empathy": 1.0, "cooperation": 0.8}, "feedback": "You and Duckling play together and have fun!", "next_segment_id": "ending"},
     {"id": "share_snack", "label": "Share your snack to cheer Duckling up", "dimension_scores": {"empathy": 0.9, "cooperation": 0.7}, "feedback": "Duckling smiles while eating the snack with you.", "next_segment_id": "ending"},
     {"id": "say_bye", "label": "Say ''Your mommy will come soon'' and leave", "dimension_scores": {"empathy": 0.4, "cooperation": 0.3}, "feedback": "Duckling nods but still looks lonely.", "next_segment_id": "ending"}
   ]}
 ]',
 36, 72, 100, 2, ARRAY['empathy', 'cooperation']::emotional_dimension[]),

-- 5. RISK ASSESSMENT SCENARIO (ages 4-7)
('risk_assessment', 'The Mountain Path', 'Choose between safe and risky paths on a mountain adventure.',
 '{"narrative": "You and your friend Goat are hiking up Magic Mountain to find the legendary Crystal Cave!", "characters": [{"name": "Hiker", "role": "player"}, {"name": "Goat", "role": "friend"}], "setting": "mountain_trail", "segments": [{"id": "intro", "text": "You reach a fork in the path. The left path is safe and flat but takes longer. The right path is steep and has a wobbly bridge, but it''s much shorter!", "next": "choice_1"}, {"id": "after_safe", "text": "You arrive at the cave safely! Inside, there''s a second chamber behind a narrow gap.", "next": "choice_2"}, {"id": "after_risky", "text": "The bridge wobbles but you make it across! You arrive at the cave quickly. Inside, there''s a second chamber behind a narrow gap.", "next": "choice_2"}, {"id": "ending", "text": "What an adventure on Magic Mountain!"}]}',
 '[
   {"id": "choice_1", "prompt": "Which path do you take?", "options": [
     {"id": "safe_path", "label": "Take the safe, longer path", "dimension_scores": {"risk_tolerance": 0.2, "delayed_gratification": 0.8}, "feedback": "You enjoy the scenic route and arrive safely!", "next_segment_id": "after_safe"},
     {"id": "risky_path", "label": "Take the steep path with the wobbly bridge", "dimension_scores": {"risk_tolerance": 0.9, "delayed_gratification": 0.3}, "feedback": "It''s exciting! Your heart races as you cross the bridge!", "next_segment_id": "after_risky"},
     {"id": "ask_goat", "label": "Ask Goat which way is better", "dimension_scores": {"risk_tolerance": 0.5, "cooperation": 0.7}, "feedback": "Goat says both paths lead to the cave. You decide together!", "next_segment_id": "after_safe"}
   ]},
   {"id": "choice_2", "prompt": "The second chamber might have more crystals, but the gap is tight. What do you do?", "options": [
     {"id": "squeeze_through", "label": "Squeeze through the narrow gap to explore", "dimension_scores": {"risk_tolerance": 0.9, "failure_resilience": 0.6}, "feedback": "You find amazing crystals on the other side!", "next_segment_id": "ending"},
     {"id": "stay_safe", "label": "Stay in the main chamber - it''s beautiful enough", "dimension_scores": {"risk_tolerance": 0.2, "emotional_regulation": 0.7}, "feedback": "The main chamber has plenty of sparkling crystals!", "next_segment_id": "ending"},
     {"id": "send_goat", "label": "Ask Goat to check if it''s safe first", "dimension_scores": {"risk_tolerance": 0.5, "cooperation": 0.5}, "feedback": "Goat peeks through and says it''s safe. You both go in!", "next_segment_id": "ending"}
   ]}
 ]',
 48, 84, 110, 3, ARRAY['risk_tolerance', 'delayed_gratification']::emotional_dimension[]),

-- 6. COOPERATION SCENARIO (ages 3-7)
('cooperation', 'The Big Cleanup', 'Work together (or alone) to clean up the messy playroom.',
 '{"narrative": "Oh my! The playroom is a huge mess after a big party! There are toys everywhere, spilled juice, and crumpled paper all over the floor.", "characters": [{"name": "You", "role": "player"}, {"name": "Cat", "role": "friend"}, {"name": "Dog", "role": "friend"}], "setting": "messy_playroom", "segments": [{"id": "intro", "text": "Cat and Dog are here too. The mess is too big for one person! How should you tackle this?", "next": "choice_1"}, {"id": "after_choice_1", "text": "The playroom is starting to look better! But there''s still a big stain on the rug that''s hard to clean.", "next": "choice_2"}, {"id": "ending", "text": "The playroom looks amazing! Great teamwork!"}]}',
 '[
   {"id": "choice_1", "prompt": "How do you want to clean up?", "options": [
     {"id": "team_plan", "label": "Make a plan: each person cleans a section", "dimension_scores": {"cooperation": 1.0, "emotional_regulation": 0.7}, "feedback": "Great idea! Cat picks up toys, Dog cleans spills, and you collect paper!", "next_segment_id": "after_choice_1"},
     {"id": "all_together", "label": "Everyone cleans everything together", "dimension_scores": {"cooperation": 0.8, "empathy": 0.6}, "feedback": "You all work side by side! It''s a bit chaotic but fun!", "next_segment_id": "after_choice_1"},
     {"id": "do_alone", "label": "Say ''I''ll do it myself''", "dimension_scores": {"cooperation": 0.2, "failure_resilience": 0.5}, "feedback": "You start cleaning alone. It''s a lot of work!", "next_segment_id": "after_choice_1"},
     {"id": "boss_around", "label": "Tell Cat and Dog exactly what to do", "dimension_scores": {"cooperation": 0.4, "emotional_regulation": 0.3}, "feedback": "Cat and Dog follow your orders but don''t look happy.", "next_segment_id": "after_choice_1"}
   ]},
   {"id": "choice_2", "prompt": "The rug stain is really tough. What do you do?", "options": [
     {"id": "work_together", "label": "All scrub together - teamwork!", "dimension_scores": {"cooperation": 1.0, "failure_resilience": 0.7}, "feedback": "Three scrubbers are better than one! The stain comes out!", "next_segment_id": "ending"},
     {"id": "get_help", "label": "Ask a grown-up for help with this part", "dimension_scores": {"cooperation": 0.6, "emotional_regulation": 0.8}, "feedback": "Smart thinking! Sometimes it''s good to ask for help.", "next_segment_id": "ending"},
     {"id": "cover_it", "label": "Put a rug over it and pretend it''s clean", "dimension_scores": {"cooperation": 0.3, "delayed_gratification": 0.1}, "feedback": "The stain is hidden... for now.", "next_segment_id": "ending"}
   ]}
 ]',
 36, 84, 120, 2, ARRAY['cooperation', 'emotional_regulation']::emotional_dimension[]);


-- ==================== COGNITIVE TEST ITEMS ====================

-- MATH DOMAIN - Easy items (ages 3-4, difficulty -2 to -1)
INSERT INTO public.cognitive_test_items (domain, difficulty, discrimination, guessing, min_age_months, max_age_months, content, instructions, tags) VALUES
('math', -2.00, 1.2, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "How many apples are here? 🍎🍎🍎", "options": ["2", "3", "4", "5"], "correct_answer": "3", "images": ["three_apples"], "feedback": {"correct": "Yes! There are 3 apples!", "incorrect": "Let''s count together: 1, 2, 3! There are 3 apples."}}',
 'Count the apples on the screen and tap the right number.', ARRAY['counting', 'numbers']),

('math', -1.50, 1.0, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "Which group has MORE stars? ⭐⭐ or ⭐⭐⭐⭐", "options": ["The first group (2 stars)", "The second group (4 stars)", "They are the same"], "correct_answer": "The second group (4 stars)", "feedback": {"correct": "Right! 4 stars is more than 2 stars!", "incorrect": "Let''s count: the first group has 2, the second has 4. 4 is more!"}}',
 'Look at both groups and pick which one has more.', ARRAY['comparison', 'more_less']),

-- MATH DOMAIN - Medium items (ages 4-6, difficulty -0.5 to 0.5)
('math', -0.50, 1.5, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "You have 3 cookies and get 2 more. How many do you have now?", "options": ["3", "4", "5", "6"], "correct_answer": "5", "feedback": {"correct": "Yes! 3 + 2 = 5 cookies!", "incorrect": "Let''s count: 3 cookies, then 4, 5! You have 5 cookies."}}',
 'Listen to the story and figure out the answer.', ARRAY['addition', 'word_problem']),

('math', 0.00, 1.3, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "What number comes next? 2, 4, 6, __", "options": ["7", "8", "9", "10"], "correct_answer": "8", "feedback": {"correct": "Great! The pattern is counting by 2s: 2, 4, 6, 8!", "incorrect": "We''re counting by 2s: 2, 4, 6... the next one is 8!"}}',
 'Find the pattern and pick the next number.', ARRAY['patterns', 'sequences']),

-- MATH DOMAIN - Hard items (ages 5-8, difficulty 0.5 to 2)
('math', 1.00, 1.8, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "You have 8 grapes and eat 3. Then your friend gives you 2 more. How many grapes do you have?", "options": ["5", "6", "7", "8"], "correct_answer": "7", "feedback": {"correct": "Yes! 8 - 3 = 5, then 5 + 2 = 7!", "incorrect": "Start with 8, take away 3 to get 5, then add 2 more to get 7."}}',
 'Listen carefully and solve the two-step problem.', ARRAY['addition', 'subtraction', 'multi_step']),

('math', 1.50, 1.6, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "If you share 12 stickers equally between 3 friends, how many does each friend get?", "options": ["3", "4", "5", "6"], "correct_answer": "4", "feedback": {"correct": "Right! 12 ÷ 3 = 4 stickers each!", "incorrect": "Let''s deal them out: 1 each, 2 each, 3 each, 4 each - they all get 4!"}}',
 'Figure out how to share equally.', ARRAY['division', 'sharing', 'equal_groups']),


-- LOGIC DOMAIN - Easy items
('logic', -2.00, 1.0, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "Which one does NOT belong? 🐱 🐶 🐰 🚗", "options": ["Cat", "Dog", "Bunny", "Car"], "correct_answer": "Car", "feedback": {"correct": "Right! The car is not an animal like the others!", "incorrect": "Cat, Dog, and Bunny are all animals. The car is different!"}}',
 'Find the one that is different from the others.', ARRAY['categorization', 'odd_one_out']),

('logic', -1.00, 1.3, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "What comes next? 🔴🔵🔴🔵🔴__", "options": ["🔴 Red", "🔵 Blue", "🟢 Green", "🟡 Yellow"], "correct_answer": "🔵 Blue", "feedback": {"correct": "Yes! The pattern is red, blue, red, blue... so blue comes next!", "incorrect": "Look at the pattern: red, blue, red, blue, red... what comes after red?"}}',
 'Look at the pattern and pick what comes next.', ARRAY['patterns', 'sequences']),

-- LOGIC DOMAIN - Medium items
('logic', 0.00, 1.5, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "Sam is taller than Mia. Mia is taller than Leo. Who is the shortest?", "options": ["Sam", "Mia", "Leo", "They are all the same"], "correct_answer": "Leo", "feedback": {"correct": "Yes! Sam > Mia > Leo, so Leo is the shortest!", "incorrect": "Sam is tallest, then Mia, then Leo. Leo is the shortest."}}',
 'Think about who is taller and shorter.', ARRAY['reasoning', 'comparison', 'transitive']),

('logic', 0.50, 1.4, 0.25, 48, 84,
 '{"type": "multiple_choice", "prompt": "If all birds can fly, and a robin is a bird, can a robin fly?", "options": ["Yes", "No", "Maybe", "Only sometimes"], "correct_answer": "Yes", "feedback": {"correct": "Yes! If all birds can fly and a robin is a bird, then a robin can fly!", "incorrect": "All birds can fly. A robin is a bird. So a robin can fly!"}}',
 'Use the clues to figure out the answer.', ARRAY['deductive_reasoning', 'syllogism']),

-- LOGIC DOMAIN - Hard items
('logic', 1.50, 1.7, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "Look at this pattern: 1, 1, 2, 3, 5, __. What comes next?", "options": ["6", "7", "8", "10"], "correct_answer": "8", "feedback": {"correct": "Yes! Each number is the sum of the two before it: 3+5=8!", "incorrect": "The pattern adds the last two numbers: 1+1=2, 1+2=3, 2+3=5, 3+5=8."}}',
 'Find the hidden rule in the number pattern.', ARRAY['patterns', 'fibonacci', 'advanced']),


-- VERBAL DOMAIN - Easy items
('verbal', -2.00, 1.1, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "What do you wear on your feet?", "options": ["Hat", "Shoes", "Gloves", "Scarf"], "correct_answer": "Shoes", "feedback": {"correct": "Yes! We wear shoes on our feet!", "incorrect": "We wear shoes on our feet! A hat goes on your head."}}',
 'Pick the right answer.', ARRAY['vocabulary', 'body_parts', 'clothing']),

('verbal', -1.50, 1.0, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "The opposite of ''hot'' is:", "options": ["Warm", "Cold", "Big", "Fast"], "correct_answer": "Cold", "feedback": {"correct": "Right! Cold is the opposite of hot!", "incorrect": "Hot and cold are opposites, like up and down."}}',
 'Find the word that means the opposite.', ARRAY['opposites', 'vocabulary']),

-- VERBAL DOMAIN - Medium items
('verbal', 0.00, 1.4, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "''The cat sat on the mat.'' What did the cat sit on?", "options": ["A chair", "A mat", "A bed", "The floor"], "correct_answer": "A mat", "feedback": {"correct": "Yes! The cat sat on the mat!", "incorrect": "Listen again: The cat sat on the MAT."}}',
 'Listen to the sentence and answer the question.', ARRAY['comprehension', 'listening']),

('verbal', 0.50, 1.5, 0.25, 48, 84,
 '{"type": "multiple_choice", "prompt": "Which word rhymes with ''cat''?", "options": ["Dog", "Hat", "Cup", "Sun"], "correct_answer": "Hat", "feedback": {"correct": "Yes! Cat and hat both end with -at!", "incorrect": "Cat and hat rhyme because they both end with the -at sound."}}',
 'Find the word that sounds like the first word.', ARRAY['rhyming', 'phonics']),

-- VERBAL DOMAIN - Hard items
('verbal', 1.00, 1.6, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "Choose the word that best completes: ''The sky was dark and cloudy. It looked like it was going to __.''", "options": ["Rain", "Shine", "Snow", "Melt"], "correct_answer": "Rain", "feedback": {"correct": "Yes! Dark cloudy skies usually mean rain is coming!", "incorrect": "When the sky is dark and cloudy, it usually means rain."}}',
 'Pick the word that makes the most sense.', ARRAY['context_clues', 'prediction', 'comprehension']),


-- SPATIAL DOMAIN - Easy items
('spatial', -2.00, 1.0, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "Which shape is a circle? ⬜ 🔺 ⭕ ⬟", "options": ["Square", "Triangle", "Circle", "Pentagon"], "correct_answer": "Circle", "feedback": {"correct": "Yes! The circle is round with no corners!", "incorrect": "A circle is the round shape with no corners or edges."}}',
 'Find the circle.', ARRAY['shapes', 'identification']),

('spatial', -1.00, 1.2, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "If you turn a square a little bit, what shape is it still?", "options": ["A circle", "A triangle", "Still a square", "A rectangle"], "correct_answer": "Still a square", "feedback": {"correct": "Yes! A square is still a square even when you turn it!", "incorrect": "Turning a shape doesn''t change what it is. It''s still a square!"}}',
 'Think about what happens when you rotate the shape.', ARRAY['rotation', 'shape_constancy']),

-- SPATIAL DOMAIN - Medium items
('spatial', 0.00, 1.4, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "If you fold a piece of paper in half and cut a triangle from the folded edge, what shape do you see when you unfold it?", "options": ["A triangle", "A diamond", "A circle", "A heart"], "correct_answer": "A diamond", "feedback": {"correct": "Yes! Cutting a triangle on the fold makes a diamond shape!", "incorrect": "When you cut a triangle on the fold, both halves mirror each other, making a diamond!"}}',
 'Imagine folding and cutting the paper.', ARRAY['mental_folding', 'symmetry']),

-- SPATIAL DOMAIN - Hard items
('spatial', 1.00, 1.6, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "You are facing North. You turn right. Then you turn right again. Which direction are you facing?", "options": ["North", "South", "East", "West"], "correct_answer": "South", "feedback": {"correct": "Right! North → turn right = East → turn right = South!", "incorrect": "Start at North: one right turn = East, another right turn = South."}}',
 'Imagine turning and figure out which way you face.', ARRAY['directions', 'mental_rotation']),


-- MEMORY DOMAIN - Easy items
('memory', -2.00, 1.0, 0.25, 36, 60,
 '{"type": "multiple_choice", "prompt": "I showed you 3 animals: Dog, Cat, Bird. Which one was NOT in the group?", "options": ["Dog", "Fish", "Cat", "Bird"], "correct_answer": "Fish", "feedback": {"correct": "Yes! Fish was not one of the 3 animals!", "incorrect": "The 3 animals were Dog, Cat, and Bird. Fish wasn''t there."}}',
 'Remember the animals I showed you and find the one that wasn''t there.', ARRAY['recall', 'recognition']),

('memory', -1.00, 1.2, 0.25, 36, 72,
 '{"type": "multiple_choice", "prompt": "I said these words: Sun, Moon, Star. What was the SECOND word?", "options": ["Sun", "Moon", "Star", "Cloud"], "correct_answer": "Moon", "feedback": {"correct": "Yes! The second word was Moon: Sun, MOON, Star.", "incorrect": "The order was: Sun (first), Moon (second), Star (third)."}}',
 'Remember the order of the words.', ARRAY['sequential_memory', 'order']),

-- MEMORY DOMAIN - Medium items
('memory', 0.00, 1.4, 0.25, 48, 72,
 '{"type": "multiple_choice", "prompt": "I showed you: Red House, Blue Car, Green Tree, Yellow Sun. What color was the tree?", "options": ["Red", "Blue", "Green", "Yellow"], "correct_answer": "Green", "feedback": {"correct": "Yes! The tree was green!", "incorrect": "Let''s remember: Red House, Blue Car, GREEN Tree, Yellow Sun."}}',
 'Remember what color each thing was.', ARRAY['association', 'color_memory']),

-- MEMORY DOMAIN - Hard items
('memory', 1.00, 1.6, 0.20, 60, 96,
 '{"type": "multiple_choice", "prompt": "I said: 7, 3, 9, 1, 5. Now say them BACKWARDS. What''s the correct backward order?", "options": ["5, 1, 9, 3, 7", "7, 3, 9, 1, 5", "1, 3, 5, 7, 9", "5, 9, 1, 3, 7"], "correct_answer": "5, 1, 9, 3, 7", "feedback": {"correct": "Amazing! You reversed 7,3,9,1,5 to get 5,1,9,3,7!", "incorrect": "Backwards means last to first: 5, 1, 9, 3, 7."}}',
 'Remember the numbers and reverse them.', ARRAY['working_memory', 'digit_span_backward']);
