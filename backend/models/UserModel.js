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
    incomeHistory: [
      {
        amount: { type: Number, required: true },
        from: { type: Date, required: true },
        to: { type: Date }, // null if current income
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = model("User", userSchema);
export default UserModel;



