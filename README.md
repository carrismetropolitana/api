# Schedules API

Welcome to the Schedules API, an open-source mini-program that provides planned services in JSON format by reading and converting the official Carris Metropolitana GTFS file. This API covers bus transit data for 15 of the 18 municipalities comprising the Lisbon metropolitan area. This is the same set of endpoints used by carrismetropolitana.pt. With this API, developers can easily build applications that provide users with up-to-date bus schedules and route information. If you have something in mind or already built we'd very much like to hear about it. Get in touch!

The Schedules API provides detailed information about *planned* routes, stops and schedules.

If you have any questions or suggestions for improving the API, please don't hesitate to get in touch. We hope you find the Schedules API to be a useful resource for your development needs.

***

### Base URL: `https://schedules.carrismetropolitana.pt/api/[endpoint]`

***


## Available Endpoints

### `GET /routes`

Returns all routes with all associated schedule information.

_Please avoid using this endpoint, and if you must do so responsibly. It returns a lot of data and may crash your users devices. This endpoint may be occasionally switched off during peak hours._

**Example Response:**

```
[
  {
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
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
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
  },
...
]
```


### `GET /routes/route_id/:route_id`

Returns route and schedule info for the provided `route_id`.

**Example Response:**

```
[
  {
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
  },
...
]
```


### `GET /routes/route_short_name/:route_short_name`

Returns route and schedule info for all routes matching the provided `route_short_name`.

**Example Response:**

```
[
  {
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
  },
...
]
```



### `GET /stops`

Returns all stops.

**Example Response:**

```
[
  {
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
  },
...
]
```


### `GET /stops/:stop_id`

Returns stop for the provided `stop_id`.

**Example Response:**

```
[
  {
    "id": 1,
    "name": "Line 1",
    "color": "#FF0000"
  },
...
]
```


# Contributing

If you'd like to contribute to the Lisbon Transit API, please fork this repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, documentation improvements, and new features.

# License

The Lisbon Transit API is licensed under the MIT License. See the LICENSE file for more information.
