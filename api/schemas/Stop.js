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

    municipality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
    },
    parish: {
      type: String,
      maxlength: 100,
    },
    locality: {
      type: String,
      maxlength: 100,
    },

    //
    // Accessibility

    wheelchair_boarding: {
      type: String,
      maxlength: 100,
    },

    //
    // Services

    near_health_clinic: {
      type: Boolean,
    },
    near_hospital: {
      type: Boolean,
    },
    near_university: {
      type: Boolean,
    },
    near_school: {
      type: Boolean,
    },
    near_police_station: {
      type: Boolean,
    },
    near_fire_station: {
      type: Boolean,
    },
    near_shopping: {
      type: Boolean,
    },
    near_historic_building: {
      type: Boolean,
    },
    near_transit_office: {
      type: Boolean,
    },

    //
    // Intermodal Connections

    subway: {
      type: Boolean,
    },
    light_rail: {
      type: Boolean,
    },
    train: {
      type: Boolean,
    },
    boat: {
      type: Boolean,
    },
    airport: {
      type: Boolean,
    },
    bike_sharing: {
      type: Boolean,
    },
    bike_parking: {
      type: Boolean,
    },
    car_parking: {
      type: Boolean,
    },

    //
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    virtuals: {
      patterns: {
        options: {
          ref: 'Pattern',
          localField: '_id',
          foreignField: 'trips.schedule.stop',
        },
      },
    },
  }
);
