#!/usr/bin/env python3
"""
Simple Local Web Server
Run this to serve the website files locally for testing
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Get the current directory (where this script is located)
current_dir = Path(__file__).parent.absolute()
os.chdir(current_dir)

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🌐 Starting local web server...")
        print(f"📍 Server running at: http://localhost:{PORT}")
        print(f"📁 Serving files from: {current_dir}")
        print(f"🔗 Open your browser to: http://localhost:{PORT}")
        print("\n" + "="*50)
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown() 