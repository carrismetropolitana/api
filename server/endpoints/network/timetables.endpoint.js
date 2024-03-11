/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

module.exports.single = async (request, reply) => {
  // const singleItem = await SERVERDB.client.get(`timetables:${request.params.line_id}/${request.params.stop_id}`);
  //4512/010136
  const singleItem = {
    "periods": [
      {
        "period_id": "1",
        "period_name": "Período Escolar",
        "weekdays": [
          {
            "time": "06:15:00",
            "exceptions": []
          },
          {
            "time": "09:45:00",
            "exceptions": []
          },
          {
            "time": "12:45:00",
            "exceptions": []
          },
          {
            "time": "13:15:00",
            "exceptions": []
          },
          {
            "time": "13:45:00",
            "exceptions": []
          },
          {
            "time": "14:05:00",
            "exceptions": []
          },
          {
            "time": "16:15:00",
            "exceptions": []
          },
          {
            "time": "17:00:00",
            "exceptions": []
          },
          {
            "time": "18:45:00",
            "exceptions": []
          },
          {
            "time": "19:15:00",
            "exceptions": []
          },
          {
            "time": "19:45:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          },
          {
            "time": "07:00:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "07:15:00",
            "exceptions": []
          },
          {
            "time": "07:45:00",
            "exceptions": []
          },
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "08:15:00",
            "exceptions": []
          },
          {
            "time": "08:30:00",
            "exceptions": []
          },
          {
            "time": "08:50:00",
            "exceptions": []
          },
          {
            "time": "10:25:00",
            "exceptions": []
          },
          {
            "time": "15:15:00",
            "exceptions": []
          },
          {
            "time": "15:45:00",
            "exceptions": []
          },
          {
            "time": "09:30:00",
            "exceptions": []
          },
          {
            "time": "10:00:00",
            "exceptions": []
          },
          {
            "time": "07:30:00",
            "exceptions": []
          },
          {
            "time": "09:15:00",
            "exceptions": []
          },
          {
            "time": "11:15:00",
            "exceptions": []
          },
          {
            "time": "14:15:00",
            "exceptions": []
          },
          {
            "time": "18:10:00",
            "exceptions": []
          },
          {
            "time": "17:45:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "06:45:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "12:15:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          }
        ],
        "saturdays": [
          {
            "time": "17:30:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "06:30:00",
            "exceptions": []
          },
          {
            "time": "07:30:00",
            "exceptions": []
          },
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "08:45:00",
            "exceptions": []
          },
          {
            "time": "10:00:00",
            "exceptions": []
          },
          {
            "time": "12:15:00",
            "exceptions": []
          },
          {
            "time": "14:00:00",
            "exceptions": []
          },
          {
            "time": "15:00:00",
            "exceptions": []
          },
          {
            "time": "17:00:00",
            "exceptions": []
          },
          {
            "time": "18:30:00",
            "exceptions": []
          },
          {
            "time": "19:30:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ],
        "sundays_holidays": [
          {
            "time": "17:30:00",
            "exceptions": []
          },
          {
            "time": "07:00:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "10:30:00",
            "exceptions": []
          },
          {
            "time": "12:15:00",
            "exceptions": []
          },
          {
            "time": "14:00:00",
            "exceptions": []
          },
          {
            "time": "15:00:00",
            "exceptions": []
          },
          {
            "time": "18:30:00",
            "exceptions": []
          },
          {
            "time": "19:45:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ]
      },
      {
        "period_id": "2",
        "period_name": "Período de Férias Escolares",
        "weekdays": [
          {
            "time": "06:15:00",
            "exceptions": []
          },
          {
            "time": "07:00:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "07:30:00",
            "exceptions": []
          },
          {
            "time": "07:45:00",
            "exceptions": []
          },
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "08:30:00",
            "exceptions": []
          },
          {
            "time": "08:50:00",
            "exceptions": []
          },
          {
            "time": "09:15:00",
            "exceptions": []
          },
          {
            "time": "09:30:00",
            "exceptions": []
          },
          {
            "time": "10:00:00",
            "exceptions": []
          },
          {
            "time": "10:25:00",
            "exceptions": []
          },
          {
            "time": "11:15:00",
            "exceptions": []
          },
          {
            "time": "12:45:00",
            "exceptions": []
          },
          {
            "time": "13:15:00",
            "exceptions": []
          },
          {
            "time": "13:45:00",
            "exceptions": []
          },
          {
            "time": "14:05:00",
            "exceptions": []
          },
          {
            "time": "14:15:00",
            "exceptions": []
          },
          {
            "time": "15:15:00",
            "exceptions": []
          },
          {
            "time": "15:45:00",
            "exceptions": []
          },
          {
            "time": "16:15:00",
            "exceptions": []
          },
          {
            "time": "17:00:00",
            "exceptions": []
          },
          {
            "time": "18:10:00",
            "exceptions": []
          },
          {
            "time": "18:45:00",
            "exceptions": []
          },
          {
            "time": "19:15:00",
            "exceptions": []
          },
          {
            "time": "19:45:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          },
          {
            "time": "06:45:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "12:15:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "17:45:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          }
        ],
        "saturdays": [
          {
            "time": "08:45:00",
            "exceptions": []
          },
          {
            "time": "06:30:00",
            "exceptions": []
          },
          {
            "time": "07:30:00",
            "exceptions": []
          },
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "10:00:00",
            "exceptions": []
          },
          {
            "time": "12:15:00",
            "exceptions": []
          },
          {
            "time": "14:00:00",
            "exceptions": []
          },
          {
            "time": "15:00:00",
            "exceptions": []
          },
          {
            "time": "17:00:00",
            "exceptions": []
          },
          {
            "time": "17:30:00",
            "exceptions": []
          },
          {
            "time": "18:30:00",
            "exceptions": []
          },
          {
            "time": "19:30:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ],
        "sundays_holidays": [
          {
            "time": "08:00:00",
            "exceptions": []
          },
          {
            "time": "15:00:00",
            "exceptions": []
          },
          {
            "time": "07:00:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "10:30:00",
            "exceptions": []
          },
          {
            "time": "12:15:00",
            "exceptions": []
          },
          {
            "time": "14:00:00",
            "exceptions": []
          },
          {
            "time": "17:30:00",
            "exceptions": []
          },
          {
            "time": "18:30:00",
            "exceptions": []
          },
          {
            "time": "19:45:00",
            "exceptions": []
          },
          {
            "time": "21:45:00",
            "exceptions": []
          },
          {
            "time": "23:45:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ]
      }
    ],
    "exceptions": [
      {
        "id": "a",
        "label": "a)",
        "text": "Exceto dia 24 de Dezembro."
      },
      {
        "id": "b",
        "label": "b)",
        "text": "Exceto dia 25 de Dezembro. Exceto dia 1 de Janeiro."
      },
      {
        "id": "c",
        "label": "c)",
        "text": "Percurso Alcochete (Freeport) - Setúbal (ITS) via Alto Estanqueiro"
      }
    ],
    "patternForDisplay": "4512_0"
  }
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};
