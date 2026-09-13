const isProduction =
  import.meta.env.PROD ||
  (typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1");

export const server =
  import.meta.env.VITE_SERVER_URL ||
  (isProduction
    ? "https://connect-1-6be8.onrender.com"
    : "http://localhost:8080");

// Dynamic ICE servers configuration supporting environment-variable TURN credentials
export const getIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ];

  // Check if custom TURN server credentials are provided via Vite environment variables
  const turnUrls = import.meta.env.VITE_TURN_URLS;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    const urlsArray = turnUrls.split(",").map((u) => u.trim());
    servers.push({
      urls: urlsArray,
      username: turnUsername,
      credential: turnCredential
    });
  } else {
    // Open Relay Project community fallback for reliable cross-network connectivity
    servers.push(
      {
        urls: [
          "turn:relay.metered.ca:80",
          "turn:relay.metered.ca:443",
          "turn:relay.metered.ca:443?transport=tcp"
        ],
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    );
  }

  return servers;
};

export default server;
