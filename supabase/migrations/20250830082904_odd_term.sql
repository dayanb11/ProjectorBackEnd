-- Initialize database with required extensions and settings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create database user if not exists (for development)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'projector_user') THEN
      CREATE ROLE projector_user LOGIN PASSWORD 'projector_password';
   END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE projector_db TO projector_user;
GRANT ALL ON SCHEMA public TO projector_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO projector_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO projector_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO projector_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO projector_user;