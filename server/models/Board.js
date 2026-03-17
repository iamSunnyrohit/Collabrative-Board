const mongoose = require('mongoose');

const LineSchema = new mongoose.Schema({
  x0: { type: Number, required: true },
  y0: { type: Number, required: true },
  x1: { type: Number, required: true },
  y1: { type: Number, required: true },
  color: { type: String, default: 'black' },
  size: { type: Number, default: 5 },
}, { timestamps: true });

const TextSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  text: { type: String, required: true },
  color: { type: String, default: 'black' },
  size: { type: Number, default: 24 },
}, { timestamps: true });

// We could have multiple boards, but for now we'll store all lines in a single default room/board.
const BoardSchema = new mongoose.Schema({
  roomId: { type: String, default: 'default', unique: true },
  lines: [LineSchema],
  texts: [TextSchema],
});

module.exports = mongoose.model('Board', BoardSchema);
