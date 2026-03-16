import {Schema, model} from 'mongoose';

const transactionSchema=new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  type: {
    type: String,
    enum: ["income", "expense"],
    required: true
  },

  category: {
    type: String,
    required: true
  },

  note: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
  

}, {
    strict:"throw",
    timestamps: true,
    versionKey: false
})


const TransactionModel = model("Transaction", transactionSchema);
export default TransactionModel;