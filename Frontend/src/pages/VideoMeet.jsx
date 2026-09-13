import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, SvgIcon } from '@mui/material';
import styles from "../styles/videoComponent.module.css";
import server, { getIceServers } from '../environment';

const server_url = server;

// High-reliability STUN & TURN servers for seamless cross-network / mobile NAT traversal
const peerConfigConnections = {
    iceServers: getIceServers()
};

// Flexible HD Video & Audio Media Constraints
const videoConstraints = {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: "user"
};

const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
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

// Isolated Chat Input component so typing does not trigger parent re-renders
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

// Dedicated Remote Video Participant Tile to guarantee reliable audio and video playback
function RemoteVideoTile({ remote }) {
    const videoRef = useRef(null);
    const [needsUnmute, setNeedsUnmute] = useState(false);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !remote.stream) return;

        if (el.srcObject !== remote.stream) {
            el.srcObject = remote.stream;
        }

        const tryPlay = () => {
            el.play()
                .then(() => setNeedsUnmute(false))
                .catch((err) => {
                    console.warn("Unmuted autoplay was prevented by browser, falling back to muted video:", err);
                    el.muted = true;
                    el.play().then(() => {
                        setNeedsUnmute(true);
                    }).catch(e2 => console.error("Muted playback error:", e2));
                });
        };

        tryPlay();
    }, [remote.stream]);

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play()
                .then(() => setNeedsUnmute(false))
                .catch(e => console.error("Manual play error:", e));
        }
    };

    return (
        <div className={styles.videoTile}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
            />
            {needsUnmute && (
                <button
                    type="button"
                    onClick={handleManualPlay}
                    className={styles.unmutePromptBtn}
                >
                    🔊 Click to hear participant
                </button>
            )}
            <div className={styles.tileLabel}>
                <span>Participant</span>
            </div>
        </div>
    );
}

export default function VideoMeetComponent() {
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoref = useRef(null);
    const messagesEndRef = useRef(null);

    // Component-scoped WebRTC connection and media state references
    const connectionsRef = useRef({});
    const iceCandidatesQueueRef = useRef({});
    const remoteStreamsRef = useRef({});
    const screenOriginalVideoTrackRef = useRef(null);

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
    const [micLevel, setMicLevel] = useState(0);

    // Live microphone audio visualizer for lobby
    useEffect(() => {
        if (!askForUsername || !audio) {
            setMicLevel(0);
            return;
        }

        let audioContext;
        let analyser;
        let source;
        let animId;

        const startMeter = () => {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx || !window.localStream) return;
                const audioTracks = window.localStream.getAudioTracks();
                if (!audioTracks || audioTracks.length === 0) return;

                audioContext = new AudioCtx();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 64;
                const tempStream = new MediaStream([audioTracks[0]]);
                source = audioContext.createMediaStreamSource(tempStream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateMeter = () => {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / dataArray.length;
                    setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
                    animId = requestAnimationFrame(updateMeter);
                };

                updateMeter();
            } catch (e) {
                console.log("Mic visualizer note:", e);
            }
        };

        const timer = setTimeout(startMeter, 500);

        return () => {
            clearTimeout(timer);
            if (animId) cancelAnimationFrame(animId);
            if (source) {
                try { source.disconnect(); } catch {}
            }
            if (audioContext && audioContext.state !== "closed") {
                audioContext.close().catch(() => {});
            }
        };
    }, [askForUsername, audio]);

    // Check authentication: If no valid token, redirect to /auth immediately
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token || token === "undefined" || token === "null" || token.trim() === "") {
            window.location.replace("/auth");
        }
    }, []);

    // Get permissions on initial load
    useEffect(() => {
        getPermissions();

        return () => {
            // Cleanup on component unmount
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(t => t.stop());
                    window.localStream = null;
                }
            } catch {}

            try {
                Object.values(connectionsRef.current).forEach(pc => {
                    try { pc.close(); } catch {}
                });
                connectionsRef.current = {};
                iceCandidatesQueueRef.current = {};
                remoteStreamsRef.current = {};
            } catch {}

            try {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            } catch {}
        };
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
                video: videoConstraints,
                audio: audioConstraints
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
            console.warn("HD media request failed, attempting standard media fallback:", error);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                window.localStream = stream;
                if (localVideoref.current) localVideoref.current.srcObject = stream;
                setVideoAvailable(true);
                setAudioAvailable(true);
                setVideo(true);
                setAudio(true);
            } catch (err2) {
                console.warn("Joint media failed, trying video only / audio only:", err2);
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    window.localStream = videoStream;
                    if (localVideoref.current) localVideoref.current.srcObject = videoStream;
                    setVideoAvailable(true);
                    setVideo(true);
                } catch {
                    setVideoAvailable(false);
                    setVideo(false);
                }
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    if (!window.localStream) {
                        window.localStream = audioStream;
                    } else {
                        audioStream.getAudioTracks().forEach(track => window.localStream.addTrack(track));
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

    // Fallback silent/black tracks if device has no camera or microphone
    const silence = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            const ctx = new AudioContextClass();
            const oscillator = ctx.createOscillator();
            const dst = ctx.createMediaStreamDestination();
            oscillator.connect(dst);
            oscillator.start();
            ctx.resume();
            return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
        } catch {
            return null;
        }
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        try {
            const canvas = Object.assign(document.createElement("canvas"), { width, height });
            canvas.getContext('2d').fillRect(0, 0, width, height);
            const stream = canvas.captureStream(15);
            return Object.assign(stream.getVideoTracks()[0], { enabled: false });
        } catch {
            return null;
        }
    };

    const blackSilence = () => {
        const tracks = [];
        const b = black();
        const s = silence();
        if (b) tracks.push(b);
        if (s) tracks.push(s);
        return new MediaStream(tracks);
    };

    // WebRTC Peer Connection Factory
    const createPeerConnection = (targetSocketId) => {
        if (connectionsRef.current[targetSocketId]) {
            return connectionsRef.current[targetSocketId];
        }

        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[targetSocketId] = pc;

        // Send local ICE candidates to the target peer
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit(
                    'signal',
                    targetSocketId,
                    JSON.stringify({ ice: event.candidate })
                );
            }
        };

        // Standard WebRTC ontrack handler
        pc.ontrack = (event) => {
            console.log(`Received track [${event.track.kind}] from ${targetSocketId}`);
            if (!remoteStreamsRef.current[targetSocketId]) {
                remoteStreamsRef.current[targetSocketId] = new MediaStream();
            }

            const currentStream = remoteStreamsRef.current[targetSocketId];

            if (event.streams && event.streams[0]) {
                event.streams[0].getTracks().forEach((track) => {
                    if (!currentStream.getTracks().some((t) => t.id === track.id)) {
                        currentStream.addTrack(track);
                    }
                });
            } else if (event.track) {
                if (!currentStream.getTracks().some((t) => t.id === event.track.id)) {
                    currentStream.addTrack(event.track);
                }
            }

            // Fresh MediaStream instance guarantees React re-render and video decoder re-attachment
            const newStream = new MediaStream(currentStream.getTracks());

            setVideos((prevVideos) => {
                const filtered = prevVideos.filter((v) => v.socketId !== targetSocketId);
                return [...filtered, { socketId: targetSocketId, stream: newStream }];
            });
        };

        // Attach local tracks
        const localStreamToUse = window.localStream || blackSilence();
        localStreamToUse.getTracks().forEach((track) => {
            try {
                pc.addTrack(track, localStreamToUse);
            } catch (err) {
                console.warn(`Could not add track ${track.kind}:`, err);
            }
        });

        pc.onconnectionstatechange = () => {
            console.log(`Peer ${targetSocketId} connection state:`, pc.connectionState);
        };

        return pc;
    };

    // Process incoming signaling messages (SDP offers/answers and ICE candidates)
    const gotMessageFromServer = async (fromId, message) => {
        try {
            if (fromId === socketIdRef.current) return;
            const signal = JSON.parse(message);

            let pc = connectionsRef.current[fromId];
            if (!pc) {
                pc = createPeerConnection(fromId);
            }

            // Handle SDP offer or answer
            if (signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                // Process any ICE candidates that were queued while remoteDescription was null
                if (iceCandidatesQueueRef.current[fromId]?.length > 0) {
                    for (const cand of iceCandidatesQueueRef.current[fromId]) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (e) {
                            console.warn("Queued ICE candidate application note:", e);
                        }
                    }
                    iceCandidatesQueueRef.current[fromId] = [];
                }

                // If offer, generate and transmit answer
                if (signal.sdp.type === 'offer') {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    if (socketRef.current) {
                        socketRef.current.emit(
                            'signal',
                            fromId,
                            JSON.stringify({ sdp: pc.localDescription })
                        );
                    }
                }
            }

            // Handle ICE candidate
            if (signal.ice) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
                    } catch (err) {
                        console.warn("Failed to add ICE candidate directly:", err);
                    }
                } else {
                    // Buffer ICE candidate until remote description is set
                    if (!iceCandidatesQueueRef.current[fromId]) {
                        iceCandidatesQueueRef.current[fromId] = [];
                    }
                    iceCandidatesQueueRef.current[fromId].push(signal.ice);
                }
            }
        } catch (err) {
            console.error("gotMessageFromServer error:", err);
        }
    };

    // Socket server connection and event bindings
    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: server_url.startsWith("https") });

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
                    return updated;
                });
                if (connectionsRef.current[id]) {
                    try {
                        connectionsRef.current[id].close();
                    } catch {}
                    delete connectionsRef.current[id];
                }
                delete iceCandidatesQueueRef.current[id];
                delete remoteStreamsRef.current[id];
            });

            const handleUserJoined = (newUserId, clients) => {
                console.log("Participant joined room:", newUserId, "All clients:", clients);

                // If I am the newly joined user, create offer to all existing peers in the room
                if (newUserId === socketIdRef.current) {
                    clients.forEach((otherId) => {
                        if (otherId === socketIdRef.current) return;
                        const pc = createPeerConnection(otherId);

                        pc.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        })
                            .then(async (description) => {
                                await pc.setLocalDescription(description);
                                if (socketRef.current) {
                                    socketRef.current.emit(
                                        'signal',
                                        otherId,
                                        JSON.stringify({ sdp: pc.localDescription })
                                    );
                                }
                            })
                            .catch((err) => console.error("Error creating offer:", err));
                    });
                } else {
                    // Another user joined. Ensure a peer connection exists for them
                    if (!connectionsRef.current[newUserId]) {
                        createPeerConnection(newUserId);
                    }
                }
            };

            // Register handler for user-joined
            socketRef.current.on('user-joined', handleUserJoined);
            // Backward compatibility if older backend emits user-join
            socketRef.current.on('user-join', (id, clients) => {
                if (!connectionsRef.current[id] || id === socketIdRef.current) {
                    handleUserJoined(id, clients);
                }
            });
        });
    };

    const getMedia = () => {
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(track => {
                track.enabled = audio;
            });
            window.localStream.getVideoTracks().forEach(track => {
                track.enabled = video;
            });
        }
        connectToSocketServer();
    };

    const handleVideo = () => {
        const nextState = !video;
        setVideo(nextState);
        if (window.localStream) {
            window.localStream.getVideoTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
    };

    const handleAudio = () => {
        const nextState = !audio;
        setAudio(nextState);
        if (window.localStream) {
            window.localStream.getAudioTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
    };

    // Clean screen share using standard RTCRtpSender.replaceTrack
    const handleScreen = async () => {
        if (!screen) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always",
                        width: { ideal: 1920, max: 2560 },
                        height: { ideal: 1080, max: 1440 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: true
                });

                const screenVideoTrack = screenStream.getVideoTracks()[0];
                if (!screenVideoTrack) return;

                setScreen(true);

                // Save camera track to restore later
                const oldVideoTrack = window.localStream?.getVideoTracks()[0];
                screenOriginalVideoTrackRef.current = oldVideoTrack;

                // Replace video track on all peer connections
                Object.values(connectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenVideoTrack).catch(e => console.warn(e));
                    }
                });

                if (localVideoref.current) {
                    localVideoref.current.srcObject = screenStream;
                }

                screenVideoTrack.onended = () => {
                    stopScreenSharing();
                };
            } catch (err) {
                console.warn("Screen share was cancelled or failed:", err);
                setScreen(false);
            }
        } else {
            stopScreenSharing();
        }
    };

    const stopScreenSharing = () => {
        setScreen(false);
        const originalTrack = screenOriginalVideoTrackRef.current;
        if (originalTrack) {
            Object.values(connectionsRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(originalTrack).catch(e => console.warn(e));
                }
            });
        }
        if (localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }
        } catch {}

        try {
            Object.values(connectionsRef.current).forEach(pc => {
                try { pc.close(); } catch {}
            });
            connectionsRef.current = {};
            iceCandidatesQueueRef.current = {};
            remoteStreamsRef.current = {};
        } catch {}

        try {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch {}

        window.location.href = "/home";
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

    const connect = async () => {
        const trimmed = username.trim();
        if (!trimmed) {
            setUsernameError("Please enter your name to join the call");
            return;
        }
        setUsernameError("");
        if (!window.localStream) {
            await getPermissions();
        }
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
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button 
                                        type="button"
                                        className={styles.lobbyLogoutBtn}
                                        onClick={() => {
                                            try {
                                                if (window.localStream) {
                                                    window.localStream.getTracks().forEach(t => t.stop());
                                                }
                                            } catch {}
                                            window.location.href = "/home";
                                        }}
                                    >
                                        Home
                                    </button>
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
                                    {video ? "Camera On" : "Camera Off"} • {audio ? (micLevel > 4 ? "Mic Active (Speaking 🟢)" : "Mic On") : "Mic Muted"}
                                    {audio && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "6px", verticalAlign: "middle" }}>
                                            <span style={{ width: "3px", height: `${Math.max(4, Math.min(18, micLevel * 0.25))}px`, backgroundColor: micLevel > 4 ? "#46d362" : "#8b949e", borderRadius: "1px" }} />
                                            <span style={{ width: "3px", height: `${Math.max(4, Math.min(22, micLevel * 0.35))}px`, backgroundColor: micLevel > 4 ? "#46d362" : "#8b949e", borderRadius: "1px" }} />
                                            <span style={{ width: "3px", height: `${Math.max(4, Math.min(16, micLevel * 0.2))}px`, backgroundColor: micLevel > 4 ? "#46d362" : "#8b949e", borderRadius: "1px" }} />
                                        </span>
                                    )}
                                </span>
                                <div>
                                    <IconButton
                                        size="small"
                                        disabled={!videoAvailable}
                                        onClick={handleVideo}
                                        style={{ color: video ? "#ff9839" : "#f85149", background: "rgba(0,0,0,0.6)", marginRight: "6px" }}
                                    >
                                        {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        disabled={!audioAvailable}
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
                                <RemoteVideoTile key={remote.socketId} remote={remote} />
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
                            disabled={!videoAvailable}
                            className={`${styles.controlBtn} ${!video ? styles.controlBtnOff : ''}`}
                            title={videoAvailable ? (video ? "Turn off camera" : "Turn on camera") : "No camera detected"}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleAudio}
                            disabled={!audioAvailable}
                            className={`${styles.controlBtn} ${!audio ? styles.controlBtnOff : ''}`}
                            title={audioAvailable ? (audio ? "Mute microphone" : "Unmute microphone") : "No microphone detected"}
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