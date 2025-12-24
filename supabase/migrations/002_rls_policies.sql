-- Row Level Security Policies
-- Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdm_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profs can view all students
CREATE POLICY "Profs can view students" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'professeur'
    )
  );

-- Allow inserting own profile (for self-registration after auth)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RDM Types policies (readable by everyone authenticated)
CREATE POLICY "Authenticated users can view RDM types" ON rdm_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Exercises policies
-- Profs can CRUD their own exercises
CREATE POLICY "Profs can view own exercises" ON exercises
  FOR SELECT USING (prof_id = auth.uid());

CREATE POLICY "Profs can insert exercises" ON exercises
  FOR INSERT WITH CHECK (prof_id = auth.uid());

CREATE POLICY "Profs can update own exercises" ON exercises
  FOR UPDATE USING (prof_id = auth.uid());

CREATE POLICY "Profs can delete own exercises" ON exercises
  FOR DELETE USING (prof_id = auth.uid());

-- Students can view published exercises
CREATE POLICY "Students can view published exercises" ON exercises
  FOR SELECT USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'etudiant'
    )
  );

-- Exercise Instances policies
-- Students can view their own instances
CREATE POLICY "Students can view own instances" ON exercise_instances
  FOR SELECT USING (student_id = auth.uid());

-- Profs can view instances of their exercises
CREATE POLICY "Profs can view instances of their exercises" ON exercise_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id AND e.prof_id = auth.uid()
    )
  );

-- Profs can insert instances for their exercises
CREATE POLICY "Profs can insert instances" ON exercise_instances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_id AND e.prof_id = auth.uid()
    )
  );

-- Students can update their own instances (mark completed)
CREATE POLICY "Students can update own instances" ON exercise_instances
  FOR UPDATE USING (student_id = auth.uid());

-- Attempts policies
-- Students can view their own attempts
CREATE POLICY "Students can view own attempts" ON attempts
  FOR SELECT USING (student_id = auth.uid());

-- Students can insert their own attempts
CREATE POLICY "Students can insert attempts" ON attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Profs can view attempts on their exercises
CREATE POLICY "Profs can view attempts on their exercises" ON attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercise_instances ei
      JOIN exercises e ON ei.exercise_id = e.id
      WHERE ei.id = instance_id AND e.prof_id = auth.uid()
    )
  );
