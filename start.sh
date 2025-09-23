#!/bin/bash

# Gnomies Collaborative Storytelling - Startup Script
echo "🎭 Starting Gnomies Collaborative Storytelling Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get local IP address
echo "🔍 Finding your local IP address..."
if command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
elif command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}')
else
    LOCAL_IP="YOUR_IP_ADDRESS"
fi

echo ""
echo "🚀 Starting server..."
echo "📍 Main device: http://localhost:3000"
echo "📍 Other devices: http://$LOCAL_IP:3000"
echo ""
echo "💡 Share the second URL with other players to join your game!"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
