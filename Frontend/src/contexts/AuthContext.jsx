import { useState } from "react";
import axios, { HttpStatusCode } from "axios";
import { AuthContext } from "./auth-context";

const client = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL || "http://localhost:8080"}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const handleRegister = async (name, username, password) => {
    const request = await client.post("/register", {
      name,
      username,
      password,
    });

    if (request.status === HttpStatusCode.Created) {
      return request.data.message;
    }

    throw new Error("Registration could not be completed");
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });

      if (request.status === HttpStatusCode.OK) {
        localStorage.setItem("token", request.data.token);
      }
    } catch (e) {
      throw e;
    }
  };
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
