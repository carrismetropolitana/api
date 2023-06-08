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
    direction: {
      type: Number,
    },
    headsign: {
      type: String,
      maxlength: 50,
    },
    shape: {
      type: String,
      ref: 'Shape',
      path: 'code',
    },
    path: [
      {
        stop: {
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
      },
    ],
    trips: [
      {
        trip_id: {
          type: String,
          maxlength: 50,
        },
        service_id: {
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    virtuals: {
      shape: {
        options: {
          ref: 'Pattern',
          localField: 'shape',
          foreignField: 'code',
          justOne: true,
        },
      },
      'path.stop': {
        options: {
          ref: 'Stop',
          localField: 'path.stop',
          foreignField: 'code',
          justOne: true,
        },
      },
    },
  }
);
