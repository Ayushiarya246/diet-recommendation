import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";
dotenv.config();

import { User } from "../models/index.js";

// Generate JWT Tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// ✅ REGISTER USER
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if email OR username already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already in use 🚫"
            : "Username already taken 🚫"
      });
    }

    await User.create({
    email: email.toLowerCase(),
    username,
    password,
    });


    return res.status(201).json(
        { message: "Registered successfully ✅" }
    );

  } catch (err) {
    return res.status(500).json(
        { error: err.message }
    );
  }
};

// ✅ LOGIN USER

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required ❌" });
    }

    // ✅ Ensure email search is case-insensitive
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password ❌" });
    }

    // ✅ Compare hashed password correctly
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password ❌" });
    }

    // ✅ Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // change to true after HTTPS deployment
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Login successful ✅",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

