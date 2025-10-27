#!/bin/bash
set -e

# PostgreSQL Database Initialization Script
# Note: The postgres Docker image automatically creates the database specified
# in POSTGRES_DB env var. This script only creates the additional authentik database.
# It runs automatically on first container startup via /docker-entrypoint-initdb.d/

echo "Starting database initialization..."
echo "Main database '$POSTGRES_DB' is created automatically by postgres image"
echo "Creating additional 'authentik' database..."

# Create authentik database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE authentik;
    GRANT ALL PRIVILEGES ON DATABASE authentik TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed successfully!"
echo "Databases ready: $POSTGRES_DB (application), authentik (auth system)"
