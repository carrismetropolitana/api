/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');
const MunicipalitySchema = require('./Municipality');

/* * */
/* Schema for MongoDB ["Line"] Object */
module.exports = new mongoose.Schema({
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
  municipalities: [
    {
      type: String,
    },
  ],
  localities: [
    {
      type: String,
    },
  ],
  facilities: [
    {
      type: String,
    },
  ],
  patterns: [
    {
      type: String,
    },
  ],
});
