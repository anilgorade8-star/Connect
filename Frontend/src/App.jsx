import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeet from "./pages/VideoMeet";
import History from "./pages/History";
import Home from "./pages/Home";
import withAuth from "./utils/withAuth";

const ProtectedVideoMeet = withAuth(VideoMeet);
const ProtectedHistory = withAuth(History);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<Home />} />
          <Route path="/auth/home" element={<Home />} />
          <Route path="/auth/:url" element={<ProtectedVideoMeet />} />
          <Route path="/history" element={<ProtectedHistory />} />
          <Route path="/:url" element={<ProtectedVideoMeet />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
