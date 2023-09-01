/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["School"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 50,
      unique: true,
    },
    name: {
      type: String,
      maxlength: 50,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
    nature: {
      type: String,
      maxlength: 50,
    },
    grouping: {
      type: String,
      maxlength: 50,
    },
    cicles: [
      {
        type: String,
        maxlength: 50,
      },
    ],
    address: {
      type: String,
      maxlength: 50,
    },
    postal_code: {
      type: String,
      maxlength: 50,
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
    url: {
      type: String,
      maxlength: 50,
    },
    email: {
      type: String,
      maxlength: 50,
    },
    phone: {
      type: String,
      maxlength: 50,
    },
    stops: [
      {
        type: String,
        maxlength: 6,
      },
    ],
  },
  {
    timestamps: true,
  }
);
