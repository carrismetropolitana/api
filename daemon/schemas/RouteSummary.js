/* * */
/* IMPORTS */
const { mongoose } = require('mongoose');

/* * */
/* Schema for MongoDB ["RouteSummary"] Object */
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
  },
  { timestamps: true }
);
