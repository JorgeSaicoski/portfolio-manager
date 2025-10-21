#!/bin/bash
# Quick Test Runner - Portfolio Manager Performance Tests
# All routes have been fixed to use /own prefix and correct pagination

set -e

echo "======================================"
echo "Portfolio Manager - Performance Tests"
echo "======================================"
echo ""
echo "Services Expected:"
echo "  Backend: http://localhost:8000"
echo "  Auth:    http://localhost:8080"
echo ""
echo "Test User:"
echo "  Username: testuser2"
echo "  Email:    tes2t@example.com"
echo "  Password: testpassword"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed"
    echo ""
    echo "Install k6:"
    echo "  macOS:  brew install k6"
    echo "  Linux:  sudo apt-get install k6"
    echo "  or visit: https://k6.io/docs/get-started/installation/"
    exit 1
fi

echo "✅ k6 is installed"
echo ""

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8000"
else
    echo "⚠️  Backend not responding on port 8000"
    echo "   Start with: podman compose up -d portfolio-backend"
    echo ""
fi

# Check if auth is running
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Auth service is running on port 8080"
else
    echo "⚠️  Auth service not responding on port 8080"
    echo "   Start with: podman compose up -d portfolio-auth"
    echo ""
fi

echo ""
echo "======================================"
echo "Select Test to Run:"
echo "======================================"
echo ""
echo "1. Quick Validation (30 seconds, 5 users)"
echo "2. Load Test (4 minutes, 5-15 users)"
echo "3. Stress Test (17 minutes, up to 50 users)"
echo "4. Spike Test (6 minutes, sudden spikes to 100 users)"
echo "5. Soak Test (32 minutes, sustained 20 users)"
echo "6. Run All Tests (Sequential)"
echo "7. Exit"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo "Running Quick Validation Test..."
        echo "Duration: 30 seconds | Users: 5"
        k6 run load_test.js --duration 30s --vus 5
        ;;
    2)
        echo ""
        echo "Running Load Test..."
        echo "Duration: 4 minutes | Users: 5-15"
        k6 run load_test.js
        ;;
    3)
        echo ""
        echo "Running Stress Test..."
        echo "Duration: 17 minutes | Users: up to 50"
        k6 run stress_test.js
        ;;
    4)
        echo ""
        echo "Running Spike Test..."
        echo "Duration: 6 minutes | Users: spikes to 100"
        k6 run spike_test.js
        ;;
    5)
        echo ""
        echo "Running Soak Test..."
        echo "Duration: 32 minutes | Users: 20"
        echo "⚠️  This is a long test - grab some coffee!"
        k6 run soak_test.js
        ;;
    6)
        echo ""
        echo "Running All Tests Sequentially..."
        echo "⚠️  Total time: ~60 minutes"
        echo ""
        read -p "Continue? [y/N]: " confirm
        if [[ $confirm == [yY] ]]; then
            echo ""
            echo "1/4 - Load Test (4 min)..."
            k6 run load_test.js
            echo ""
            echo "2/4 - Stress Test (17 min)..."
            k6 run stress_test.js
            echo ""
            echo "3/4 - Spike Test (6 min)..."
            k6 run spike_test.js
            echo ""
            echo "4/4 - Soak Test (32 min)..."
            k6 run soak_test.js
            echo ""
            echo "✅ All tests completed!"
        else
            echo "Cancelled."
        fi
        ;;
    7)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Test Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "  - Review results above"
echo "  - Check Grafana: http://localhost:3001"
echo "  - Check Prometheus: http://localhost:9090"
echo "  - View metrics: http://localhost:8000/metrics"
echo ""
echo "Documentation:"
echo "  - Full guide: test_scenarios/README.md"
echo "  - Quick start: test_scenarios/QUICKSTART.md"
echo "  - Route fixes: test_scenarios/ROUTE_FIXES.md"
echo ""
