#!/usr/bin/env python3
"""
Payment API Server Startup Script
Run this to start the Stripe payment API server
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Payment API Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    print("\n⚠️  IMPORTANT: Make sure to update your Stripe secret key in payment_api.py")
    print("   Replace 'sk_test_YOUR_SECRET_KEY_HERE' with your actual secret key")
    print("\n" + "="*50)
    
    uvicorn.run(
        "payment_api:app",  # Import string format for reload=True
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    ) 