/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Municipality"] Object */
module.exports = new mongoose.Schema(
  {
    dico: {
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
    district: {
      type: String,
      maxlength: 50,
    },
    nuts_iii: {
      type: String,
      maxlength: 50,
    },
  },
  { timestamps: true }
);
