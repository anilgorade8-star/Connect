import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import "../styles/History.css";

const HomeIcon = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(Array.isArray(history) ? history : []);
            } catch (e) {
                console.log("Error fetching history:", e);
            }
        };

        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        if (!dateString) return "No date";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <div className="history-page">
            <header className="history-header">
                <IconButton
                    onClick={() => routeTo("/home")}
                    aria-label="Home"
                    sx={{ color: "#ffffff", "&:hover": { color: "#ff9839", backgroundColor: "rgba(255, 152, 57, 0.1)" } }}
                >
                    <HomeIcon fontSize="medium" />
                </IconButton>
                <div className="history-brand" onClick={() => routeTo("/home")}>
                    <span>|</span> Connect
                </div>
            </header>

            <main className="history-container">
                {meetings.length === 0 ? (
                    <p className="history-empty">No meeting history found.</p>
                ) : (
                    <div className="history-list">
                        {meetings.map((e, index) => {
                            const code = e?.meetingCode || e?.meeting_code || e?.code || "Meeting";
                            const dateVal = e?.date || e?.createdAt || e?.timestamp;

                            return (
                                <Card
                                    key={e?._id || `${code}-${index}`}
                                    variant="outlined"
                                    className="history-card"
                                    sx={{
                                        backgroundColor: "#161b22",
                                        borderColor: "rgba(255, 255, 255, 0.1)",
                                        color: "#f0f6fc",
                                        borderRadius: "12px",
                                        margin: "12px 0",
                                        padding: "6px"
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontSize: "17px", fontWeight: 600, color: "#ffffff", mb: 1 }}>
                                            Meeting Code: {code}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: "14px", color: "#8b949e" }}>
                                            Date: {formatDate(dateVal)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
