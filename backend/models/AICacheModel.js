import mongoose from "mongoose";

const aiCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cacheType: {
      type: String,
      enum: ["suggestions", "predict"],
      required: true,
      index: true,
    },
    signature: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

aiCacheSchema.index({ userId: 1, cacheType: 1, signature: 1 }, { unique: true });

export default mongoose.model("AICache", aiCacheSchema);