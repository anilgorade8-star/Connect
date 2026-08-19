import { useEffect, useRef, useState } from "react";
import "../styels/VideoMeet.css";
import { TextField } from "@mui/material";
import Button from "@mui/material/Button";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const peerConfigConnection = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function VideoMeet() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoRef = useRef(null);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const getPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setVideoAvailable(stream.getVideoTracks().length > 0);
      setAudioAvailable(stream.getAudioTracks().length > 0);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Unable to access camera or microphone:", error);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }

    setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));
  };

  useEffect(() => {
    getPermission();
  }, []);

  const getUserMediaSuccess = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch((error) => console.error(error));
      return;
    }
    localVideoRef.current?.srcObject
      ?.getTracks()
      .forEach((track) => track.stop());
  };

  useEffect(() => {
    getUserMedia();
  }, [audio, video]);

  const connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
  };
  // Todo
  let addmessage = () => {};
  let gotMessageFromServer = (fromId, message) => {};

  const connectToSocketServer = () => {
    socketRef.current = io.connect(SERVER_URL, { secure: false });
    socketRef.current.on("signal", getMessageFromServer);
    socketRef.current.on("connnect", () => {
      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;
      socketIdRef.current.on("chat-message", addmessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      socketIdRef.current.on("user-join", (id, client) => {
        client.forEach((socketListId) => {
          connect[socketListId] = new RTCPeerConnection(peerConfigConnection);
          connect[socketListId].onicecandidate = (event) => {
            if (event.candidate == null) {
              socketIdRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }

            connect[socketListId].onaddstream = (event) => {
              let videoExist = localVideoRef.current.find(
                (video) => video.socketId === socketListId,
              );

              if (videoExist) {
                setVideo((video) => {
                  const updataVideo = video.map(
                    video.socketId === socketListId
                      ? { ...video, stream: event.stream }
                      : video,
                  );
                  localVideoRef.current = updataVideo;
                  return updataVideo;
                });
              } else {
                let newvideo = {
                  socketId: socketListId,
                  stream: event.stream,
                  autoPlay: true,
                  playsInline: true,
                };
                setVideo((videos) => {
                  const updatedvideo = [...videos, newvideo];
                  localVideoRef.current = updatedvideo;
                  return updatedvideo;
                });
              }
            };

            if (window.localStream != undefined && window.localStream != null) {
              connections[socketListId].addstream(window.localStream);
            } else {
              // let blacksilence
            }
          };
        });
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addstream(window.localStream);
            } catch (e) {
              connections[id2].createOffer().then((description) => {
                connections[id2]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({ sdp: connections[id2].localDescription }),
                    );
                  })
                  .catch((error) => console.log(error));
              });
            }
          }
        }
      });
    });
  };

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter the lobby</h2>
          <TextField
            id="outlined-basic"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            label="Username"
            variant="outlined"
          />
          <Button variant="contained" onClick={connect} color="success">
            Connect
          </Button>
          <div>
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
        </div>
      ) : (
        <div>Connected as {username}</div>
      )}
    </div>
  );
}

export default VideoMeet;
