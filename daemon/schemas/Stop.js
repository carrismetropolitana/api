/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Stop"] Object */
module.exports = new mongoose.Schema(
  {
    //
    // General

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
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },

    //
    // Administrative

    locality: {
      type: String,
      maxlength: 50,
    },
    parish_id: {
      type: String,
      maxlength: 50,
    },
    parish_name: {
      type: String,
      maxlength: 50,
    },
    municipality_id: {
      type: String,
      maxlength: 50,
    },
    municipality_name: {
      type: String,
      maxlength: 50,
    },
    district_id: {
      type: String,
      maxlength: 50,
    },
    district_name: {
      type: String,
      maxlength: 50,
    },
    region_id: {
      type: String,
      maxlength: 50,
    },
    region_name: {
      type: String,
      maxlength: 50,
    },

    //
    // Accessibility

    wheelchair_boarding: {
      type: String,
      maxlength: 100,
    },

    //
    // Services

    near_services: [
      {
        type: String,
        maxlength: 50,
      },
    ],

    //
    // Intermodal Conections

    intermodal_connections: [
      {
        type: String,
        maxlength: 50,
      },
    ],

    //
  },
  {
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    virtuals: {
      patterns: {
        options: {
          ref: 'Pattern',
          localField: 'code',
          foreignField: 'trips.schedule.stop_code',
        },
      },
    },
  }
);
