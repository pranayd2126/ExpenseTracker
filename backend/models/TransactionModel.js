// import { Schema, model } from "mongoose";

// const transactionSchema = new Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "UserModel",
//       required: true,
//     },

//     amount: {
//       type: Number,
//       required: true,
//     },

//     type: {
//       type: String,
//       enum: ["income", "expense"],
//       required: true,
//     },

//     category: {
//       type: String,
//       required: true,
//     },

//     note: {
//       type: Str
//     },
//     date: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     strict: "throw",
//     timestamps: true,
//     versionKey: false,
//   },
// );

// const TransactionModel = model("Transaction", transactionSchema);
// export default TransactionModel;

import mongoose from "mongoose";
import User from "./UserModel.js";
import CategorySchema from "./categorySchema.js";

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategorySchema",
      required: true,
    },

    // category: {
    //   type: String,
    //   required: true,
    // },

    title: {
      type: String,
      required: true, // this is the specific label for the transaction
      trim: true,
    },

    note: {
      type: String,
      trim: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurringInterval: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
    },

    nextRecurringDate: {
      type: Date,
    },
    recurringEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("Expense", expenseSchema);