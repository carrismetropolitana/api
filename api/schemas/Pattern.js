/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

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
    code: {
      type: String,
      maxlength: 100,
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
      stop: {
        //
        // General

        code: {
          type: String,
          maxlength: 6,
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
      code: {
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
