-- Update quota_status enum to include all needed statuses
ALTER TYPE quota_status ADD VALUE IF NOT EXISTS 'Reservada';
ALTER TYPE quota_status ADD VALUE IF NOT EXISTS 'Cancelada/Atraso';

-- Add reservation fields to quotas table
ALTER TABLE quotas ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE quotas ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE;

-- Create function to release expired reservations (15 minutes)
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE quotas 
  SET 
    status = 'Disponível',
    reserved_by = NULL,
    reserved_at = NULL
  WHERE 
    status = 'Reservada' 
    AND reserved_at < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to handle new statuses
CREATE OR REPLACE FUNCTION update_group_quota_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE groups SET
      available_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = NEW.group_id AND status IN ('Disponível', 'Reservada')
      ),
      occupied_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = NEW.group_id AND status = 'Ocupada'
      ),
      updated_at = NOW()
    WHERE id = NEW.group_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE groups SET
      available_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = OLD.group_id AND status IN ('Disponível', 'Reservada')
      ),
      occupied_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = OLD.group_id AND status = 'Ocupada'
      ),
      updated_at = NOW()
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

alter publication supabase_realtime add table quotas;
alter publication supabase_realtime add table groups;