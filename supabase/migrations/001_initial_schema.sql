-- RDM Exercices Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RDM Types (types de sollicitation)
CREATE TABLE rdm_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  formulas JSONB DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nom VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('professeur', 'etudiant')),
  numero_etudiant VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prof_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rdm_type_id UUID REFERENCES rdm_types(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  statement_template TEXT NOT NULL,
  formulas JSONB NOT NULL DEFAULT '[]',
  variable_ranges JSONB NOT NULL DEFAULT '{}',
  tolerance_percent DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise instances (personalized for each student)
CREATE TABLE exercise_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variable_values JSONB NOT NULL DEFAULT '{}',
  statement_filled TEXT NOT NULL,
  expected_answer DECIMAL(20,6) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  final_answer DECIMAL(20,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exercise_id, student_id)
);

-- Attempts table
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES exercise_instances(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  given_answer DECIMAL(20,6) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  deviation_percent DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exercises_prof_id ON exercises(prof_id);
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_rdm_type ON exercises(rdm_type_id);
CREATE INDEX idx_exercise_instances_student ON exercise_instances(student_id);
CREATE INDEX idx_exercise_instances_exercise ON exercise_instances(exercise_id);
CREATE INDEX idx_attempts_instance ON attempts(instance_id);
CREATE INDEX idx_attempts_student ON attempts(student_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default RDM types
INSERT INTO rdm_types (name, description, formulas, variables) VALUES
('Traction simple', 'Sollicitation où une barre est soumise à des forces axiales de sens opposés tendant à l''allonger.',
 '["σ = F / S", "ε = ΔL / L", "E = σ / ε"]'::jsonb,
 '["F (Force)", "S (Section)", "L (Longueur)", "E (Module de Young)"]'::jsonb),

('Compression', 'Sollicitation où une barre est soumise à des forces axiales tendant à la raccourcir.',
 '["σ = F / S", "ε = ΔL / L", "Fc = π²EI / L²"]'::jsonb,
 '["F (Force)", "S (Section)", "I (Moment d''inertie)", "L (Longueur)"]'::jsonb),

('Flexion simple', 'Sollicitation où une poutre est soumise à des moments fléchissants.',
 '["σmax = M × ymax / I", "f = PL³ / (48EI)", "M = P × L / 4"]'::jsonb,
 '["M (Moment)", "P (Charge)", "L (Portée)", "I (Inertie)", "y (Distance)"]'::jsonb),

('Torsion', 'Sollicitation où un arbre est soumis à des couples de torsion.',
 '["τmax = Mt × r / Ip", "θ = Mt × L / (G × Ip)", "Ip = π × d⁴ / 32"]'::jsonb,
 '["Mt (Moment de torsion)", "r (Rayon)", "G (Module de cisaillement)", "Ip (Moment polaire)"]'::jsonb),

('Cisaillement', 'Sollicitation où un élément est soumis à des forces tangentielles.',
 '["τ = V / S", "τmax = V × Q / (I × b)"]'::jsonb,
 '["V (Effort tranchant)", "S (Section)", "Q (Moment statique)", "b (Largeur)"]'::jsonb);
