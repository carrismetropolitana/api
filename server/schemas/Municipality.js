/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Municipality"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 4,
      unique: true,
    },
    name: {
      type: String,
      maxlength: 50,
    },
    prefix: {
      type: String,
      maxlength: 2,
    },
    district_code: {
      type: String,
      maxlength: 50,
    },
    district_name: {
      type: String,
      maxlength: 50,
    },
    region_code: {
      type: String,
      maxlength: 50,
    },
    region_name: {
      type: String,
      maxlength: 50,
    },
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
