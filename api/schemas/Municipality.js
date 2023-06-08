/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Municipality"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 10,
      unique: true,
    },
    name: {
      type: String,
      maxlength: 50,
    },
    district: {
      type: String,
      maxlength: 50,
    },
    nuts_iii: {
      type: String,
      maxlength: 50,
    },
    dico: {
      type: String,
      maxlength: 50,
    },
  },
  { timestamps: true }
);
