const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    cycle: { type: String, required: true },
    fromRole: { type: String, required: true },
    toRole: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
