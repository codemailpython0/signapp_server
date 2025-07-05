// controllers/AuthController.js
import dotenv from "dotenv";
dotenv.config();

import supabase from "../supabaseClient.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔐 Register — Send OTP
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous OTPs
    await supabase.from("otps").delete().eq("email", email);

    // Store new OTP with temp user data
    const hashedPassword = await bcrypt.hash(password, 10);
    await supabase.from("otps").insert([
      {
        email,
        otp,
        user_data: JSON.stringify({ name, email, password: hashedPassword }),
      },
    ]);

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<h3>Your OTP is <b>${otp}</b></h3><p>This OTP is valid for 5 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

// ✅ Verify OTP and Create User
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const { data: entry } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .single();

    if (!entry || entry.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const userData = JSON.parse(entry.user_data);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);

    // Delete used OTP
    await supabase.from("otps").delete().eq("email", email);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔐 Login with Email + Cookie
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
