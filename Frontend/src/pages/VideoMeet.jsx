import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";

const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

const Icon = ({ children }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">{children}</svg>;
const VideocamIcon = () => <Icon><path d="M15 8v8l5 3V5l-5 3Zm-2-3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /></Icon>;
const VideocamOffIcon = () => <Icon><path d="m3.3 2 18.7 18.7-1.3 1.3-3.1-3.1H4a2 2 0 0 1-2-2V7c0-.5.2-1 .5-1.4L2 5.1 3.3 2Zm11.6 5.7 5.1-3v14.6l-2.8-1.7-2.2-2.2V7.7Z" /></Icon>;
const MicIcon = () => <Icon><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5.3-3a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 6 6.9V21H8v2h8v-2h-3v-3.1A7 7 0 0 0 19 11h-1.7Z" /></Icon>;
const MicOffIcon = () => <Icon><path d="m4.3 3-1.4 1.4 7.1 7.1V14a3 3 0 0 0 4.9 2.3l1.8 1.8A7 7 0 0 0 19 11h-1.7a5.3 5.3 0 0 1-.5 2.2L4.3 3ZM12 2a3 3 0 0 0-3 3v.8l6 6V5a3 3 0 0 0-3-3ZM8 21v2h8v-2h-3v-3.1c-.3 0-.7.1-1 .1s-.7 0-1-.1V21H8Z" /></Icon>;
const ScreenShareIcon = () => <Icon><path d="M13 3 8 8l1.4 1.4 2.6-2.6V15h2V6.8l2.6 2.6L18 8l-5-5ZM4 12H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8h-2v8H4v-8Z" /></Icon>;
const StopScreenShareIcon = () => <Icon><path d="m4.3 3-1.4 1.4L7.5 9H2v11a2 2 0 0 0 2 2h16c.5 0 1-.2 1.4-.6L22 22l-1.4-1.4L4.3 3ZM20 2H7.7l2 2H20v7.3l2 2V4a2 2 0 0 0-2-2Z" /></Icon>;
const CallEndIcon = () => <Icon><path d="M12 9c-3.1 0-6 1-8.4 2.7L5 14.1c.4.7 1.1 1.2 1.9 1.2h1.3v3.2h3.6v-3.2h.4v3.2h3.6v-3.2h1.3c.8 0 1.5-.4 1.9-1.2l1.4-2.4A15.6 15.6 0 0 0 12 9Z" /></Icon>;
const ChatIcon = () => <Icon><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 1-2Zm3 7h10V8H7v2Zm0 4h7v-2H7v2Z" /></Icon>;
const PeopleIcon = () => <Icon><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13Zm8 0c-.3 0-.7 0-1.1.1 1.1.8 1.9 1.9 1.9 3.4V19h6v-2.5C22.8 14.2 18.3 13 16 13Z" /></Icon>;
const SendIcon = () => <Icon><path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" /></Icon>;
const MoreIcon = () => <Icon><path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /></Icon>;
const CloseIcon = () => <Icon><path d="m18.3 5.7-1.4-1.4L12 10.6 7.1 5.7 5.7 7.1l4.9 4.9-4.9 4.9 1.4 1.4 4.9-4.9 4.9 4.9 1.4-1.4-4.9-4.9 4.9-4.9Z" /></Icon>;

var connections = {};

const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
}

export default function VideoMeetComponent() {

  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(false);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([])

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([])

  let [videos, setVideos] = useState([])

  // TODO
  // if(isChrome() === false) {


  // }

  useEffect(() => { getPermissions(); }, [])

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => { })
          .catch((e) => console.log(e))
      }
    }
  }

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log('Video permission granted');
      } else {
        setVideoAvailable(false);
        console.log('Video permission denied');
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log('Audio permission granted');
      } else {
        setAudioAvailable(false);
        console.log('Audio permission denied');
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);

    }


  }, [video, audio])
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();

  }




  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then((description) => {
        console.log(description)
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoref.current.srcObject = window.localStream

      for (let id in connections) {
        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
            })
            .catch(e => console.log(e))
        })
      }
    })
  }

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => { })
        .catch((e) => console.log(e))
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { }
    }
  }





  let getDislayMediaSuccess = (stream) => {
    console.log("HERE")
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false)

      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoref.current.srcObject = window.localStream

      getUserMedia()

    })
  }

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
              }).catch(e => console.log(e))
            }).catch(e => console.log(e))
          }
        }).catch(e => console.log(e))
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
      }
    }
  }




  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })

    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id

      socketRef.current.on('chat-message', addMessage)

      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id))
      })

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {

          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
          // Wait for their ice candidate       
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
            }
          }

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(video => video.socketId === socketListId);

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos(videos => {
                const updatedVideos = videos.map(video =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
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


          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream)
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            connections[socketListId].addStream(window.localStream)
          }
        })

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue

            try {
              connections[id2].addStream(window.localStream)
            } catch (e) { }

            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                })
                .catch(e => console.log(e))
            })
          }
        }
      })
    })
  }

  let silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    let stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

  let handleVideo = () => {
    setVideo(!video);
    // getUserMedia();
  }
  let handleAudio = () => {
    setAudio(!audio)
    // getUserMedia();
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen])
  let handleScreen = () => {
    setScreen(!screen);
  }

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    } catch (e) { }
    window.location.href = "/"
  }

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  }
  let closeChat = () => {
    setModal(false);
  }
  let handleMessage = (e) => {
    setMessage(e.target.value);
  }

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };



  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current?.emit('chat-message', message, username)
    setMessage("");

    // this.setState({ message: "", sender: username })
  }


  let connect = () => {
    setAskForUsername(false);
    getMedia();
  }


  const initials = (name) => (name || "You").slice(0, 2).toUpperCase();
  const participantCount = videos.length + 1;

  return askForUsername ? (
    <main className={styles.lobby}>
      <section className={styles.lobbyPreview}>
        <div className={styles.brand}><span className={styles.brandMark}>●</span> zoomly</div>
        <div className={styles.previewFrame}><video ref={localVideoref} autoPlay muted /><span className={styles.previewLabel}>Preview</span></div>
      </section>
      <section className={styles.lobbyForm}>
        <p className={styles.kicker}>Ready to join?</p>
        <h1>Join your meeting</h1><p>Enter your display name to connect with everyone in the room.</p>
        <label htmlFor="name">Your name</label>
        <input id="name" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && connect()} placeholder="e.g. Alex Morgan" autoFocus />
        <button className={styles.joinButton} onClick={connect}>Join meeting <span>→</span></button>
      </section>
    </main>
  ) : (
    <main className={styles.meetingPage}>
      <header className={styles.topbar}>
        <div className={styles.brand}><span className={styles.brandMark}>●</span> zoomly</div>
        <div className={styles.meetingTitle}><strong>Design Team Meeting</strong><span>•</span><span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span></div>
        <button className={styles.moreButton} aria-label="More meeting options"><MoreIcon /></button>
      </header>
      <section className={`${styles.meetingShell} ${showModal ? styles.chatOpen : ''}`}>
        <div className={styles.stage}>
          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />
          <div className={styles.stageShade} />
          <div className={styles.stageInfo}><span className={styles.liveDot} /> {username || 'You'} <span className={styles.speaking}>You</span></div>
        </div>
        <aside className={styles.sideRail} aria-label="Participants">
          <div className={styles.railHeading}><span>In this meeting</span><b>{participantCount}</b></div>
          <div className={styles.localTile}><div className={styles.avatar}>{initials(username)}</div><span>{username || 'You'} <small>(You)</small></span><MicIcon /></div>
          {videos.length ? videos.map((remoteVideo, index) => (
            <div className={styles.remoteTile} key={remoteVideo.socketId}>
              <video data-socket={remoteVideo.socketId} ref={ref => { if (ref && remoteVideo.stream) ref.srcObject = remoteVideo.stream; }} autoPlay />
              <span>Guest {index + 1}</span>
            </div>
          )) : <div className={styles.emptyParticipants}><PeopleIcon /><span>Waiting for others to join</span></div>}
        </aside>
        {showModal && <aside className={styles.chatRoom}>
          <div className={styles.chatHeader}><div><h2>Meeting chat</h2><p>Everyone in this meeting</p></div><button onClick={closeChat} aria-label="Close chat"><CloseIcon /></button></div>
          <div className={styles.chattingDisplay}>{messages.length ? messages.map((item, index) => <article className={styles.message} key={index}><div className={styles.messageAvatar}>{initials(item.sender)}</div><div><b>{item.sender || 'Guest'}</b><p>{item.data}</p></div></article>) : <div className={styles.noMessages}><ChatIcon /><h3>Start the conversation</h3><p>Messages sent here are visible to everyone.</p></div>}</div>
          <form className={styles.chattingArea} onSubmit={e => { e.preventDefault(); sendMessage(); }}><input value={message} onChange={handleMessage} placeholder="Message everyone" /><button type="submit" aria-label="Send message"><SendIcon /></button></form>
        </aside>}
      </section>
      <div className={styles.buttonContainers}>
        <button className={!audio ? styles.controlOff : ''} onClick={handleAudio} title="Toggle microphone">{audio ? <MicIcon /> : <MicOffIcon />}<span>{audio ? 'Mute' : 'Unmute'}</span></button>
        <button className={!video ? styles.controlOff : ''} onClick={handleVideo} title="Toggle camera">{video ? <VideocamIcon /> : <VideocamOffIcon />}<span>{video ? 'Stop video' : 'Start video'}</span></button>
        {screenAvailable && <button onClick={handleScreen} title="Share screen">{screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}<span>Share</span></button>}
        <button className={showModal ? styles.controlActive : ''} onClick={openChat} title="Open chat"><ChatIcon />{newMessages > 0 && <i>{newMessages}</i>}<span>Chat</span></button>
        <button className={styles.leaveButton} onClick={handleEndCall}><CallEndIcon /><span>Leave</span></button>
      </div>
    </main>
  )
}
