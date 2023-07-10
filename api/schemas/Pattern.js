/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');
const StopSchema = require('./Stop');

/* * */
/* Schema for MongoDB ["Pattern"] Object */
module.exports = new mongoose.Schema({
  code: {
    type: String,
    maxlength: 100,
    unique: true,
  },
  line_code: {
    type: String,
    maxlength: 4,
  },
  direction: {
    type: Number,
  },
  short_name: {
    type: String,
    maxlength: 4,
  },
  headsign: {
    type: String,
    maxlength: 50,
  },
  color: {
    type: String,
    maxlength: 7,
  },
  text_color: {
    type: String,
    maxlength: 7,
  },
  valid_on: [
    {
      type: String,
      maxlength: 8,
    },
  ],
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

  shape: {
    shape_code: {
      type: String,
      maxlength: 100,
      unique: true,
    },
    extension: {
      type: Number,
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

  path: [
    {
      stop: StopSchema,

      allow_pickup: {
        type: Boolean,
      },
      allow_drop_off: {
        type: Boolean,
      },
      distance_delta: {
        type: Number,
      },
    },
  ],
  trips: [
    {
      trip_code: {
        type: String,
        maxlength: 50,
      },
      calendar_code: {
        type: String,
        maxlength: 50,
      },
      dates: [
        {
          type: String,
          maxlength: 8,
        },
      ],
      schedule: [
        {
          stop_code: {
            type: String,
            maxlength: 6,
          },
          arrival_time: {
            type: String,
            maxlength: 8,
          },
          arrival_time_operation: {
            type: String,
            maxlength: 8,
          },
          travel_time: {
            type: String,
            maxlength: 8,
          },
        },
      ],
    },
  ],
});
