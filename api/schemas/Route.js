/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["Route"] Object */
module.exports = new mongoose.Schema(
  {
    route_id: {
      type: String,
      maxlength: 100,
      unique: true,
    },
    route_short_name: {
      type: String,
      maxlength: 100,
    },
    route_long_name: {
      type: String,
      maxlength: 100,
    },
    route_color: {
      type: String,
      maxlength: 100,
    },
    route_text_color: {
      type: String,
      maxlength: 100,
    },
    municipalities: [
      {
        id: {
          type: String,
          maxlength: 100,
        },
        value: {
          type: String,
          maxlength: 100,
        },
      },
    ],
    directions: [
      {
        direction_id: {
          type: String,
          maxlength: 1,
        },
        headsign: {
          type: String,
          maxlength: 100,
        },
        shape: [
          {
            shape_id: {
              type: String,
              maxlength: 100,
            },
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
        trips: [
          {
            trip_id: {
              type: String,
              maxlength: 100,
            },
            dates: [
              {
                type: String,
                maxlength: 100,
              },
            ],
            schedule: [
              {
                stop_sequence: {
                  type: String,
                  maxlength: 100,
                },
                stop_id: {
                  type: String,
                  maxlength: 100,
                },
                stop_name: {
                  type: String,
                  maxlength: 100,
                },
                stop_lon: {
                  type: String,
                  maxlength: 100,
                },
                stop_lat: {
                  type: String,
                  maxlength: 100,
                },
                arrival_time: {
                  type: String,
                  maxlength: 100,
                },
                departure_time: {
                  type: String,
                  maxlength: 100,
                },
                stop_headsign: {
                  type: String,
                  maxlength: 100,
                },
                shape_dist_traveled: {
                  type: String,
                  maxlength: 100,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);
