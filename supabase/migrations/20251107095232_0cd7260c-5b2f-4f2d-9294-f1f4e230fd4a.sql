-- Add location and verification columns to attendance_records
ALTER TABLE attendance_records
ADD COLUMN location JSONB,
ADD COLUMN face_verified BOOLEAN DEFAULT false,
ADD COLUMN device_id TEXT;

-- Create school settings table
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  require_face_verification BOOLEAN DEFAULT true,
  require_location_verification BOOLEAN DEFAULT true,
  require_rfid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create student faces table for face recognition
CREATE TABLE student_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_image_url TEXT NOT NULL,
  face_embedding JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create ESP32 devices table
CREATE TABLE esp32_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(device_id)
);

-- Enable RLS
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE esp32_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for school_settings
CREATE POLICY "Anyone authenticated can view school settings"
  ON school_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage school settings"
  ON school_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for student_faces
CREATE POLICY "Users can view their own face data"
  ON student_faces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face data"
  ON student_faces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face data"
  ON student_faces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all face data"
  ON student_faces FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for esp32_devices
CREATE POLICY "Anyone authenticated can view devices"
  ON esp32_devices FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage devices"
  ON esp32_devices FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON school_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_student_faces_updated_at
  BEFORE UPDATE ON student_faces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default school settings
INSERT INTO school_settings (school_name, latitude, longitude, radius_meters)
VALUES ('Sekolah Utama', -6.200000, 106.816666, 100);

-- Create index for better performance
CREATE INDEX idx_attendance_device_id ON attendance_records(device_id);
CREATE INDEX idx_student_faces_user_id ON student_faces(user_id);
CREATE INDEX idx_esp32_device_id ON esp32_devices(device_id);