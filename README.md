# 📹 Zoom Clone – Real-Time HD Video Conferencing Platform

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20HD-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, full-stack video conferencing web application built with **React**, **Node.js**, **Express**, **Socket.IO**, and **WebRTC**. Designed with a refined dark-mode interface, end-to-end route authentication, multi-peer video calls, screen sharing, and in-call messaging.

---

## ✨ Features

- **🎥 Crystal-Clear HD Video Calling**:
  - Full HD (1080p / 720p at 30–60 fps) camera capture constraints.
  - Multi-tier fallback for various webcam hardware.
  - 4 Mbps bitrate allocation via `RTCRtpSender.setParameters()`.
  - SDP bandwidth overrides (`b=AS:4000`, `b=TIAS:4000000`) for unrestricted video transmission.
  - `maintain-resolution` degradation preference to eliminate pixelated video downscaling.
  - Studio audio processing with echo cancellation, noise suppression, and auto gain control.

- **🖥️ Screen Sharing**:
  - High-resolution screen sharing up to 2560×1440 (QHD) / 1080p at 60 fps with auto-detection of display termination.

- **💬 Real-Time In-Call Chat**:
  - Low-latency real-time text chat powered by Socket.IO.
  - Slide-out chat drawer with unread message badge notification.

- **🚪 Pre-Meeting Lobby**:
  - Test your camera and microphone before entering any call.
  - Toggle video/audio and specify your display name beforehand.

- **🔒 Authentication & Route Protection**:
  - User registration and login with bcrypt password hashing.
  - Strict client-side route guard (`withAuth`) prevents unauthorized access to meetings and history.

- **📜 Meeting History**:
  - Persist and review past meeting participation timestamps linked to your account.

- **🎨 Modern Slate Dark UI**:
  - Crafted dark theme (`#0e1217`) with ambient top lighting, Zoom orange accents (`#ff9839`), and dynamic grid layouts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS & CSS Modules (Dark Slate Design System)
- **Icons & Components**: Material UI (`@mui/material`)
- **Real-Time Communication**: `socket.io-client`, native WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`)
- **Routing**: `react-router-dom`

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express 5
- **WebSocket / Signaling**: Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Security & Auth**: Bcrypt, CORS, HTTP-Status

---

## 📁 Repository Structure

```text
Zoom/
├── Backend/
│   ├── controllers/
│   │   ├── socketManager.js       # WebRTC signaling & message routing
│   │   └── user.controller.js     # Auth & meeting history controllers
│   ├── models/
│   │   ├── meeting.model.js       # Meeting schema
│   │   └── user.model.js          # User schema
│   ├── routes/
│   │   └── users.routes.js        # Authentication & history API endpoints
│   ├── app.js                     # Express app, Socket.IO initialization & MongoDB connect
│   ├── package.json
│   └── .env                       # Backend environment config (PORT, MONGO_URL)
│
└── Frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx        # Landing page with hero CTA
    │   │   ├── Authentication.jsx # User sign in / register tabbed view
    │   │   ├── Home.jsx           # Dashboard: Join or create meeting
    │   │   ├── History.jsx        # Meeting logs & past calls
    │   │   └── VideoMeet.jsx      # Lobby, HD video call room & in-call chat
    │   ├── contexts/
    │   │   └── AuthContext.jsx    # Auth state management
    │   ├── utils/
    │   │   └── withAuth.jsx       # Protected route wrapper
    │   ├── styles/
    │   │   ├── Home.css           # Dashboard styling
    │   │   └── videoComponent.module.css # Video tiles, lobby & controls styling
    │   ├── App.jsx                # Route definitions
    │   ├── environment.js         # API backend URL configuration
    │   └── main.jsx               # App entrypoint
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

---

### 1. Clone the Repository

```bash
git clone https://github.com/anilgorade8-star/Zoom.git
cd Zoom
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `Backend` directory:
   ```env
   PORT=8080
   MONGO_URL=your_mongodb_connection_string
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:8080`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 📡 WebRTC Signaling Architecture

```text
[ Participant A ] <==== WebSocket (SDP Offer) ====> [ Socket.IO Server ]
                                                            │
[ Participant B ] <==== WebSocket (SDP Answer) ====<──────┘
        │
        ▼ (ICE Candidate Exchange via Signaling Server)
[ Participant A ] <========== Direct P2P HD Media (WebRTC) ==========> [ Participant B ]
```

1. **Signaling**: When a user connects to a room, the Socket.IO server emits `user-join` / `user-joined` with the list of active peer IDs.
2. **Offer / Answer**: Peer connections generate SDP offers and answers with boosted bitrate constraints (`b=AS:4000`).
3. **ICE Candidates**: Network candidates are exchanged via socket signals to establish direct peer-to-peer media paths.
4. **Media Streams**: Audio and HD video tracks are rendered directly into hardware-accelerated video elements.

---

## 🛡️ API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/users/register` | Register a new user account | No |
| `POST` | `/api/v1/users/login` | Authenticate user and return token | No |
| `POST` | `/api/v1/users/add_to_activity` | Save meeting entry to user's history | Yes |
| `GET` | `/api/v1/users/get_all_activity` | Retrieve user's meeting history | Yes |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/anilgorade8-star/Zoom/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.
