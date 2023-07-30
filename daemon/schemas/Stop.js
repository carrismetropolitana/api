/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Stop"] Object */
module.exports = new mongoose.Schema({
  code: {
    type: String,
    maxlength: 6,
    unique: true,
  },
  name: {
    type: String,
    maxlength: 100,
  },
  short_name: {
    type: String,
    maxlength: 100,
  },
  tts_name: {
    type: String,
    maxlength: 100,
  },
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  locality: {
    type: String,
    maxlength: 50,
  },
  parish_code: {
    type: String,
    maxlength: 50,
  },
  parish_name: {
    type: String,
    maxlength: 50,
  },
  municipality_code: {
    type: String,
    maxlength: 50,
  },
  municipality_name: {
    type: String,
    maxlength: 50,
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
  wheelchair_boarding: {
    type: Number,
  },
  facilities: [
    {
      type: String,
      maxlength: 50,
    },
  ],
  lines: [
    {
      type: String,
      maxlength: 50,
    },
  ],
  routes: [
    {
      type: String,
      maxlength: 50,
    },
  ],
  patterns: [
    {
      type: String,
      maxlength: 50,
    },
  ],
});
