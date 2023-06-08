/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Line"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 100,
      unique: true,
    },
    short_name: {
      type: String,
      maxlength: 100,
    },
    long_name: {
      type: String,
      maxlength: 100,
    },
    color: {
      type: String,
      maxlength: 100,
    },
    text_color: {
      type: String,
      maxlength: 100,
    },
    municipalities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Municipality',
      },
    ],
    patterns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pattern',
      },
    ],
  },
  { timestamps: true }
);
