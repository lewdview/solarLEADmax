#!/bin/bash

echo "🧪 Testing solarLEADmax Backend Locally..."
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint..."
HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Health check passed: $HEALTH"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Check database connection
echo "2️⃣ Testing Database Connection..."
if psql -U studio -d solarleadmax -c "\dt" > /dev/null 2>&1; then
    echo "✅ Database connection OK"
    echo "📊 Tables:"
    psql -U studio -d solarleadmax -c "\dt" | grep -E "Lead|Conversation|Appointment"
else
    echo "❌ Database connection failed"
    exit 1
fi
echo ""

# Test 3: Check Redis connection
echo "3️⃣ Testing Redis Connection..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis connection OK"
else
    echo "❌ Redis connection failed"
    exit 1
fi
echo ""

echo "✨ All local tests passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Add your API keys to .env file"
echo "   2. Test full lead intake with real Twilio number"
echo "   3. Push to GitHub"
echo "   4. Deploy to Railway"
