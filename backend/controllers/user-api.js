import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userSchema from "../models/UserModel.js";

export const register = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    // Check if user already exists (email)
    const existingUserByEmail = await userSchema.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await userSchema.create({
      firstName,
      email,
      password: hashedPassword,
      // Default to 'user' if not provided
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error (in case unique constraint fails)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    // Find user by email
    const user = await userSchema.findOne({ email });
    // Check if user exists and is active
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    // Check if account is blocked

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }
    // Compare password

    const isMatch = await bcrypt.compare(password, user.password);
    // If password does not match
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "30d" },
    );
    // Set token in HTTP-only cookie

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    // Respond with user data (excluding password)
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        token,
        id: user._id,
        name: user.name,
        email: user.email,
  
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};


export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

// not  woinkg 
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await userSchema.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userSchema.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    ); //
    // Clear token cookie to force re-login after password change
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
};

export const getAllUsers = async (req, res) => {
  // TODO: implement logic to get all users

  const users = await userSchema.find().select("-password");

  res.status(200).json({
    success: true,
    data: users,
  });
};


export const getUserById = async (req, res) => {
  const userId = req.params.id;

  const user = await userSchema.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
};

//get user profile

export const getUserPofile = async (req, res) => {
  const userId = req.userId;

  const user = await userSchema.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  res.status(200).json({
    success: true,
    data: user,
  });
};

//update user profile
export const updateUser = async (req, res) => {
  const userId = req.userId;
  const { name, email, phone } = req.body;

  const user = await userSchema.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  await user.save();
  res.status(200).json({
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
}; 
