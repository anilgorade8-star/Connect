import {
  useEffect,
  useRef,
  useState,
} from "react";

import "../styels/VideoMeet.css";

import { TextField } from "@mui/material";
import Button from "@mui/material/Button";

import { io } from "socket.io-client";

// ==========================================
// SERVER
// ==========================================

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:8080";

// ==========================================
// WEBRTC CONFIG
// ==========================================

const peerConfigConnection = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function VideoMeet() {
  // ========================================
  // REFS
  // ========================================

  const socketRef = useRef(null);

  const socketIdRef = useRef(null);

  const localVideoRef = useRef(null);

  const connections = useRef({});

  // IMPORTANT:
  // ICE candidates can arrive before
  // remote description.
  const iceCandidatesQueue =
    useRef({});

  // ========================================
  // STATES
  // ========================================

  const [video, setVideo] =
    useState(true);

  const [audio, setAudio] =
    useState(true);

  const [videos, setVideos] =
    useState([]);

  const [videoAvailable, setVideoAvailable] =
    useState(true);

  const [audioAvailable, setAudioAvailable] =
    useState(true);

  const [screenAvailable, setScreenAvailable] =
    useState(false);

  const [askForUsername, setAskForUsername] =
    useState(true);

  const [username, setUsername] =
    useState("");

  // ========================================
  // GET PERMISSION
  // ========================================

  const getPermission = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true,
          }
        );

      console.log(
        "CAMERA + MIC READY"
      );

      setVideoAvailable(
        stream.getVideoTracks().length > 0
      );

      setAudioAvailable(
        stream.getAudioTracks().length > 0
      );

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          stream;
      }
    } catch (error) {
      console.error(
        "CAMERA/MIC ERROR:",
        error
      );

      setVideoAvailable(false);
      setAudioAvailable(false);
    }

    setScreenAvailable(
      Boolean(
        navigator.mediaDevices
          ?.getDisplayMedia
      )
    );
  };

  // ========================================
  // INITIAL PERMISSION
  // ========================================

  useEffect(() => {
    getPermission();

    return () => {
      if (window.localStream) {
        window.localStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ========================================
  // MEDIA SUCCESS
  // ========================================

  const getUserMediaSuccess = (
    stream
  ) => {
    console.log(
      "NEW LOCAL STREAM"
    );

    window.localStream = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        stream;
    }

    // ======================================
    // UPDATE EXISTING PEERS
    // ======================================

    Object.keys(
      connections.current
    ).forEach((id) => {
      if (
        id === socketIdRef.current
      ) {
        return;
      }

      const peer =
        connections.current[id];

      if (!peer) {
        return;
      }

      stream.getTracks().forEach(
        (track) => {
          const sender =
            peer
              .getSenders()
              .find(
                (sender) =>
                  sender.track &&
                  sender.track.kind ===
                    track.kind
              );

          if (sender) {
            sender
              .replaceTrack(track)
              .catch((error) => {
                console.error(
                  "REPLACE TRACK ERROR:",
                  error
                );
              });
          } else {
            peer.addTrack(
              track,
              stream
            );
          }
        }
      );
    });
  };

  // ========================================
  // GET USER MEDIA
  // ========================================

  const getUserMedia = () => {
    if (
      (video &&
        videoAvailable) ||
      (audio &&
        audioAvailable)
    ) {
      navigator.mediaDevices
        .getUserMedia({
          video:
            video &&
            videoAvailable,

          audio:
            audio &&
            audioAvailable,
        })
        .then(
          getUserMediaSuccess
        )
        .catch((error) => {
          console.error(
            "GET USER MEDIA ERROR:",
            error
          );
        });

      return;
    }

    if (
      localVideoRef.current?.srcObject
    ) {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localVideoRef.current.srcObject =
        null;
    }
  };

  // ========================================
  // MEDIA CHANGE
  // ========================================

  useEffect(() => {
    if (!askForUsername) {
      getUserMedia();
    }
  }, [audio, video]);

  // ========================================
  // RESTORE LOCAL VIDEO
  // ========================================

  useEffect(() => {
    if (
      !askForUsername &&
      localVideoRef.current &&
      window.localStream
    ) {
      localVideoRef.current.srcObject =
        window.localStream;
    }
  }, [askForUsername]);

  // ========================================
  // CONNECT BUTTON
  // ========================================

  const connect = () => {
    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    console.log(
      "CONNECTING USER:",
      username
    );

    setAskForUsername(false);

    connectToSocketServer();
  };

  // ========================================
  // CHAT
  // ========================================

  const addmessage = () => {};

  // ========================================
  // SIGNAL FROM SERVER
  // ========================================

  const gotMessageFromServer = async (
    fromId,
    message
  ) => {
    try {
      console.log(
        "================================"
      );

      console.log(
        "SIGNAL RECEIVED FROM:",
        fromId
      );

      const signal =
        JSON.parse(message);

      const peer =
        connections.current[fromId];

      if (!peer) {
        console.log(
          "PEER NOT FOUND:",
          fromId
        );

        return;
      }

      // ======================================
      // SDP
      // ======================================

      if (signal.sdp) {
        console.log(
          "RECEIVED SDP:",
          signal.sdp.type
        );

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            signal.sdp
          )
        );

        console.log(
          "REMOTE DESCRIPTION SET:",
          fromId
        );

        // ====================================
        // ADD QUEUED ICE
        // ====================================

        if (
          iceCandidatesQueue.current[
            fromId
          ]
        ) {
          console.log(
            "ADDING QUEUED ICE:",
            fromId
          );

          for (
            const candidate of
              iceCandidatesQueue.current[
                fromId
              ]
          ) {
            try {
              await peer.addIceCandidate(
                new RTCIceCandidate(
                  candidate
                )
              );
            } catch (error) {
              console.error(
                "QUEUED ICE ERROR:",
                error
              );
            }
          }

          delete iceCandidatesQueue.current[
            fromId
          ];
        }

        // ====================================
        // OFFER -> ANSWER
        // ====================================

        if (
          signal.sdp.type ===
          "offer"
        ) {
          console.log(
            "CREATING ANSWER FOR:",
            fromId
          );

          const answer =
            await peer.createAnswer();

          await peer.setLocalDescription(
            answer
          );

          console.log(
            "SENDING ANSWER TO:",
            fromId
          );

          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({
              sdp:
                peer.localDescription,
            })
          );
        }
      }

      // ======================================
      // ICE CANDIDATE
      // ======================================

      if (signal.ice) {
        console.log(
          "RECEIVED ICE FROM:",
          fromId
        );

        // Remote description not ready
        if (
          !peer.remoteDescription ||
          !peer.remoteDescription.type
        ) {
          console.log(
            "QUEUE ICE:",
            fromId
          );

          if (
            !iceCandidatesQueue.current[
              fromId
            ]
          ) {
            iceCandidatesQueue.current[
              fromId
            ] = [];
          }

          iceCandidatesQueue.current[
            fromId
          ].push(signal.ice);

          return;
        }

        // Remote description ready
        try {
          await peer.addIceCandidate(
            new RTCIceCandidate(
              signal.ice
            )
          );

          console.log(
            "ICE ADDED:",
            fromId
          );
        } catch (error) {
          console.error(
            "ICE ERROR:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "SIGNAL ERROR:",
        error
      );
    }
  };

  // ========================================
  // CREATE PEER CONNECTION
  // ========================================

  const createPeerConnection = (
    socketListId
  ) => {
    console.log(
      "CREATING PEER:",
      socketListId
    );

    const peer =
      new RTCPeerConnection(
        peerConfigConnection
      );

    connections.current[
      socketListId
    ] = peer;

    // ======================================
    // ICE
    // ======================================

    peer.onicecandidate = (
      event
    ) => {
      if (event.candidate) {
        console.log(
          "SEND ICE TO:",
          socketListId
        );

        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({
            ice: event.candidate,
          })
        );
      }
    };

    // ======================================
    // REMOTE TRACK
    // ======================================

    peer.ontrack = (
      event
    ) => {
      console.log(
        "================================"
      );

      console.log(
        "REMOTE TRACK RECEIVED:",
        socketListId
      );

      const stream =
        event.streams[0];

      if (!stream) {
        console.log(
          "NO REMOTE STREAM"
        );

        return;
      }

      setVideos(
        (currentVideos) => {
          const existing =
            currentVideos.find(
              (item) =>
                item.socketId ===
                socketListId
            );

          if (existing) {
            return currentVideos.map(
              (item) =>
                item.socketId ===
                socketListId
                  ? {
                      ...item,
                      stream:
                        stream,
                    }
                  : item
            );
          }

          return [
            ...currentVideos,
            {
              socketId:
                socketListId,

              stream:
                stream,
            },
          ];
        }
      );
    };

    // ======================================
    // CONNECTION STATE
    // ======================================

    peer.onconnectionstatechange =
      () => {
        console.log(
          "CONNECTION STATE:",
          socketListId,
          peer.connectionState
        );
      };

    // ======================================
    // ICE STATE
    // ======================================

    peer.oniceconnectionstatechange =
      () => {
        console.log(
          "ICE STATE:",
          socketListId,
          peer.iceConnectionState
        );
      };

    // ======================================
    // ICE GATHERING
    // ======================================

    peer.onicegatheringstatechange =
      () => {
        console.log(
          "ICE GATHERING:",
          socketListId,
          peer.iceGatheringState
        );
      };

    // ======================================
    // ADD LOCAL STREAM
    // ======================================

    if (window.localStream) {
      console.log(
        "ADDING LOCAL TRACKS TO:",
        socketListId
      );

      window.localStream
        .getTracks()
        .forEach((track) => {
          console.log(
            "ADDING TRACK:",
            track.kind
          );

          peer.addTrack(
            track,
            window.localStream
          );
        });
    }

    return peer;
  };

  // ========================================
  // SOCKET CONNECTION
  // ========================================

  const connectToSocketServer = () => {
    console.log(
      "CONNECTING SOCKET:",
      SERVER_URL
    );

    socketRef.current = io(
      SERVER_URL,
      {
        transports: [
          "websocket",
          "polling",
        ],

        withCredentials: true,
      }
    );

    // ======================================
    // SIGNAL
    // ======================================

    socketRef.current.on(
      "signal",
      gotMessageFromServer
    );

    // ======================================
    // SOCKET CONNECT
    // ======================================

    socketRef.current.on(
      "connect",
      () => {
        console.log(
          "================================"
        );

        console.log(
          "SOCKET CONNECTED:",
          socketRef.current.id
        );

        socketIdRef.current =
          socketRef.current.id;

        // ==================================
        // JOIN ROOM
        // ==================================

        socketRef.current.emit(
          "join-call",
          window.location.href
        );

        console.log(
          "JOIN CALL SENT:",
          window.location.href
        );
      }
    );

    // ======================================
    // USER JOIN
    // ======================================

    socketRef.current.on(
      "user-join",
      async (
        id,
        clients
      ) => {
        try {
          console.log(
            "================================"
          );

          console.log(
            "USER JOIN:",
            id
          );

          console.log(
            "CLIENTS:",
            clients
          );

          // ==================================
          // CREATE PEERS
          // ==================================

          clients.forEach(
            (socketListId) => {
              if (
                socketListId ===
                socketIdRef.current
              ) {
                return;
              }

              if (
                connections.current[
                  socketListId
                ]
              ) {
                return;
              }

              createPeerConnection(
                socketListId
              );
            }
          );

          // ==================================
          // NEW USER CREATES OFFER
          // ==================================

          if (
            id === socketIdRef.current
          ) {
            for (
              const id2 of Object.keys(
                connections.current
              )
            ) {
              if (
                id2 ===
                socketIdRef.current
              ) {
                continue;
              }

              const peer =
                connections.current[
                  id2
                ];

              if (!peer) {
                continue;
              }

              console.log(
                "CREATING OFFER:",
                id2
              );

              const offer =
                await peer.createOffer();

              await peer.setLocalDescription(
                offer
              );

              console.log(
                "SENDING OFFER:",
                id2
              );

              socketRef.current.emit(
                "signal",
                id2,
                JSON.stringify({
                  sdp:
                    peer.localDescription,
                })
              );
            }
          }
        } catch (error) {
          console.error(
            "USER JOIN ERROR:",
            error
          );
        }
      }
    );

    // ======================================
    // USER LEFT
    // ======================================

    socketRef.current.on(
      "user-left",
      (id) => {
        console.log(
          "USER LEFT:",
          id
        );

        setVideos(
          (currentVideos) =>
            currentVideos.filter(
              (video) =>
                video.socketId !==
                id
            )
        );

        if (
          connections.current[id]
        ) {
          connections.current[
            id
          ].close();

          delete connections.current[
            id
          ];
        }

        delete iceCandidatesQueue
          .current[id];
      }
    );

    // ======================================
    // CHAT
    // ======================================

    socketRef.current.on(
      "chat-message",
      addmessage
    );

    // ======================================
    // SOCKET ERROR
    // ======================================

    socketRef.current.on(
      "connect_error",
      (error) => {
        console.error(
          "SOCKET CONNECTION ERROR:",
          error
        );
      }
    );

    // ======================================
    // SOCKET DISCONNECT
    // ======================================

    socketRef.current.on(
      "disconnect",
      (reason) => {
        console.log(
          "SOCKET DISCONNECTED:",
          reason
        );
      }
    );
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>
            Enter the lobby
          </h2>

          <TextField
            id="outlined-basic"
            name="username"
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value
              )
            }
            label="Username"
            variant="outlined"
          />

          <Button
            variant="contained"
            onClick={connect}
            color="success"
          >
            Connect
          </Button>

          <div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>
      ) : (
        <div>
          {/* =================================
              LOCAL VIDEO
          ================================= */}

          <div>
            <h3>
              My Video
            </h3>

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
            />
          </div>

          {/* =================================
              REMOTE VIDEOS
          ================================= */}

          <div>
            <h3>
              Remote Videos
            </h3>

            {videos.length === 0 && (
              <p>
                Waiting for another user...
              </p>
            )}

            {videos.map((video) => (
              <div
                key={
                  video.socketId
                }
              >
                <p>
                  User:{" "}
                  {
                    video.socketId
                  }
                </p>

                <video
                  data-socket={
                    video.socketId
                  }
                  ref={(ref) => {
                    if (
                      ref &&
                      video.stream
                    ) {
                      ref.srcObject =
                        video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeet;