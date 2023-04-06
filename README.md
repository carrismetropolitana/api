# Schedules API

Welcome to the Schedules API, an open-source mini-program that provides planned services in JSON format by reading and converting the [official Carris Metropolitana GTFS file](https://github.com/carrismetropolitana/gtfs). This API covers bus transit
data for 15 of the 18 municipalities comprising the Lisbon metropolitan area. This is the same set of endpoints used by [carrismetropolitana.pt](https://www.carrismetropolitana.pt). With this API, developers can easily build applications that provide
users with up-to-date bus schedules and route information. If you have something in mind or already built we'd very much like to hear about it. [Get in touch!](https://github.com/carrismetropolitana/schedules-api/issues)

The Schedules API provides detailed information about _planned_ routes, stops and schedules.

If you have any questions or suggestions for improving the API, please don't hesitate to get in touch. We hope you find the Schedules API to be a useful resource for your development needs.

---

### Base URL: `https://schedules.carrismetropolitana.pt/api/[endpoint]`

---

## Available Endpoints

### `GET /routes`

Returns all routes with all associated schedule information.

_Please avoid using this endpoint, and if you must do so responsibly. It returns a lot of data and may crash your users devices. This endpoint may be occasionally switched off during peak hours._

**Example Response:**

```
[
  {
    route_id: "1001_0",
    route_short_name: "1001",
    route_long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
    route_color: "#ED1944",
    route_text_color: "#FFFFFF",
    createdAt: "2023-03-27T14:57:59.918Z",
    updatedAt: "2023-03-29T12:02:31.230Z",
    municipalities: [
      {
        id: "03",
        value: "Amadora",
      },
      ...
    ],
    directions: [
      {
        direction_id: "0",
        headsign: "Reboleira (Estação)",
        shape: [
          {
            shape_id: "p0_424",
            shape_pt_lat: "38.73440170288086",
            shape_pt_lon: "-9.220534324645996",
            shape_pt_sequence: "1",
            shape_dist_traveled: "0",
          },
          ...
        ],
        trips: [
          {
            trip_id: "p0_1001_0_1_0600_0629_0_7",
            dates: [
              "20230703",
              "20230704",
              ...
            ],
            schedule: [
              {
                stop_sequence: "1",
                stop_id: "030001",
                stop_name: "Alfragide (Hosp Veterinário)",
                stop_lon: "-9.220518",
                stop_lat: "38.734441",
                arrival_time: "06:20:00",
                departure_time: "06:20:00"
              },
              ...
            ]
          },
          ...
        ]
      },
      ...
    ]
  },
  ...
]
```

### `GET /routes/summary`

Returns all routes with the same `route_short_name`, effectively a list of lines.

**Example Response:**

```
[
  {
    route_id: "1001_0",
    route_short_name: "1001",
    route_long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
    route_color: "#ED1944",
    route_text_color: "#FFFFFF",
    createdAt: "2023-03-27T14:57:59.918Z",
    updatedAt: "2023-03-29T12:02:31.230Z",
    municipalities: [
      {
        id: "03",
        value: "Amadora",
      },
      ...
    ]
  },
  ...
]
```

### `GET /routes/route_id/:route_id`

Returns route and schedule info for the provided `route_id`.

**Example Response:**

```
{
  route_id: "1001_0",
  route_short_name: "1001",
  route_long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
  route_color: "#ED1944",
  route_text_color: "#FFFFFF",
  createdAt: "2023-03-27T14:57:59.918Z",
  updatedAt: "2023-03-29T12:02:31.230Z",
  municipalities: [
    {
      id: "03",
      value: "Amadora",
    },
    ...
  ],
  directions: [
    {
      direction_id: "0",
      headsign: "Reboleira (Estação)",
      shape: [
        {
          shape_id: "p0_424",
          shape_pt_lat: "38.73440170288086",
          shape_pt_lon: "-9.220534324645996",
          shape_pt_sequence: "1",
          shape_dist_traveled: "0",
        },
        ...
      ],
      trips: [
        {
          trip_id: "p0_1001_0_1_0600_0629_0_7",
          dates: [
            "20230703",
            "20230704",
            ...
          ],
          schedule: [
            {
              stop_sequence: "1",
              stop_id: "030001",
              stop_name: "Alfragide (Hosp Veterinário)",
              stop_lon: "-9.220518",
              stop_lat: "38.734441",
              arrival_time: "06:20:00",
              departure_time: "06:20:00"
            },
            ...
          ]
        },
        ...
      ]
    },
    ...
  ]
}
```

### `GET /routes/route_short_name/:route_short_name`

Returns route and schedule info for all routes matching the provided `route_short_name`.

**Example Response:**

```
[
  {
    route_id: "1001_0",
    route_short_name: "1001",
    route_long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
    route_color: "#ED1944",
    route_text_color: "#FFFFFF",
    createdAt: "2023-03-27T14:57:59.918Z",
    updatedAt: "2023-03-29T12:02:31.230Z",
    municipalities: [
      {
        id: "03",
        value: "Amadora",
      },
      ...
    ],
    directions: [
      {
        direction_id: "0",
        headsign: "Reboleira (Estação)",
        shape: [
          {
            shape_id: "p0_424",
            shape_pt_lat: "38.73440170288086",
            shape_pt_lon: "-9.220534324645996",
            shape_pt_sequence: "1",
            shape_dist_traveled: "0",
          },
          ...
        ],
        trips: [
          {
            trip_id: "p0_1001_0_1_0600_0629_0_7",
            dates: [
              "20230703",
              "20230704",
              ...
            ],
            schedule: [
              {
                stop_sequence: "1",
                stop_id: "030001",
                stop_name: "Alfragide (Hosp Veterinário)",
                stop_lon: "-9.220518",
                stop_lat: "38.734441",
                arrival_time: "06:20:00",
                departure_time: "06:20:00"
              },
              ...
            ]
          },
          ...
        ]
      },
      ...
    ]
  }
  ...
]
```

### `GET /stops`

Returns all stops.

**Example Response:**

```
[
  {
    stop_id: "010001",
    stop_lat: "38.753900",
    stop_lon: "-8.959360",
    stop_name: "ALCOCHETE (R C M R FRANC 229)ESC MT NOVO",
    createdAt: "2023-03-27T15:19:06.342Z",
    updatedAt: "2023-03-29T12:25:22.271Z"
    routes: [
      {
        route_id: "4001_0",
        route_short_name: "4001",
        route_long_name: "Alcochete | Circular",
        route_color: "#3D85C6",
        route_text_color: "#FFFFFF"
      },
      ...
    ]
  },
  ...
]
```

### `GET /stops/:stop_id`

Returns stop for the provided `stop_id`.

**Example Response:**

```
{
  stop_id: "010001",
  stop_lat: "38.753900",
  stop_lon: "-8.959360",
  stop_name: "ALCOCHETE (R C M R FRANC 229)ESC MT NOVO",
  createdAt: "2023-03-27T15:19:06.342Z",
  updatedAt: "2023-03-29T12:25:22.271Z"
  routes: [
    {
      route_id: "4001_0",
      route_short_name: "4001",
      route_long_name: "Alcochete | Circular",
      route_color: "#3D85C6",
      route_text_color: "#FFFFFF"
    },
    ...
  ]
}
```

# Contributing

If you'd like to contribute or help fix any errors, please fork this repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, documentation improvements, and new features.
