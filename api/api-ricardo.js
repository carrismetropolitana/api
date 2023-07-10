// ALL STOPS

const allStops = [
  {
    _id: '648f0e993ee3aae59ee3a276',
    intermodal_connections: [],
    near_services: [],
    wheelchair_boarding: null,
    region_name: 'AML',
    region_id: 'PT170',
    district_name: 'Setúbal',
    district_id: '15',
    municipality_name: 'Alcochete',
    municipality_id: '1502',
    parish_name: null,
    parish_id: null,
    locality: 'Alcochete',
    longitude: -8.959557,
    latitude: 38.754244,
    tts_name: 'Rua Carlos Manuel Rodrigues Francisco 229 Escola Monte Novo',
    short_name: null,
    name: 'R Carlos M. R. Francisco 229 (Escola Monte Novo)',
    code: '010001',
    lines: ['1001', '1002'],
    patterns: ['1001_1_0', '1002_2_0'],
  },
  {
    /* ... */
  },
];

const singleStop = allStops[0 /* stop_id */];

//
//
// LINES

const allLines = [
  {
    _id: '648f09473ee3aae59ee3977d',
    code: '1001',
    short_name: '1001',
    long_name: 'Alfragide (Estr Seminario) - Reboleira (Estação)',
    color: '#ED1944',
    text_color: '#FFFFFF',
    pattern_codes: ['1001_0_1', '1001_0_2'],
  },
  {
    /* ... */
  },
];

const singleLine = allLines[0 /* line_id */];

//
//
// PATTERNS

const allPatterns = null; // Não existe

const singlePattern = {
  code: '',
  line_code: '',
  direction: 1,
  short_name: '',
  headsign: '',
  color: '',
  text_color: '',
  valid_on: ['20230101'],
  shape_code: '',
  path: [],
  trips: [
    {
      trip_code: '',
      calendar_code: '',
      dates: ['20230101'],
      schedule: [
        {
          stop_code: '123456',
          allow_pickup: true,
          allow_drop_off: true,
          distance_delta: 2500,
          arrival_time: '12:13:14',
          arrival_time_operation: '12:13:14',
          travel_time: 2427,
        },
        {
          stop_code: '123456',
          allow_pickup: true,
          allow_drop_off: true,
          distance_delta: 2500,
          arrival_time: '12:13:14',
          arrival_time_operation: '12:13:14',
          travel_time: 2427,
        },
      ],
    },
  ],
};

const singleShape = {
  /* igual à shape */
};

const singlePath = {
  code: '',
  path: [singleStop, singleStop],
};
