CREATE TYPE quota_status AS ENUM ('Disponível', 'Ocupada');

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_quotas INTEGER NOT NULL DEFAULT 0,
  available_quotas INTEGER NOT NULL DEFAULT 0,
  occupied_quotas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotas (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  quota_number INTEGER NOT NULL,
  status quota_status NOT NULL DEFAULT 'Disponível',
  representative_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, quota_number)
);

CREATE INDEX IF NOT EXISTS idx_quotas_group_id ON quotas(group_id);
CREATE INDEX IF NOT EXISTS idx_quotas_status ON quotas(status);
CREATE INDEX IF NOT EXISTS idx_quotas_representative_id ON quotas(representative_id);

CREATE OR REPLACE FUNCTION update_group_quota_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE groups SET
      available_quotas = (
        SELECT COUNT(*) FROM quotas 
        WHERE group_id = NEW.group_id AND status = 'Disponível'
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
        WHERE group_id = OLD.group_id AND status = 'Disponível'
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

CREATE TRIGGER trigger_update_group_quota_counts
  AFTER INSERT OR UPDATE OR DELETE ON quotas
  FOR EACH ROW EXECUTE FUNCTION update_group_quota_counts();

CREATE OR REPLACE FUNCTION update_group_total_quotas()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groups SET
    total_quotas = (
      SELECT COUNT(*) FROM quotas WHERE group_id = NEW.id
    ),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_total_quotas
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION update_group_total_quotas();

alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table quotas;
