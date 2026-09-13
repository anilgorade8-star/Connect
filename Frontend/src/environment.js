const IS_PROD = import.meta.env.PROD;

const server =
  import.meta.env.VITE_SERVER_URL ||
  (IS_PROD
    ? "https://connect-1-6be8.onrender.com"
    : "http://localhost:8080");

export default server;

