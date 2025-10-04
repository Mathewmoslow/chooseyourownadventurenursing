#!/bin/bash

echo "Starting Choose Your Own Adventure Nursing..."
echo ""
echo "Starting API server on port 3000..."
npm run dev:api &
API_PID=$!

echo "Waiting for API server to start..."
sleep 5

echo "Starting frontend server on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "Servers are starting!"
echo "=================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "API:      http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $API_PID $FRONTEND_PID; exit" INT
wait
