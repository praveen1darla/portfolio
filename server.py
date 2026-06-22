
import http.server
import socketserver
import os
import time

PORT = 8000

os.chdir('/home/praveen/web')

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ Server started at http://localhost:{PORT}")
    print("📂 Serving files from:", os.getcwd())
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
        httpd.shutdown()
