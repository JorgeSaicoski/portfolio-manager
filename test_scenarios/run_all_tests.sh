#!/bin/bash
# Script to run all performance tests sequentially
# Usage: ./run_all_tests.sh [base_url] [auth_url]

set -e  # Exit on error

# Configuration
BASE_URL=${1:-http://localhost:8080}
AUTH_URL=${2:-http://localhost:8081}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Portfolio Manager Performance Tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "Base URL: ${GREEN}${BASE_URL}${NC}"
echo -e "Auth URL: ${GREEN}${AUTH_URL}${NC}"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo "Please install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Set environment variables
export K6_BASE_URL="${BASE_URL}"
export K6_AUTH_URL="${AUTH_URL}"

# Test scenarios
declare -a tests=(
    "load_test.js:Load Test:4"
    "stress_test.js:Stress Test:17"
    "spike_test.js:Spike Test:6"
    "soak_test.js:Soak Test:32"
)

echo -e "${YELLOW}Available tests:${NC}"
for i in "${!tests[@]}"; do
    IFS=':' read -r file name duration <<< "${tests[$i]}"
    echo "  $((i+1)). ${name} (${duration} min) - ${file}"
done
echo ""

# Ask user which tests to run
echo -e "${YELLOW}Run which tests?${NC}"
echo "  1) Load Test only"
echo "  2) Stress Test only"
echo "  3) Spike Test only"
echo "  4) Soak Test only"
echo "  5) Load + Stress"
echo "  6) Load + Spike"
echo "  7) All tests (will take ~60 minutes)"
echo "  8) Custom selection"
read -p "Enter choice [1-8]: " choice

run_test() {
    local file=$1
    local name=$2
    local duration=$3

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Running: ${name}${NC}"
    echo -e "${BLUE}Duration: ~${duration} minutes${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    if k6 run "${file}"; then
        echo -e "${GREEN}✓ ${name} completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        return 1
    fi
}

case $choice in
    1)
        run_test "load_test.js" "Load Test" "4"
        ;;
    2)
        run_test "stress_test.js" "Stress Test" "17"
        ;;
    3)
        run_test "spike_test.js" "Spike Test" "6"
        ;;
    4)
        run_test "soak_test.js" "Soak Test" "32"
        ;;
    5)
        run_test "load_test.js" "Load Test" "4"
        run_test "stress_test.js" "Stress Test" "17"
        ;;
    6)
        run_test "load_test.js" "Load Test" "4"
        run_test "spike_test.js" "Spike Test" "6"
        ;;
    7)
        for test in "${tests[@]}"; do
            IFS=':' read -r file name duration <<< "$test"
            run_test "$file" "$name" "$duration" || echo -e "${YELLOW}Continuing with next test...${NC}"
        done
        ;;
    8)
        echo ""
        for i in "${!tests[@]}"; do
            IFS=':' read -r file name duration <<< "${tests[$i]}"
            read -p "Run ${name}? (y/n): " yn
            case $yn in
                [Yy]* ) run_test "$file" "$name" "$duration";;
                * ) echo "Skipping ${name}";;
            esac
        done
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}All selected tests completed!${NC}"
echo -e "${BLUE}================================${NC}"
