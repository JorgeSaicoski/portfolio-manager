#!/bin/bash
set -e

# PostgreSQL Database Initialization Script
# Note: The postgres Docker image automatically creates the database specified
# in POSTGRES_DB env var. This script creates additional databases.
# It runs automatically on first container startup via /docker-entrypoint-initdb.d/

echo "Starting database initialization..."
echo "Main database '$POSTGRES_DB' is created automatically by postgres image"
echo "Creating additional databases..."

# Create authentik database
echo "Creating 'authentik' database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE authentik;
    GRANT ALL PRIVILEGES ON DATABASE authentik TO $POSTGRES_USER;
EOSQL

# Create test database for automated testing
echo "Creating 'portfolio_test_db' database for testing..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE portfolio_test_db;
    GRANT ALL PRIVILEGES ON DATABASE portfolio_test_db TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed successfully!"
echo "Databases ready: $POSTGRES_DB (application), authentik (auth system), portfolio_test_db (testing)"
