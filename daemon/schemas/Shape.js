/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Shape"] Object */
module.exports = new mongoose.Schema(
  {
    code: {
      type: String,
      maxlength: 100,
      unique: true,
    },
    extension: {
      type: String,
      maxlength: 100,
    },
    points: [
      {
        shape_pt_lat: {
          type: String,
          maxlength: 100,
        },
        shape_pt_lon: {
          type: String,
          maxlength: 100,
        },
        shape_pt_sequence: {
          type: String,
          maxlength: 100,
        },
        shape_dist_traveled: {
          type: String,
          maxlength: 100,
        },
      },
    ],
    geojson: {
      type: {
        type: String,
        maxlength: 50,
        default: 'Feature',
      },
      geometry: {
        type: {
          type: String,
          maxlength: 50,
          default: 'LineString',
        },
        coordinates: [
          [
            {
              type: Number,
            },
          ],
        ],
      },
    },
  },
  { timestamps: true }
);
