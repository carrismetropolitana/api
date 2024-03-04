/* * */

const SERVERDB = require('../../services/SERVERDB');

/* * */

module.exports.all = async (request, reply) => {
  // Disabled endpoint
  return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

module.exports.single = async (request, reply) => {
  // const singleItem = await SERVERDB.client.get(`timetables:${request.params.line_id}/${request.params.stop_id}`);
  const singleItem = {
    "periods": [
      {
        "period_id": "1",
        "period_name": "Período Escolar",
        "weekdays": [
          {
            "time": "06:42:00",
            "exceptions": []
          },
          {
            "time": "10:12:00",
            "exceptions": []
          },
          {
            "time": "13:12:00",
            "exceptions": []
          },
          {
            "time": "13:42:00",
            "exceptions": []
          },
          {
            "time": "14:12:00",
            "exceptions": []
          },
          {
            "time": "14:32:00",
            "exceptions": []
          },
          {
            "time": "16:42:00",
            "exceptions": []
          },
          {
            "time": "17:27:00",
            "exceptions": []
          },
          {
            "time": "19:12:00",
            "exceptions": []
          },
          {
            "time": "19:42:00",
            "exceptions": []
          },
          {
            "time": "20:12:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          },
          {
            "time": "07:27:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "07:42:00",
            "exceptions": []
          },
          {
            "time": "08:12:00",
            "exceptions": []
          },
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "08:42:00",
            "exceptions": []
          },
          {
            "time": "08:57:00",
            "exceptions": []
          },
          {
            "time": "09:17:00",
            "exceptions": []
          },
          {
            "time": "10:52:00",
            "exceptions": []
          },
          {
            "time": "15:42:00",
            "exceptions": []
          },
          {
            "time": "16:12:00",
            "exceptions": []
          },
          {
            "time": "09:57:00",
            "exceptions": []
          },
          {
            "time": "10:27:00",
            "exceptions": []
          },
          {
            "time": "07:57:00",
            "exceptions": []
          },
          {
            "time": "09:42:00",
            "exceptions": []
          },
          {
            "time": "11:42:00",
            "exceptions": []
          },
          {
            "time": "14:42:00",
            "exceptions": []
          },
          {
            "time": "18:37:00",
            "exceptions": []
          },
          {
            "time": "18:13:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "07:13:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "12:43:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          }
        ],
        "saturdays": [
          {
            "time": "17:57:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "06:57:00",
            "exceptions": []
          },
          {
            "time": "07:57:00",
            "exceptions": []
          },
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "09:12:00",
            "exceptions": []
          },
          {
            "time": "10:27:00",
            "exceptions": []
          },
          {
            "time": "12:42:00",
            "exceptions": []
          },
          {
            "time": "14:27:00",
            "exceptions": []
          },
          {
            "time": "15:27:00",
            "exceptions": []
          },
          {
            "time": "17:27:00",
            "exceptions": []
          },
          {
            "time": "18:57:00",
            "exceptions": []
          },
          {
            "time": "19:57:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ],
        "sundays_holidays": [
          {
            "time": "17:57:00",
            "exceptions": []
          },
          {
            "time": "07:27:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "10:57:00",
            "exceptions": []
          },
          {
            "time": "12:42:00",
            "exceptions": []
          },
          {
            "time": "14:27:00",
            "exceptions": []
          },
          {
            "time": "15:27:00",
            "exceptions": []
          },
          {
            "time": "18:57:00",
            "exceptions": []
          },
          {
            "time": "20:12:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
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
            "time": "06:42:00",
            "exceptions": []
          },
          {
            "time": "07:27:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "07:57:00",
            "exceptions": []
          },
          {
            "time": "08:12:00",
            "exceptions": []
          },
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "08:57:00",
            "exceptions": []
          },
          {
            "time": "09:17:00",
            "exceptions": []
          },
          {
            "time": "09:42:00",
            "exceptions": []
          },
          {
            "time": "09:57:00",
            "exceptions": []
          },
          {
            "time": "10:27:00",
            "exceptions": []
          },
          {
            "time": "10:52:00",
            "exceptions": []
          },
          {
            "time": "11:42:00",
            "exceptions": []
          },
          {
            "time": "13:12:00",
            "exceptions": []
          },
          {
            "time": "13:42:00",
            "exceptions": []
          },
          {
            "time": "14:12:00",
            "exceptions": []
          },
          {
            "time": "14:32:00",
            "exceptions": []
          },
          {
            "time": "14:42:00",
            "exceptions": []
          },
          {
            "time": "15:42:00",
            "exceptions": []
          },
          {
            "time": "16:12:00",
            "exceptions": []
          },
          {
            "time": "16:42:00",
            "exceptions": []
          },
          {
            "time": "17:27:00",
            "exceptions": []
          },
          {
            "time": "18:37:00",
            "exceptions": []
          },
          {
            "time": "19:12:00",
            "exceptions": []
          },
          {
            "time": "19:42:00",
            "exceptions": []
          },
          {
            "time": "20:12:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          },
          {
            "time": "07:13:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "12:43:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          },
          {
            "time": "18:13:00",
            "exceptions": [
              {
                "id": "c"
              }
            ]
          }
        ],
        "saturdays": [
          {
            "time": "09:12:00",
            "exceptions": []
          },
          {
            "time": "06:57:00",
            "exceptions": []
          },
          {
            "time": "07:57:00",
            "exceptions": []
          },
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "10:27:00",
            "exceptions": []
          },
          {
            "time": "12:42:00",
            "exceptions": []
          },
          {
            "time": "14:27:00",
            "exceptions": []
          },
          {
            "time": "15:27:00",
            "exceptions": []
          },
          {
            "time": "17:27:00",
            "exceptions": []
          },
          {
            "time": "17:57:00",
            "exceptions": []
          },
          {
            "time": "18:57:00",
            "exceptions": []
          },
          {
            "time": "19:57:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
            "exceptions": [
              {
                "id": "a"
              }
            ]
          }
        ],
        "sundays_holidays": [
          {
            "time": "08:27:00",
            "exceptions": []
          },
          {
            "time": "15:27:00",
            "exceptions": []
          },
          {
            "time": "07:27:00",
            "exceptions": [
              {
                "id": "b"
              }
            ]
          },
          {
            "time": "10:57:00",
            "exceptions": []
          },
          {
            "time": "12:42:00",
            "exceptions": []
          },
          {
            "time": "14:27:00",
            "exceptions": []
          },
          {
            "time": "17:57:00",
            "exceptions": []
          },
          {
            "time": "18:57:00",
            "exceptions": []
          },
          {
            "time": "20:12:00",
            "exceptions": []
          },
          {
            "time": "22:12:00",
            "exceptions": []
          },
          {
            "time": "24:12:00",
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
    "variantForDisplay": "4512_0"
  }
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(singleItem || {});
};
