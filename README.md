# Velo Desktop Window Compositor

A modern, web-based desktop environment compositor built with React, TypeScript, and C, designed for Linux/BSD systems. This project combines a sleek web frontend with a powerful C-based backend API for comprehensive desktop session management.

<img width="1920" height="1080" alt="imaage" src="https://github.com/user-attachments/assets/ab548c5c-309b-413d-a0ab-834ceb41dc63" />

## 🌟 Features

### Frontend (Web Compositor)
- **Modern React UI**: Built with React 19, TypeScript, and Tailwind CSS
- **Real-time Communication**: WebSocket-based communication with backend services
- **Desktop Environment**: Complete desktop shell with topbar, dock, and window management
- **Authentication System**: Secure login interface with PAM integration
- **Responsive Design**: Adaptive UI with customizable themes and wallpapers
- **Hot Module Replacement**: Development-friendly with Bun's HMR support

### Backend (VLDWM API)
- **WebSocket Server**: Real-time bidirectional communication
- **PAM Authentication**: Secure user authentication using Linux PAM
- **Desktop Session Management**: Complete session control and monitoring
- **File System Operations**: Directory listing, file management, permissions
- **System Monitoring**: Process management, disk usage, network interfaces
- **Idle Detection**: User activity monitoring and session management
- **Multi-client Support**: Concurrent WebSocket connections (up to 100 clients)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Bun + React)                  │
├─────────────────────────────────────────────────────────────┤
│  • React Components (Login, Desktop, Topbar, Dock)         │
│  • WebSocket Client Service                                │
│  • Real-time State Management                              │
│  • Tailwind CSS + Framer Motion                           │
└─────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (C WebSocket API)                  │
├─────────────────────────────────────────────────────────────┤
│  • WebSocket Server (main.c)                              │
│  • Login Daemon (logind.c) - PAM Authentication           │
│  • Desktop Session Manager (desktopsession.c)             │
│  • Idle Detection Service (idle.c)                        │
│  • JSON-C for message parsing                             │
│  • OpenSSL for WebSocket handshake                        │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
vbsd/compositor/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── login.tsx            # Authentication interface
│   │   └── topbar.tsx           # Desktop topbar
│   ├── shell/                   # Desktop shell components
│   │   ├── desktop/             # Main desktop environment
│   │   └── display/             # Display management
│   ├── config/                  # Configuration files
│   ├── assets/                  # Static assets (wallpapers, icons)
│   ├── styles/                  # CSS and styling
│   ├── index.tsx               # Main server entry point
│   └── midleware.ts            # WebSocket client service
├── sys/vldwmapi/               # Backend C API
│   ├── main.c                  # WebSocket server main
│   ├── logind.c/.h             # Authentication service
│   ├── desktopsession.c/.h     # Desktop session management
│   ├── idle.c/.h               # Idle detection service
│   └── Makefile                # Build configuration
├── build.ts                    # Frontend build script
├── package.json               # Node.js dependencies
└── tsconfig.json              # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

**System Requirements:**
- Linux or BSD operating system
- GCC compiler
- Node.js 18+ or Bun runtime
- Git

**Backend Dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libpam0g-dev libjson-c-dev libssl-dev

# CentOS/RHEL/Fedora
sudo dnf install gcc pam-devel json-c-devel openssl-devel

# FreeBSD
sudo pkg install gcc json-c pam openssl
```

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd vbsd/compositor
```

2. **Install frontend dependencies:**
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

3. **Build the backend API:**
```bash
cd sys/vldwmapi
make
```

### Running the Application

1. **Start the backend WebSocket API:**
```bash
cd sys/vldwmapi
sudo ./vldwmapi --port 3001
```

2. **Start the frontend development server:**
```bash
# In the project root
bun dev
# or
npm run dev
```

3. **Access the application:**
- Open your browser to `http://localhost:3000`
- Login interface: `http://localhost:3000`
- Desktop environment: `http://localhost:3000/desktop`

## 🔧 Configuration

### Frontend Configuration
Edit <mcfile name="default.ts" path="src/config/default.ts"></mcfile> to customize:
- Wallpaper settings
- Theme configuration
- UI preferences

### Backend Configuration
The C API server accepts command-line arguments:
```bash
./vldwmapi --port 3001    # Custom port
./vldwmapi --help         # Show help
```

## 🔌 API Reference

### WebSocket Messages

**Authentication:**
```json
{
  "type": "login",
  "username": "user",
  "password": "password"
}
```

**Desktop Session:**
```json
{
  "type": "desktop_session",
  "action": "list_directory",
  "path": "/home/user"
}
```

**System Status:**
```json
{
  "type": "system_status"
}
```

### HTTP Endpoints

- `GET /` - Main application
- `GET /desktop` - Desktop environment
- `GET /api/health` - Health check
- `WS /ws` - WebSocket endpoint

## 🛠️ Development

### Frontend Development
```bash
bun dev          # Start development server with HMR
bun run build    # Build for production
```

### Backend Development
```bash
make clean       # Clean build files
make             # Rebuild
make run         # Run with sudo
```

### Building for Production
```bash
# Frontend
bun run build

# Backend
cd sys/vldwmapi
make clean && make
```

## 🔒 Security

- **PAM Integration**: Secure authentication using system PAM modules
- **WebSocket Security**: SHA1-based handshake with OpenSSL
- **Privilege Management**: Backend runs with appropriate system privileges
- **Input Validation**: JSON message validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/) for fast JavaScript runtime
- [React](https://react.dev/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [json-c](https://github.com/json-c/json-c) for JSON parsing in C
- [OpenSSL](https://www.openssl.org/) for cryptographic functions

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**Velo Desktop Window Compositor** - Bringing modern web technologies to desktop environment management.
        
