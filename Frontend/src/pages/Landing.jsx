import React from "react";
import "../App.css";
import { Link } from "react-router-dom";
function Landing() {
  return (
    <div className="landingcontainer">
      <nav>

        {/* App Name */}
        <div className="navHeader">
          <h1>Your Video Call</h1>
        </div>

        {/* NAV */}
        <div className="navList">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button">
            <p>Login</p>
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
