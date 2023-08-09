/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Facility"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 50,
      unique: true,
    },
    type: {
      type: String,
      maxlength: 50,
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
    phone: {
      type: String,
      maxlength: 50,
    },
    email: {
      type: String,
      maxlength: 50,
    },
    url: {
      type: String,
      maxlength: 50,
    },
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
    stops: [
      {
        type: String,
        maxlength: 6,
      },
    ],
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);