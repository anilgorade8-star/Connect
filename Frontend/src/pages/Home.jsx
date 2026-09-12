import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth-context";
import "../styles/Home.css";

function HomeComponent() {
  const navigate = useNavigate();
  const { addToUserHistory } = useContext(AuthContext);
  const [meetingCode, setMeetingCode] = useState("");
  const [error, setError] = useState("");

  const handleJoinVideoCall = async (event) => {
    event.preventDefault();
    const code = meetingCode.trim();
    if (!code) { setError("Enter a meeting code to continue."); return; }

    try { await addToUserHistory(code); } catch (historyError) { console.warn("Could not save meeting history", historyError); }
    navigate(`/${encodeURIComponent(code)}`);
  };

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand"><span>|</span> Connect</div>
        <div className="home-actions">
          <button type="button" className="history-button" onClick={() => navigate("/history")}>History</button>
          <button type="button" className="logout-button" onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }}>Log out</button>
        </div>
      </header>
      <section className="join-card" aria-labelledby="join-title">
        <p className="home-eyebrow">Video meetings</p>
        <h1 id="join-title">Join a meeting</h1>
        <p className="home-copy">Enter the meeting code shared with you to join the call.</p>
        <form className="join-form" onSubmit={handleJoinVideoCall}>
          <label htmlFor="meeting-code">Meeting code</label>
          <input id="meeting-code" value={meetingCode} onChange={(event) => { setMeetingCode(event.target.value); setError(""); }} placeholder="Enter meeting code" autoFocus />
          {error && <p className="join-error" role="alert">{error}</p>}
          <button type="submit">Join meeting</button>
        </form>
      </section>
    </main>
  );
}

export default withAuth(HomeComponent);
