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
      maxlength: 7,
    },
    text_color: {
      type: String,
      maxlength: 7,
    },
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    virtuals: {
      patterns: {
        options: {
          ref: 'Pattern',
          localField: 'code',
          foreignField: 'line_code',
        },
      },
    },
  }
);
