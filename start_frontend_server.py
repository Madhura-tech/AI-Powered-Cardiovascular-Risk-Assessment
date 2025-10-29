import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

def start_frontend_server():
    """Start HTTP server for frontend"""
    PORT = 8080
    
    # Change to frontend directory
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Frontend server running at:")
        print(f"http://localhost:{PORT}")
        print(f"http://127.0.0.1:{PORT}")
        print("\nPress Ctrl+C to stop the server")
        
        # Auto-open browser to landing page
        webbrowser.open(f"http://localhost:{PORT}/index.html")
        
        httpd.serve_forever()

if __name__ == "__main__":
    start_frontend_server()