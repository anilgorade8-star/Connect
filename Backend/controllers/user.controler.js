import httpStatus from "http-status";
import { User } from "../models/usersModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {
  let { username, password } = req.body;

  // Remove accidental spaces
  username = username?.trim();

  if (!username || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Please provide username and password",
    });
  }

  try {
    const user = await User.findOne({
      username: username,
    });

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User is not found",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid username or password",
      });
    }

    // Create login token
    const token = crypto
      .randomBytes(20)
      .toString("hex");

    user.token = token;

    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res
      .status(
        httpStatus.INTERNAL_SERVER_ERROR
      )
      .json({
        message: "Something went wrong",
      });
  }
};

// ==========================================
// REGISTER
// ==========================================

const register = async (req, res) => {
  let {
    name,
    username,
    password,
  } = req.body;

  // Remove accidental spaces
  name = name?.trim();
  username = username?.trim();

  if (
    !name ||
    !username ||
    !password
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message:
        "Name, username, and password are required",
    });
  }

  try {
    // Check existing username
    const existingUser =
      await User.findOne({
        username: username,
      });

    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({
        message:
          "That username is already in use. Please choose another one.",
      });
    }

    // Hash password
    const hashPassword =
      await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name: name,
      username: username,
      password: hashPassword,
    });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({
        message:
          "User registered successfully",
      });
  } catch (e) {
    console.error(
      "Registration error:",
      e
    );

    return res
      .status(
        httpStatus.INTERNAL_SERVER_ERROR
      )
      .json({
        message:
          "Unable to register user",
      });
  }
};

export {
  login,
  register,
};
