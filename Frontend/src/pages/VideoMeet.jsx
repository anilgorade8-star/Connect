import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, SvgIcon } from '@mui/material';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;
var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

// High-Definition Video & Audio Media Constraints (1080p Full HD with 720p minimum, 30-60fps)
const videoHDConstraints = {
    width: { ideal: 1920, max: 1920, min: 1280 },
    height: { ideal: 1080, max: 1080, min: 720 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: "user"
};

const audioHDConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2
};

// Maximize peer connection bitrate for crystal-clear HD video (4 Mbps)
const maximizeVideoQuality = (peerConnection) => {
    try {
        if (!peerConnection || !peerConnection.getSenders) return;
        peerConnection.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "video") {
                const params = sender.getParameters();
                if (!params.encodings || params.encodings.length === 0) {
                    params.encodings = [{}];
                }
                params.encodings[0].maxBitrate = 4000000; // 4 Mbps for crystal-clear HD video
                params.encodings[0].networkPriority = "high";
                params.encodings[0].priority = "high";
                if (params.degradationPreference !== undefined) {
                    params.degradationPreference = "maintain-resolution";
                }
                sender.setParameters(params).catch(() => {});
            }
        });
    } catch {}
};

const enhanceSDP = (sdp) => {
    if (!sdp) return sdp;
    let modified = sdp;
    if (modified.includes("m=video")) {
        modified = modified.replace(/m=video ([^\r\n]+)\r?\n/, "m=video $1\r\nb=AS:4000\r\nb=TIAS:4000000\r\n");
    }
    return modified;
};

// Clean icons using MUI SvgIcon
const VideocamIcon = (props) => (
    <SvgIcon {...props}><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></SvgIcon>
);
const VideocamOffIcon = (props) => (
    <SvgIcon {...props}><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27l1.36 1.36C3.13 4.88 3 5.17 3 5.5v11c0 .55.45 1 1 1h13.73l2 2L21 18.23 3.27 2zM5 16V6.27L14.73 16H5z" /></SvgIcon>
);
const MicIcon = (props) => (
    <SvgIcon {...props}><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" /></SvgIcon>
);
const MicOffIcon = (props) => (
    <SvgIcon {...props}><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" /></SvgIcon>
);
const CallEndIcon = (props) => (
    <SvgIcon {...props}><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" /></SvgIcon>
);
const ScreenShareIcon = (props) => (
    <SvgIcon {...props}><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm9 3l4 4-4 4v-2.5H9v-3h4V9z" /></SvgIcon>
);
const StopScreenShareIcon = (props) => (
    <SvgIcon {...props}><path d="M21.79 18l2 2H24v-2h-2.21zM1.11 2.98l1.55 1.56c-.41.37-.66.89-.66 1.46v10c0 1.1.9 2 2 2H0v2h18.13l2.71 2.71 1.41-1.41L2.52 1.57 1.11 2.98zM4 6.27L13.73 16H4V6.27zM20 16V6H7.82l2 2H20v7.18l2 2c.41-.37.66-.89.66-1.46zM13 9v1.17l2 2V9h2l-3.5-3.5-1.09 1.09L13 7.18V9h-1.17l1.17 1.17V9z" /></SvgIcon>
);
const ChatIcon = (props) => (
    <SvgIcon {...props}><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" /></SvgIcon>
);
const CloseIcon = (props) => (
    <SvgIcon {...props}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></SvgIcon>
);

// Isolated Chat Input component so keystrokes do not re-render video streams
function ChatArea({ onSendMessage }) {
    const [text, setText] = useState("");

    const handleSend = () => {
        if (!text.trim()) return;
        onSendMessage(text);
        setText("");
    };

    return (
        <div className={styles.chattingArea}>
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Send a message to everyone..."
            />
            <button type="button" onClick={handleSend}>Send</button>
        </div>
    );
}

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const videoRef = useRef([]);
    const messagesEndRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [videos, setVideos] = useState([]);

    // Check authentication: If no valid token, redirect to /auth immediately
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || token === "undefined" || token === "null" || token.trim() === "") {
            window.location.replace("/auth");
        }
    }, []);

   
    useEffect(() => {
        getPermissions();
    }, []);

    // Re-attach local stream whenever switching between lobby and meeting
    useEffect(() => {
        if (localVideoref.current && window.localStream) {
            if (localVideoref.current.srcObject !== window.localStream) {
                localVideoref.current.srcObject = window.localStream;
            }
        }
    }, [askForUsername]);

    // Auto-scroll chat to latest message
    useEffect(() => {
        if (showModal && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, showModal]);

    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoHDConstraints,
                audio: audioHDConstraints
            });
            if (stream) {
                window.localStream = stream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
                setVideoAvailable(true);
                setAudioAvailable(true);
                setVideo(true);
                setAudio(true);
            }
        } catch (error) {
            console.log("HD permission request failed, testing fallback:", error);
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
                });
                window.localStream = videoStream;
                if (localVideoref.current) localVideoref.current.srcObject = videoStream;
                setVideoAvailable(true);
                setVideo(true);
            } catch {
                try {
                    const basicVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    window.localStream = basicVideoStream;
                    if (localVideoref.current) localVideoref.current.srcObject = basicVideoStream;
                    setVideoAvailable(true);
                    setVideo(true);
                } catch {
                    setVideoAvailable(false);
                    setVideo(false);
                }
            }

            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioHDConstraints });
                if (!window.localStream) {
                    window.localStream = audioStream;
                } else {
                    audioStream.getAudioTracks().forEach(track => window.localStream.addTrack(track));
                }
                setAudioAvailable(true);
                setAudio(true);
            } catch {
                try {
                    const basicAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    if (!window.localStream) {
                        window.localStream = basicAudioStream;
                    } else {
                        basicAudioStream.getAudioTracks().forEach(track => window.localStream.addTrack(track));
                    }
                    setAudioAvailable(true);
                    setAudio(true);
                } catch {
                    setAudioAvailable(false);
                    setAudio(false);
                }
            }
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };

    const getDislayMedia = () => {
        if (screen && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    width: { ideal: 1920, max: 2560 },
                    height: { ideal: 1080, max: 1440 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: true
            })
                .then(getDislayMediaSuccess)
                .catch((e) => {
                    console.log(e);
                    setScreen(false);
                });
        }
    };

    const getDislayMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            try {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    const enhancedDescription = new RTCSessionDescription({
                        type: description.type,
                        sdp: enhanceSDP(description.sdp)
                    });
                    connections[id].setLocalDescription(enhancedDescription)
                        .then(() => {
                            maximizeVideoQuality(connections[id]);
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            } catch (e) { console.log(e); }
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(t => t.stop());
                }
            } catch (e) { console.log(e); }

            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }
            getUserMedia();
        });
    };

    const getUserMediaSuccess = (stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            try {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    const enhancedDescription = new RTCSessionDescription({
                        type: description.type,
                        sdp: enhanceSDP(description.sdp)
                    });
                    connections[id].setLocalDescription(enhancedDescription)
                        .then(() => {
                            maximizeVideoQuality(connections[id]);
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            } catch (e) { console.log(e); }
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(t => t.stop());
                }
            } catch (e) { console.log(e); }

            window.localStream = blackSilence();
            if (localVideoref.current) {
                localVideoref.current.srcObject = window.localStream;
            }

            for (let id in connections) {
                try {
                    connections[id].addStream(window.localStream);
                    connections[id].createOffer().then((description) => {
                        const enhancedDescription = new RTCSessionDescription({
                            type: description.type,
                            sdp: enhanceSDP(description.sdp)
                        });
                        connections[id].setLocalDescription(enhancedDescription)
                            .then(() => {
                                maximizeVideoQuality(connections[id]);
                                socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                            })
                            .catch(e => console.log(e));
                    });
                } catch (e) { console.log(e); }
            }
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            const vConstraints = (video && videoAvailable) ? videoHDConstraints : false;
            const aConstraints = (audio && audioAvailable) ? audioHDConstraints : false;

            navigator.mediaDevices.getUserMedia({ video: vConstraints, audio: aConstraints })
                .then(getUserMediaSuccess)
                .catch((e) => {
                    console.log("HD getUserMedia failed, trying fallback:", e);
                    navigator.mediaDevices.getUserMedia({ video: video && videoAvailable, audio: audio && audioAvailable })
                        .then(getUserMediaSuccess)
                        .catch((err) => console.log(err));
                });
        } else {
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
                }
            } catch { }
        }
    };

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const gotMessageFromServer = (fromId, message) => {
        try {
            var signal = JSON.parse(message);
            if (fromId !== socketIdRef.current && connections[fromId]) {
                if (signal.sdp) {
                    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                        maximizeVideoQuality(connections[fromId]);
                        if (signal.sdp.type === 'offer') {
                            connections[fromId].createAnswer().then((description) => {
                                const enhancedDescription = new RTCSessionDescription({
                                    type: description.type,
                                    sdp: enhanceSDP(description.sdp)
                                });
                                connections[fromId].setLocalDescription(enhancedDescription).then(() => {
                                    maximizeVideoQuality(connections[fromId]);
                                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                                }).catch(e => console.log(e));
                            }).catch(e => console.log(e));
                        }
                    }).catch(e => console.log(e));
                }

                if (signal.ice) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const getRoomId = () => {
                const parts = window.location.pathname.split('/').filter(Boolean);
                if (parts.length > 1 && parts[0] === 'auth') {
                    return parts[1];
                }
                return parts[0] || 'default-room';
            };
            const roomId = getRoomId();
            socketRef.current.emit('join-call', roomId);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => {
                    const updated = videos.filter((v) => v.socketId !== id);
                    videoRef.current = updated;
                    return updated;
                });
                if (connections[id]) {
                    try {
                        connections[id].close();
                        delete connections[id];
                    } catch { }
                }
            });

            const handleUserJoined = (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].onconnectionstatechange = () => {
                        if (connections[socketListId] && connections[socketListId].connectionState === "connected") {
                            maximizeVideoQuality(connections[socketListId]);
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(v => v.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: event.stream } : v
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                    maximizeVideoQuality(connections[socketListId]);
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try {
                            connections[id2].addStream(window.localStream);
                            connections[id2].createOffer().then((description) => {
                                const enhancedDescription = new RTCSessionDescription({
                                    type: description.type,
                                    sdp: enhanceSDP(description.sdp)
                                });
                                connections[id2].setLocalDescription(enhancedDescription)
                                    .then(() => {
                                        maximizeVideoQuality(connections[id2]);
                                        socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                    })
                                    .catch(e => console.log(e));
                            });
                        } catch { }
                    }
                }
            };

            socketRef.current.on('user-join', handleUserJoined);
            socketRef.current.on('user-joined', handleUserJoined);
        });
    };

    const silence = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            let ctx = new AudioContextClass();
            let oscillator = ctx.createOscillator();
            let dst = ctx.createMediaStreamDestination();
            oscillator.connect(dst);
            oscillator.start();
            ctx.resume();
            return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
        } catch {
            return null;
        }
    };

    const black = ({ width = 1280, height = 720 } = {}) => {
        try {
            let canvas = Object.assign(document.createElement("canvas"), { width, height });
            canvas.getContext('2d').fillRect(0, 0, width, height);
            let stream = canvas.captureStream(30);
            return Object.assign(stream.getVideoTracks()[0], { enabled: false });
        } catch {
            return null;
        }
    };

    const blackSilence = (...args) => {
        const tracks = [];
        const b = black(...args);
        const s = silence();
        if (b) tracks.push(b);
        if (s) tracks.push(s);
        return new MediaStream(tracks);
    };

    const handleVideo = () => {
        if (window.localStream) {
            const videoTracks = window.localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks[0].enabled = !video;
            }
        }
        setVideo(!video);
    };

    const handleAudio = () => {
        if (window.localStream) {
            const audioTracks = window.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audio;
            }
        }
        setAudio(!audio);
    };

    useEffect(() => {
        if (screen !== undefined && screen !== false) {
            getDislayMedia();
        }
    }, [screen]);

    const handleScreen = () => {
        setScreen(!screen);
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch { }

        try {
            for (let id in connections) {
                connections[id].close();
                delete connections[id];
            }
        } catch { }

        try {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch { }

        window.location.href = "/";
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    const sendMessage = (textToSend) => {
        const text = (typeof textToSend === 'string' ? textToSend : message).trim();
        if (!text || !socketRef.current) return;
        socketRef.current.emit('chat-message', text, username || "Guest");
        setMessage("");
    };

    const connect = () => {
        const trimmed = username.trim();
        if (!trimmed) {
            setUsernameError("Please enter your name to join the call");
            return;
        }
        setUsernameError("");
        setAskForUsername(false);
        getMedia();
    };

    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null" || token.trim() === "") {
        window.location.replace("/auth");
        return null;
    }

    return (
        <div className={styles.container}>
            {askForUsername === true ? (
                /* ================= LOBBY SCREEN ================= */
                <div className={styles.lobbyWrapper}>
                    <div className={styles.lobbyCard}>
                        <div className={styles.lobbyHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
                                <span style={{ fontSize: "12px", color: "#8b949e", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ff9839", display: "inline-block" }}></span>
                                    Logged In
                                </span>
                                <button 
                                    type="button"
                                    className={styles.lobbyLogoutBtn}
                                    onClick={() => {
                                        localStorage.removeItem("token");
                                        window.location.replace("/auth");
                                    }}
                                >
                                    Log out
                                </button>
                            </div>
                            <h2 className={styles.lobbyTitle}>Meeting Lobby</h2>
                            <p className={styles.lobbySubtitle}>Check your camera and audio before joining</p>
                        </div>

                        <div className={styles.lobbyPreview}>
                            <video
                                ref={(el) => {
                                    localVideoref.current = el;
                                    if (el && window.localStream && el.srcObject !== window.localStream) {
                                        el.srcObject = window.localStream;
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                            />
                            <div className={styles.lobbyPreviewOverlay}>
                                <span className={styles.previewBadge}>
                                    {video ? "Camera On" : "Camera Off"} • {audio ? "Mic On" : "Mic Muted"}
                                </span>
                                <div>
                                    <IconButton
                                        size="small"
                                        onClick={handleVideo}
                                        style={{ color: video ? "#ff9839" : "#f85149", background: "rgba(0,0,0,0.6)", marginRight: "6px" }}
                                    >
                                        {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={handleAudio}
                                        style={{ color: audio ? "#ff9839" : "#f85149", background: "rgba(0,0,0,0.6)" }}
                                    >
                                        {audio ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                                    </IconButton>
                                </div>
                            </div>
                        </div>

                        <div className={styles.lobbyForm}>
                            <TextField
                                id="outlined-basic"
                                label="Your Name"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (usernameError) setUsernameError("");
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') connect(); }}
                                variant="outlined"
                                fullWidth
                                autoFocus
                                error={Boolean(usernameError)}
                                helperText={usernameError}
                                sx={{
                                    input: { color: '#ffffff' },
                                    label: { color: usernameError ? '#f85149 !important' : '#8b949e' },
                                    '& .MuiFormHelperText-root': {
                                        color: '#f85149 !important',
                                        fontSize: '13px',
                                        marginTop: '6px',
                                        marginLeft: '4px'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: usernameError ? '#f85149 !important' : '#30363d' },
                                        '&:hover fieldset': { borderColor: usernameError ? '#f85149 !important' : '#484f58' },
                                        '&.Mui-focused fieldset': { borderColor: usernameError ? '#f85149 !important' : '#ff9839' },
                                        backgroundColor: '#0d1117',
                                        borderRadius: '9px'
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: usernameError ? '#f85149 !important' : '#ff9839'
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={connect}
                                size="large"
                                sx={{
                                    backgroundColor: '#ff9839',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    textTransform: 'none',
                                    fontSize: '15px',
                                    borderRadius: '9px',
                                    padding: '12px',
                                    boxShadow: 'none',
                                    '&:hover': { backgroundColor: '#e68528', boxShadow: 'none' }
                                }}
                            >
                                Join Call
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ================= ACTIVE MEETING SCREEN ================= */
                <div className={styles.meetVideoContainer}>
                    <div className={styles.videoStage}>
                        <div className={styles.conferenceView}>
                            {/* Local Participant Video */}
                            <div className={`${styles.videoTile} ${styles.localTile}`}>
                                <video
                                    ref={(el) => {
                                        localVideoref.current = el;
                                        if (el && window.localStream && el.srcObject !== window.localStream) {
                                            el.srcObject = window.localStream;
                                        }
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                />
                                <div className={styles.tileLabel}>
                                    <span>{username || "You"} (You)</span>
                                    {!audio && <MicOffIcon sx={{ fontSize: 14, color: "#f85149" }} />}
                                </div>
                            </div>

                            {/* Remote Participants Videos */}
                            {videos.map((remote) => (
                                <div className={styles.videoTile} key={remote.socketId}>
                                    <video
                                        data-socket={remote.socketId}
                                        ref={(ref) => {
                                            if (ref && remote.stream && ref.srcObject !== remote.stream) {
                                                ref.srcObject = remote.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                    />
                                    <div className={styles.tileLabel}>
                                        <span>Participant</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Drawer */}
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.chatHeader}>
                                    <span className={styles.chatHeaderTitle}>In-Call Chat</span>
                                    <IconButton size="small" onClick={() => setModal(false)} sx={{ color: "#8b949e" }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? (
                                        messages.map((item, index) => (
                                            <div className={styles.messageCard} key={index}>
                                                <div className={styles.messageSender}>{item.sender || "Participant"}</div>
                                                <p className={styles.messageText}>{item.data}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.waitingBadge} style={{ height: "100%", justifyContent: "center" }}>
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <ChatArea onSendMessage={sendMessage} />
                            </div>
                        </div>
                    )}

                    {/* Floating Controls Bar */}
                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleVideo}
                            className={`${styles.controlBtn} ${!video ? styles.controlBtnOff : ''}`}
                            title={video ? "Turn off camera" : "Turn on camera"}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleAudio}
                            className={`${styles.controlBtn} ${!audio ? styles.controlBtnOff : ''}`}
                            title={audio ? "Mute microphone" : "Unmute microphone"}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable && (
                            <IconButton
                                onClick={handleScreen}
                                className={`${styles.controlBtn} ${screen ? styles.controlBtnOff : ''}`}
                                title={screen ? "Stop sharing screen" : "Share screen"}
                            >
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={99} color="primary">
                            <IconButton
                                onClick={() => {
                                    setModal(!showModal);
                                    if (!showModal) setNewMessages(0);
                                }}
                                className={styles.controlBtn}
                                title="Toggle chat"
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        <IconButton
                            onClick={handleEndCall}
                            className={styles.endCallBtn}
                            title="End call"
                        >
                            <CallEndIcon />
                        </IconButton>
                    </div>
                </div>
            )}
        </div>
    );
}