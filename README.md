# Carris Metropolitana API

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/tf3p.svg)](https://status.carrismetropolitana.pt)

Welcome to the Carris Metropolitana API, an open-source service that provides network information in JSON or Protocol Buffers format. This service reads and converts the [official Carris Metropolitana GTFS file](https://github.com/carrismetropolitana/gtfs). This API covers bus transit data for 15 of the 18 municipalities comprising the Lisbon metropolitan area. This is the same set of endpoints used by [carrismetropolitana.pt](https://www.carrismetropolitana.pt). With this API, developers can easily build applications that provide users with up-to-date bus schedules and route information.

If you have something in mind or already built using this API we'd very much like to hear about it. [Get in touch!](https://github.com/carrismetropolitana/schedules-api/issues)

The API provides detailed information about lines, routes, stops, schedules and more.

If you have any questions or suggestions for improving the API, please don't hesitate to get in touch. We hope you find this API to be a useful resource for your development needs.

---

### Base URL: `https://api.carrismetropolitana.pt/v2/[endpoint]`

---

## GTFS

#### `GET /gtfs`

Returns the zip archive for the currently live GTFS feed.

## Alerts

#### `GET /alerts`

#### `GET /alerts.pb`

Returns the service alerts in JSON and Protobuf format, following the GTFS-RT Service Alerts standard. [Please refer to the documentation available here.](https://gtfs.org/realtime/feed-entities/service-alerts)

## Vehicles

#### `GET /vehicles`

Returns information for ALL vehicles in Carris Metropolitana. This endpoint returns metadata (such as model, capacity, license_plate) about all registered vehicles. It'll also return the timestamp for the last known position is in milliseconds, with seconds precision,adjusted for Lisbon time (GMT+01 WEST). Each vehicle has speed and heading, and has information for the current serviced trip and pattern.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "agency_id": "41",
        "bearing": 0,
        "block_id": "VS_051",
        "current_status": "INCOMING_AT",
        "event_id": "21NBI-41|1159-1503_0_2_1700_1729_0_2",
        "id": "41|1160",
        "lat": 38.73644,
        "line_id": "1503",
        "lon": -9.21281,
        "pattern_id": "1503_0_2",
        "route_id": "1503_0",
        "schedule_relationship": "SCHEDULED",
        "shift_id": "1405",
        "speed": 0,
        "stop_id": "030558",
        "timestamp": 1729621800,
        "trip_id": "1503_0_2_1700_1729_0_2_21NBI",
        "door_status": "CLOSED",
        "bikes_allowed": false,
        "capacity_seated": 26,
        "capacity_standing": 82,
        "capacity_total": 108,
        "license_plate": "AR-90-AG",
        "make": "Mercedes-Benz",
        "model": "CONECTO",
        "owner": "ALVORADA",
        "propulsion": "diesel",
        "registration_date": "20230101",
        "wheelchair_accessible": false
    },
    ...
]
</code></pre></details>

#### `GET /vehicles.pb`

Returns the vehicle locations in Protobuf format, following the GTFS-RT Vehicle Locations standard. [Please refer to the documentation available here.](https://gtfs.org/realtime/feed-entities/vehicle-positions)

## Stops

#### `GET /stops`

Returns static information for all stops, as well as associated lines, routes and patterns that use each stop.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "district_id":"11",
        "facilities":["train"],
        "id":"121270",
        "lat":38.688615,
        "line_ids":["1120","1523","1529","1604","1607","1614","1615"],
        "locality_id":"022580",
        "lon":-9.316617,
        "long_name":"Oeiras (Estação) P8 Entrada Norte",
        "municipality_id":"1110",
        "operational_status":"active",
        "pattern_ids":["1120_0_2","1523_0_1","1523_0_2","1529_0_2","1529_1_2","1604_0_3","1607_0_1","1607_0_2","1614_0_1","1614_1_1","1615_0_1","1615_1_1"],
        "region_id":"PT170",
        "route_ids":["1120_0","1523_0","1529_0","1529_1","1604_0","1607_0","1614_0","1614_1","1615_0","1615_1"],
        "short_name":"a definir",
        "tts_name":"Oeiras ( - Estaçaão ) ( P 8 ) Entrada Norte . ( Há correspondência ) com o combóio",
        "wheelchair_boarding":false
    },
    ...
]
</code></pre></details>

## Arrivals

#### `GET /arrivals/by_stop/:id`

Returns all arrivals for a given day for a given stop. Each departure has the estimated, scheduled and observed arrival time (as a string and in Unix Timestamp) and information about the vehicle and trip.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "estimated_arrival": "06:10:50",
        "estimated_arrival_unix": 1751778650,
        "headsign": "Carcavelos (Estação)",
        "line_id": "1604",
        "observed_arrival": "06:10:55",
        "observed_arrival_unix": 1751778655,
        "pattern_id": "1604_0_3",
        "route_id": "1604_0",
        "scheduled_arrival": "06:11:00",
        "scheduled_arrival_unix": 1751778660,
        "stop_sequence": 14,
        "trip_id": "1604_0_3_0600_0629_0_9_21NBI",
        "vehicle_id": "41|1217"
    },
    ...
]
</code></pre></details>

#### `GET /arrivals/by_pattern/:id`

Returns all arrivals for a given day for a given pattern. Each departure has the estimated, scheduled and observed arrival time (as a string and in Unix Timestamp) and information about the vehicle and trip and is relative to the pattern's first stop.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "estimated_arrival": null,
        "estimated_arrival_unix": null,
        "headsign": "Carcavelos (Estação)",
        "line_id": "1604",
        "observed_arrival": "06:01:25",
        "observed_arrival_unix": 1751778085,
        "pattern_id": "1604_0_3",
        "route_id": "1604_0",
        "scheduled_arrival": "06:00:00",
        "scheduled_arrival_unix": 1751778000,
        "stop_id": "050418",
        "stop_sequence": 1,
        "trip_id": "1604_0_3_0600_0629_0_9_21NBI",
        "vehicle_id": "41|1217"
    },
    ...
]
</code></pre></details>

## Lines

#### `GET /lines`

Returns information for all lines. Each line can have several routes and patterns, and serves a set of municipalities and localities.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "color": "#C61D23",
        "district_ids": [ "11" ],
        "facilities": [ "school", "train" ],
        "id": "1001",
        "locality_ids": [ "022298" ],
        "long_name": "Alfragide (Estr Seminario) - Reboleira (Estação)",
        "municipality_ids": [ "1115" ],
        "pattern_ids": [ "1001_0_2", "1001_0_1" ],
        "region_ids": [ "PT170" ],
        "route_ids": [ "1001_0" ],
        "short_name": "1001",
        "stop_ids": [], // This value isn't used at the moment
        "text_color": "#FFFFFF",
        "tts_name": "Linha 1001 com percurso Alfragide ( Estrada Seminario ) - Reboleira ( - Estaçaão )"
    },
    ...
]
</code></pre></details>

## Routes

#### `GET /routes`

Returns information for all routes. Each route can have at most two patterns, and serves a set of municipalities and localities.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "color": "#C61D23",
        "district_ids": [ "11" ],
        "facilities": [ "school", "train" ],
        "id": "1001_0",
        "line_id": "1001",
        "locality_ids": [ "022298" ],
        "long_name": "Alfragide (Estr Seminario) - Reboleira (Estação)",
        "municipality_ids": [ "1115" ],
        "pattern_ids": [ "1001_0_2", "1001_0_1" ],
        "region_ids": [ "PT170" ],
        "short_name": "1001",
        "stop_ids": [],
        "text_color": "#FFFFFF",
        "tts_name": "Linha 1001 com percurso Alfragide ( Estrada Seminario ) - Reboleira ( - Estaçaão )"
    },
    ...
]
</code></pre></details>

## Patterns

#### `GET /patterns/:id`

Returns information for a single pattern. Due to the size of each object, it is not possible to return all patterns at once. User interfaces should present a list of lines, and request each associated patterns when the user selects a line. It is the pattern that represents the set of equal journeys of a line. Each pattern has a set of dates when it is valid, a path with the sequence of stops, a set of trips with the arrival time to each stop, and an associated shape id.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "color": "#C61D23",
        "direction_id": 0,
        "district_ids": [ "11" ],
        "facilities": [ "school", "train" ],
        "headsign": "Reboleira (Estação)",
        "id": "1001_0_1",
        "line_id": "1001",
        "locality_ids": [ "022298" ],
        "long_name": "Alfragide (Estr Seminario) - Reboleira (Estação)",
        "municipality_ids": [ "1115" ],
        "path": [
            {
                "allow_drop_off": true,
                "allow_pickup": true,
                "distance": 0,
                "distance_delta": 0,
                "stop_id": "030001",
                "stop_sequence": 1
            },
            ...
        ],
        "region_ids": [ "PT170" ],
        "route_id": "1001_0",
        "shape_id": "1_21NBI",
        "short_name": "1001",
        "text_color": "#FFFFFF",
        "trips": [
            {
                "schedule": [
                    {
                        "arrival_time": "06:20:00",
                        "arrival_time_24h": "06:20:00",
                        "stop_id": "030001",
                        "stop_sequence": 1
                    },
                    ...
                ],
                "service_ids": [ "7_21NBI", "4_21NBI", "14_21NBI", "1_21NBI" ],
                "trip_ids": [ "1001_0_1_0600_0629_0_7_21NBI", "1001_0_1_0600_0629_0_4_21NBI", "1001_0_1_0600_0629_0_14_21NBI", "1001_0_1_0600_0629_0_1_21NBI" ],
                "valid_on": [ "20250630", "20250701", "20250702", ... ],
                "version_id": "94066ee0b7c3420939467bdf7fe4b483059e8c4d52043925adad183a1a3a006c"
            },
            ...
        ],
        "tts_headsign": "Linha 1001 com destino a Reboleira ( - Estaçaão )",
        "valid_on": [ "20250705", "20250712", "20250719", ... ],
        "version_id": "73a0601fa8553dd0dc0dfe55d8d230df9464e2772fb7d546a4cfe64304b92ab6"
    }
]
</code></pre>
</details>

## Shapes

#### `GET /shapes/:id`

Returns a single shape in GTFS and Geojson format. Extension is in meters.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>{
    "extension": 6578,
    "geojson": {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [-9.220572, 38.734436],
                [-9.22055, 38.73442],
                [-9.22059, 38.73438],
                ...
            ]
        }
    },
    "points": [
        {
            "shape_dist_traveled": 0,
            "shape_pt_lat": 38.734436,
            "shape_pt_lon": -9.220572,
            "shape_pt_sequence": 1
        },
        {
            "shape_dist_traveled": 0.0026,
            "shape_pt_lat": 38.73442,
            "shape_pt_lon": -9.22055,
            "shape_pt_sequence": 2
        },
        ...
    ],
    "shape_id": "1_21NBI"
}
</code></pre>
</details>

## PIPS

#### `POST /pips/estimates`

Returns the estimates OR an error/custom message depending on the stop IDs provided. You should provide a list of stop IDs as an array under request.body, as such:
```
{ 
    "stops": [ "121270", ... ] 
}
```
Sending "000000" as a stop ID will result in a testing/placeholder response being sent.
Sending "000001" as a stop ID will result in a response similar to the ones that'd be displayed on a PIP when there are no services.
Sending "no-service" as a stop ID will result in a response similar to the ones that'd be displayed on a PIP when the stop it's on has been deactivated.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "estimatedArrivalTime": "18:39:00",
        "estimatedDepartureTime": "18:39:00",
        "estimatedTimeString": "18:39",
        "estimatedTimeUnixSeconds": 1751823540,
        "journeyId": "1607_0_2_1800_1829_0_9",
        "lineId": "1607",
        "observedArrivalTime": null,
        "observedDepartureTime": null,
        "observedDriverId": "",
        "observedVehicleId": null,
        "operatorId": "",
        "patternId": "1607_0_2",
        "stopHeadsign": "Oeiras Parque",
        "stopId": "",
        "timetabledArrivalTime": "18:39:00",
        "timetabledDepartureTime": "18:39:00"
    },
    ...
]
</code></pre></details>

#### `GET /pips/:pip/message`

Returns the :pip that's been inputed (yes, that's it)
<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>{
    "message": "ID #{:pip}"
}
</code></pre></details>

## Metrics

<details>
<summary>These endpoints return metrics about Carris Metropolitana's operation. <b>Click to expand.</b></summary>

#### `GET /metrics/demand/by_agency/day`

Returns the amount of validations, per hour, per agency, for the current operational day. (Each operational day starts at 04:00am)

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "agency_id": "41",
        "data": [
            {
                "hour_group": "2025-07-06T04:00:00.000+00:00",
                "qty": 20
            },
            ...
        ]
    },
    {
        "agency_id": "42",
        "data": [
            {
                "hour_group": "2025-07-06T04:00:00.000+00:00",
                "qty": 18
            },
            ...
        ]
    },
    {
        "agency_id": "43",
        "data": [
            {
                "hour_group": "2025-07-06T04:00:00.000+00:00",
                "qty": 68
            },
            ...
        ]
    },
    {
        "agency_id": "44",
        "data": [
            {
                "hour_group": "2025-07-06T04:00:00.000+00:00",
                "qty": 69
            },
            ...
        ]
    }
]
</code></pre></details>

#### `GET /metrics/demand/by_agency/month`

Returns the amount of validations, per day, per agency, for the current month.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "agency_id": "41",
        "data": [
            {
                "day_group": "2025-07-01",
                "qty": 194831
            },
            ...
        ]
    },
    {
        "agency_id": "42",
        "data": [
            {
                "day_group": "2025-07-01",
                "qty": 180201
            },
            ...
        ]
    },
    {
        "agency_id": "43",
        "data": [
            {
                "day_group": "2025-07-01",
                "qty": 129851
            },
            ...
        ]
    },
    {
        "agency_id": "44",
        "data": [
            {
                "day_group": "2025-07-01",
                "qty": 68227
            },
            ...
        ]
    }
]
</code></pre></details>

#### `GET /metrics/demand/by_agency/year`

Returns the amount of validations, per month, per agency, for the current year.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "agency_id": "41",
        "data": [
            {
                "month_group": "2025-01",
                "qty": 5245222
            },
            ...
        ]
    },
    {
        "agency_id": "42",
        "data": [
            {
                "month_group": "2025-01",,
                "qty": 5209597
            },
            ...
        ]
    },
    {
        "agency_id": "43",
        "data": [
            {
                "month_group": "2025-01",
                "qty": 3235178
            },
            ...
        ]
    },
    {
        "agency_id": "44",
        "data": [
            {
                "month_group": "2025-01",
                "qty": 1761925
            },
            ...
        ]
    }
]
</code></pre></details>

#### `GET /metrics/demand/by_line`

Returns the amount of validations, per hour/day, for ALL lines, in the past 14 days.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "by_day":[
            {
                "by_hour":[
                    {
                        "hour":7,
                        "qty":8
                    },
                    ...
                ],
                "day":"2025-06-21",
                "qty":133
            },
            ...
        ],
        "end_date":"20250706",
        "line_id":"1001",
        "qty":4610,
        "start_date":"20250621"
    }
]
</code></pre></details>

#### `GET /metrics/demand/by_stop`

This endpoint is currently being worked on.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[]
</code></pre></details>

#### `GET /metrics/service/all`

Returns the amount of services done, per line/agency/day, for ALL lines, in the past 14 days.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>{
    "data": [
        {
            "agency_id": "43",
            "line_id": 3001,
            "operational_date": "20250621",
            "pass_trip_count": 56,
            "pass_trip_percentage": 1,
            "total_trip_count": 56
        },
    ]
}
</code></pre></details>

#### `GET /metrics/complaints`

Returns all complaints, as well as their category and associated line/municipality.

<details>
<summary> <b>Example Response:</b> (Click to expand)</summary>
<pre><code>[
    {
        "_id": "line-1002",
        "complaints": 5,
        "email": 4,
        "filter_value": "1002",
        "info_requests": 0,
        "last_update": "20250702",
        "other": 0,
        "phone": 0,
        "total": 5,
        "type": "line"
    },
]
</code></pre></details>
</details>
</details>

## Locations

<details>
<summary>These endpoints return information about districts, municipalities, parishes and localities. <b>Click to expand.</b></summary>

#### `GET /locations/districts`

Returns information for all districts in Portugal.

**Example Response:**

```
{
    "data": [
        {
            "id": "01",
            "name": "Aveiro"
        },
        {
            "id": "02",
            "name": "Beja"
        },
        ...
    ],
    "status": "success",
    "timestamp": 1751815926545
}
```

#### `GET /locations/municipalities`

Returns information for all municipalities in Portugal.

**Example Response:**

```
{
    "data": [
        {
            "district_id": "01",
            "id": "0101",
            "name": "Águeda"
        },
        ...
    ],
    "status": "success",
    "timestamp": 1751815926545
}
```

#### `GET /locations/parishes`

Returns information for all parishes in Portugal.

**Example Response:**

```
{
    "data": [
        {
            "district_id": "03",
            "id": "0302FA",
            "municipality_id": "0302",
            "name": "União das freguesias de Milhazes, Vilar de Figos e Faria"
        },
        ...
    ],
    "status": "success",
    "timestamp": 1751815926545
}
```

#### `GET /locations/localities`

Returns information for all localities in Portugal.

**Example Response:**

```
{
    "data": [
        {
            "display": "",
            "district_id": "16",
            "id": "000001",
            "municipality_id": "1601",
            "name": "Aboim",
            "parish_id": "160101"
        },
        ...
    ],
    "status": "success",
    "timestamp": 1751815926545
}
```
</details>

## Facilities
<details>
<summary>These endpoints return various facilities in the Lisbon Metropolitan Area, from schools and PIPs to transit connections. <b>Click to expand.</b></summary>

#### `GET /facilities`

Returns all available facilities that can be fetched through the /facilities endpoint.
NOTE: Currently, the /facilities/helpdesks endpoint returns an empty array.

**Example Response:**

``` 
{
    "available_facilities": [
        "stores",
        "helpdesks",
        "schools",
        "boat_stations",
        "light_rail_stations",
        "subway_stations",
        "train_stations"
    ]
}
```

#### `GET /facilities/stores`

Known as Espaços navegante® Carris Metropolitana, these endpoints return information for all or each location, including live estimated wait times.

**Example Response:**

```
[
    {
        "brand_name": "Espaço navegante®",
        "district_id": "11",
        "district_name": "Lisboa",
        "id": "8400000000000001",
        "lat": 38.75631,
        "locality": "Queluz",
        "lon": -9.253493,
        "municipality_id": "1111",
        "municipality_name": "Sintra",
        "name": "Espaço navegante® Queluz",
        "parish_id": "26",
        "parish_name": "União das freguesias de Queluz e Belas",
        "region_id": "PT170",
        "region_name": "AML",
        "short_name": "Queluz",
        "stop_ids": [ "170927", "170928", "172063", "172476", "172495", "172499" ],
        "contacts": {
            "address": "Avenida José Elias Garcia 71",
            "email": "",
            "google_place_id": "ChIJf55o2a3NHg0RNBNFOsMt3gw",
            "phone": "210410400",
            "postal_code": "2745-155",
            "url": "https://www.carrismetropolitana.pt/encm"
        },
        "hours": {
            "friday": [ "08:00-19:00" ],
            "monday": [ "08:00-19:00" ],
            "saturday": [],
            "special": "",
            "sunday": [],
            "thursday": [ "08:00-19:00" ],
            "tuesday": [ "08:00-19:00" ],
            "wednesday": [ "08:00-19:00" ]
        },
        "realtime": null
    },
    ...
]
```

#### `GET /facilities/schools`

Returns a list of schools in the Lisbon metropolitan area. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/facilities/schools).

**Example Response:**

```
[
    {
        "district_id": "11",
        "district_name": "Lisboa",
        "grouping": "",
        "id": "10214",
        "lat": 38.67822,
        "locality": "",
        "lon": -9.325388,
        "municipality_id": "1105",
        "municipality_name": "Cascais",
        "name": "Nova School of Business and Economics",
        "nature": "",
        "parish_id": "",
        "parish_name": "",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "120793", "120794", "050005", "050421" ],
        "contacts": {
            "address":"",
            "email":"",
            "google_place_id":null,
            "phone":"",
            "postal_code":"",
            "url":""
        }
    }
    ...
]
```

#### `GET /facilities/boat_stations`

Returns a list of boat terminals in the Lisbon metropolitan area, as well as connecting bus stops. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/connections/boat_stations).

**Example Response:**

```
[
    {
        "district_id": "15",
        "district_name": "Setúbal",
        "id": "AF_1",
        "lat": 38.52145,
        "locality": "Setúbal",
        "lon": -8.885385,
        "municipality_id": "1512",
        "municipality_name": "Setúbal",
        "name": "Setúbal (Doca do Comércio)",
        "parish_id": "05",
        "parish_name": "Setúbal (São Sebastião)",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "160745", "160746" ]
    },
    ...
]
```

#### `GET /facilities/light_rail_stations`

Returns a list of Metro Sul do Tejo's light rail stops in the Lisbon metropolitan area, as well as connecting bus stops. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/connections/light_rail_stations).

**Example Response:**

```
[
    {
        "district_id": "15",
        "district_name": "Setúbal",
        "id": "MTS_1",
        "lat": 38.637163,
        "locality": "Corroios",
        "lon": -9.151019,
        "municipality_id": "1510",
        "municipality_name": "Seixal",
        "name": "Corroios",
        "parish_id": "05",
        "parish_name": "Corroios",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "149996", "140089", "149997", "149999", "149998" ]
    },
    ...
]
```

#### `GET /facilities/subway_stations`

Returns a list of Metro Lisboa's stations in the Lisbon metropolitan area, as well as connecting bus stops. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/connections/subway_stations).

**Example Response:**

```
[
    {
        "district_id": "11",
        "district_name": "Lisboa",
        "id": "AE",
        "lat": 38.7426,
        "locality": "Areeiro",
        "lon": -9.13381,
        "municipality_id": "1106",
        "municipality_name": "Lisboa",
        "name": "Areeiro",
        "parish_id": "55",
        "parish_name": "Areeiro",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "061213" ]
    },
    ...
]
```

#### `GET /facilities/train_stations`

Returns a list of train stations in the Lisbon metropolitan area, as well as connecting bus stops. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/connections/train_stations).

**Example Response:**

```
[
    {
        "district_id": "15",
        "district_name": "Setúbal",
        "id": "TRAIN_001",
        "lat": 38.518151,
        "locality": "",
        "lon": -8.83784,
        "municipality_id": "1512",
        "municipality_name": "Setúbal",
        "name": "Praias do Sado A",
        "parish_id": "151208",
        "parish_name": "Sado",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "160701", "160702" ]
    },
    ...
]
```

#### `GET /facilities/pips`

Returns a list of PIPs (Passenger Information Screens) in the Lisbon metropolitan area. [Learn more about this dataset here](https://github.com/carrismetropolitana/datasets/tree/latest/facilities/pips).

**Example Response:**

```
[
    {
        "district_id": "15",
        "district_name": "Setúbal",
        "id": "101",
        "lat": 38.7206,
        "locality": "Samouco",
        "lon": -9.004522,
        "municipality_id": "1502",
        "municipality_name": "Alcochete",
        "name": "Praça José Coelho 2",
        "region_id": "PT170",
        "region_name": "AML",
        "stop_ids": [ "010180" ]
    },
    ...
]
```
</details>
<br>

# Contributing

If you'd like to contribute new features or help fix any errors, please fork this repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, documentation improvements, and new features.
