import socket
import uvicorn

def get_ipv4():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))  # Google's DNS
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    host_ip = get_ipv4()
    print(f"🚀 FastAPI running at: http://{host_ip}:8000")
    uvicorn.run("app.main:app", host=host_ip, port=8000, reload=True)
