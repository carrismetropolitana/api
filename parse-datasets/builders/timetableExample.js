//

const timetable = {
  periods: [
    {
      period_id: '1',
      period_name: 'Período Escolar',
      weekdays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
      saturdays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
      sundays_holidays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
    },
    {
      period_id: '2',
      period_name: 'Período de Férias Escolares',
      weekdays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
      saturdays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
      sundays_holidays: [
        {
          hour: '08',
          minutes: [
            { minute: '01', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' }] },
          ],
        },
        {
          hour: '09',
          minutes: [
            { minute: '04', exceptions: [] },
            { minute: '23', exceptions: [{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' }] },
          ],
        },
      ],
    },
  ],
  exceptions: [
    { id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' },
    { id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' },
  ],
};
