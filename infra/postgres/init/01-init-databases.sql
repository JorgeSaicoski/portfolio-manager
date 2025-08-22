-- Create separate schemas for different services
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS api;
CREATE SCHEMA IF NOT EXISTS keycloak;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO portfolio_user;
GRANT ALL PRIVILEGES ON SCHEMA api TO portfolio_user;
GRANT ALL PRIVILEGES ON SCHEMA keycloak TO portfolio_user;

-- Set default schema search path
ALTER USER portfolio_user SET search_path = auth, api, public;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";