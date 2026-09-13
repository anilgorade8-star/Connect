import React, { useEffect } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="landingcontainer">
      <nav>

        {/* App Name */}
        <div className="navHeader">
          <h1><span style={{ color: "#ff9839" }}>|</span> Connect</h1>
        </div>

        {/* NAV */}
        <div className="navList">
          <p onClick={() => navigate("/auth")}>Join as Guest</p>
          <p onClick={() => navigate("/auth")}>Register</p>
          <div role="button" onClick={() => navigate("/auth")}>
            Login
          </div>
        </div>
      </nav>

      {/* Main Page */}
      <div className="landingPageContainer">
        <div>
          <h1>
            <span style={{ color: "#FF9839" }}>Connect</span> with your Loved
            Ones
          </h1>
          <p>Cover a distance Your Video Call </p>
          <div id="link" role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>

        {/* Image  */}
        <div>
          <img src="/mobile.png" alt="Mobile" />
        </div>
      </div>
    </div>
  );
}

export default Landing;
