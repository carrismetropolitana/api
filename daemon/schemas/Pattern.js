/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Pattern"] Object */
module.exports = new mongoose.Schema(
  {
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
    headsign: {
      type: String,
      maxlength: 50,
    },
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
        shape_code: {
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
            allow_pickup: {
              type: Boolean,
            },
            allow_drop_off: {
              type: Boolean,
            },
            distance_delta: {
              type: Number,
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
  },
  {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    virtuals: {
      'trips.schedule.stop': {
        options: {
          ref: 'Stop',
          localField: 'trips.schedule.stop_code',
          foreignField: 'code',
        },
      },
    },
  }
);
