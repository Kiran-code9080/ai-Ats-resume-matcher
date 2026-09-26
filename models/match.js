import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Speeds up queries filtered by userId
    },
    score: {
      type: Number,
      required: true,
      min: [0, "Score cannot be negative"],
      max: [100, "Score cannot exceed 100"],
    },
    jobText: {
      type: String,
      required: [true, "Job description text is required"],
      trim: true,
    },
    resumeTextSnippet: {
      type: String,
      trim: true,
      default: "",
    },
    presentSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for faster sorting by creation date
matchSchema.index({ createdAt: -1 });

// TTL index: auto-delete documents containing PII after 90 days (90 * 24 * 60 * 60 seconds)
matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Optional: Add a compound index for userId and score for faster filtering
matchSchema.index({ userId: 1, score: -1 });

const Match = mongoose.model("Match", matchSchema);

export default Match;
