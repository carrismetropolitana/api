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
    parent_line: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Line',
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
            stop: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Stop',
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
