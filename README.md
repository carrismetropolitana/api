# Carris Metropolitana API (beta)

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/tf3p.svg)](https://status.carrismetropolitana.pt)

Welcome to the Carris Metropolitana API, an open-source service that provides network information in JSON format. This service reads and converts the [official Carris Metropolitana GTFS file](https://github.com/carrismetropolitana/gtfs). This API covers bus transit data for 15 of the 18 municipalities comprising the Lisbon metropolitan area. This is the same set of endpoints used by [carrismetropolitana.pt](https://www.carrismetropolitana.pt). With this API, developers can easily build applications that provide users with up-to-date bus schedules and route information.

If you have something in mind or already built using this API we'd very much like to hear about it. [Get in touch!](https://github.com/carrismetropolitana/schedules-api/issues)

The API provides detailed information about lines, routes, stops, schedules and more.

If you have any questions or suggestions for improving the API, please don't hesitate to get in touch. We hope you find this API to be a useful resource for your development needs.

---

### Base URL: `https://api.carrismetropolitana.pt/[endpoint]`

---

## GTFS

#### `GET /gtfs`

Returns the zip archive for the currently live GTFS feed.

## Municipalities

#### `GET /municipalities`

#### `GET /municipalities/:id`

Returns information for municipalities in the Lisbon metropolitan area, as well as adjacent municipalities where Carris Metropolitana also has service.

**Example Response:**

```
[
    {
        id: "1502",
        name: "Alcochete",
        prefix: "01",
        district_id: "15",
        district_name: "Setúbal",
        region_id: "PT170",
        region_name: "AML",
    },
    ...
]
```

## Alerts

#### `GET /alerts`

#### `GET /alerts.pb`

Returns the service alerts in JSON and Protobuf format, following the GTFS-RT Service Alerts standard. [Please refer to the documentation available here.](https://gtfs.org/realtime/feed-entities/#service-alerts)

## ENCM

#### `GET /facilities/encm`

#### `GET /facilities/encm/:id`

Known as Espaços navegante® Carris Metropolitana, these endpoints return information for all or each location, including live estimated wait times.

**Example Response:**

```
[
    {

        id: "8400000000000001",
        name: "Espaço navegante® Carris Metropolitana Queluz",

        lat: 38.756317,
        lon: -9.253332,

        phone: "210410400",
        email: null,
        url: null,

        address: "Avenida José Elias Garcia 71",
        postal_code: "2745-155",
        locality: "Queluz",
        parish_id: null,
        parish_name: null,
        municipality_id: "1512",
        municipality_name: "Setúbal",
        district_id: "15",
        district_name: "Setúbal",
        region_id: "PT170",
        region_name: "AML",

        hours_monday: ["08:00-19:00"],
        hours_tuesday: ["08:00-19:00"],
        hours_wednesday": ["08:00-19:00"],
        hours_thursday: ["08:00-19:00"],
        hours_friday: ["08:00-19:00"],
        hours_saturday: [],
        hours_sunday": [],
        hours_special: null,

        currently_waiting: 0,
        expected_wait_time: 0,

        stops: [],

    },
    ...
]
```

## Stops

#### `GET /stops`

#### `GET /stops/:id`

Returns static information for all stops, as well as associated lines, routes and patterns that use each stop.

**Example Response:**

```
[
    {

        id: "010001",
        name: "R Carlos M. R. Francisco 229 (Escola Monte Novo)",
        short_name: null,
        tts_name: "Rua Carlos Manuel Rodrigues Francisco 229 Escola Monte Novo",

        lat: 38.754244,
        lon: -8.959557,

        locality: "Alcochete",
        parish_id: null,
        parish_name: null,
        municipality_id: "1502",
        municipality_name: "Alcochete",
        district_id: "15",
        district_name: "Setúbal",
        region_id: "PT170",
        region_name: "AML",

        wheelchair_boarding: null,

        facilities: [],

        lines: ["4001", "4002"],
        routes: ["4001_0", "4002_0"],
        patterns: ["4001_0_3", "4002_0_3"],

    },
    ...
]
```

#### `GET /stops/:id/realtime`

Returns realtime arrival estimations for a single stop.

**Example Response:**

```
[
    {
        line_id: "2909",
        pattern_id: "2909_0_1",
        trip_id: "2909_0_1|130|2|0824",
        headsign: "Freiria (E.B. 2-3)",
        scheduled_arrival: "08:56:00",
        estimated_arrival: "08:57:00",
        observed_arrival: "08:58:00",
        vehicle_id: "42|2345"
    },
    ...
]
```

## Vehicles

#### `GET /vehicles`

Returns information for all vehicles in service for Carris Metropolitana. Timestamp for the last known position is in milliseconds, with seconds precision, and is adjusted for Lisbon time (GMT+01 WEST). Each vehicle has speed and heading, and has information for the current serviced trip and pattern.

**Example Response:**

```
[
    {
        id: "41|1153",
        lat: 38.740165,
        lon: -9.268897,
        speed: 0,
        heading: 68.0999984741211,
        trip_id: "1724_0_2_2030_2059_0_7",
        pattern_id: "1724_0_2"
        timestamp: 1693948520000,
    },
    ...
]
```

## Lines

#### `GET /lines`

#### `GET /lines/:id`

Returns information for lines. Each line can have several routes and patterns, and serves a set of municipalities and localities.

**Example Response:**

```
[
    {

        id: "1001",
        short_name: "1001",
        long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
        color: "#ED1944",
        text_color: "#FFFFFF",

        municipalities: ["1115"],
        localities: ["Alfragide", "Amadora", "Reboleira", "Buraca"],

        routes: ["1001_0"],
        patterns: ["1001_0_1", "1001_0_2"],

        facilities: [],

    },
    ...
]
```

## Routes

_This endpoint is not yet available._

#### `GET /routes`

#### `GET /routes/:id`

Returns information for routes. Each route can have at most two patterns, and serves a set of municipalities and localities.

**Example Response:**

```
[
    {

        id: "1001_0",
        short_name: "1001",
        long_name: "Alfragide (Estr Seminario) - Reboleira (Estação)",
        color: "#ED1944",
        text_color: "#FFFFFF",

        line_id: "1001",

        patterns: ["1001_0_1", "1001_0_2"],

        municipalities: ["1115"],
        localities: ["Alfragide", "Amadora", "Reboleira", "Buraca"],
        facilities: [],

    },
    ...
]
```

## Patterns

#### `GET /patterns/:id`

Returns information for a single pattern. Due to the size of each object, it is not possible to return all patterns at once. User interfaces should present a list of lines, and request each associated patterns when the user selects a line. It is the pattern that represents the set of equal journeys of a line. Each pattern has a set of dates when it is valid, a path with the sequence of stops, a set of trips with the arrival time to each stop, and an associated shape id.

**Example Response:**

```
{

    id: "2708_0_1",
    short_name: "2708",
    headsign: "Estação Oriente",
    direction: 0,
    color: "#ED1944",
    text_color: "#FFFFFF",

    line_id: "2708",
    route_id: "2708_0",

    valid_on: ["20230103", "20230104", "20230105", ...],

    municipalities: ["1107", "1106"],
    localities: ["Loures", "Moscavide", "Parque das Nações"],
    facilities: [],

    shape_id: "p1_2708_0_1",

    path: [
        {
            stop: {
                id: "010001",
                name: "R Carlos M. R. Francisco 229 (Escola Monte Novo)",
                short_name: null,
                tts_name: "Rua Carlos Manuel Rodrigues Francisco 229 Escola Monte Novo",
                lat: 38.754244,
                lon: -8.959557,
                locality: "Alcochete",
                parish_id: null,
                parish_name: null,
                municipality_id: "1502",
                municipality_name: "Alcochete",
                district_id: "15",
                district_name: "Setúbal",
                region_id: "PT170",
                region_name: "AML",
                wheelchair_boarding: null,
                facilities: [],
                lines: ["4001", "4002"],
                routes: ["4001_0", "4002_0"],
                patterns: ["4001_0_3", "4002_0_3"],

            },
            allow_pickup: true,
            allow_drop_off: true,
            distance_delta: 0,
        },
        ...
    ],

    trips: [
        {
            trip_id: "p1_2708_0_1|1|1|0450",
            calendar_id: "p1_11",
            dates: ["20230103", "20230104", "20230105", ...],
            schedule: [
                {
                    stop_id: "071339",
                    arrival_time: "04:50:00",
                    arrival_time_operation: "04:50:00",
                    travel_time: "0",
                },
                ...
            ],
        },
        ...
    ],

}
```

## Shapes

#### `GET /shapes/:id`

Returns a single shape in GTFS and Geojson format. Extension is in meters.

**Example Response:**

```
{

    id: "p2_3701_0_1",
    extension: 12745,

    points: [
        {
            shape_pt_lat: "38.66786",
            shape_pt_lon: "-9.164045",
            shape_pt_sequence: "1",
            shape_dist_traveled: "0",
        },
        {
            shape_pt_lat: "38.66772",
            shape_pt_lon: "-9.16377",
            shape_pt_sequence: "2",
            shape_dist_traveled: "0.0284",
        },
        ...
    ],

    geojson: {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [
                [-9.164045, 38.66786],
                [-9.16377, 38.66772],
                [-9.16412, 38.6678],
                ...
            ]
        }
    }

}
```

## Schools

#### `GET /facilities/schools`

#### `GET /facilities/schools/:id`

Returns a list of schools in the Lisbon metropolitan area. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/facilities/schools).

**Example Response:**

```
[
    {

        id: "200098",
        name: "Escola Básica de A-das-Lebres",

        lat: 38.852917,
        lon: -9.167282,

        nature: "public",
        grouping: "Agrupamento de Escolas João Villaret Loures",
        cicles: ["pre_school", "basic_1"],

        address: "R. da Liberdade 98",
        postal_code: "2660-001",
        locality: "FRIELAS",
        parish_id: null,
        parish_name: null,
        municipality_id: "1107",
        municipality_name: "Loures",
        district_id: "11",
        district_name: "Lisboa",
        region_id: "PT170",
        region_name: "AML",

        url: null,
        email: "eb1.adaslebres@escolas.min-edu.pt",
        phone: "219832364",

        stops: ["070401", "070403", "070404", ...],

    },
    ...
]
```

# Contributing

If you'd like to contribute new features or help fix any errors, please fork this repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, documentation improvements, and new features.
