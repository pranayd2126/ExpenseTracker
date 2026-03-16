import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email already exists"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    // employee = fixed monthly salary auto-posted; business = manual daily entries
    incomeMode: {
      type: String,
      enum: ["employee", "business"],
      default: "employee",
    },
    // Default monthly salary for employee mode
    defaultSalary: {
      type: Number,
      default: 0,
    },
    // History of salary changes
    incomeHistory: [
      {
        amount: { type: Number, required: true },
        from: { type: Date, required: true },
        to: { type: Date }, // null if this is the current salary
      },
    ],
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = model("User", userSchema);
export default UserModel;