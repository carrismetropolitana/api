/* * */
/* IMPORTS */
const express = require('express');
const router = express.Router();
const { Readable } = require('stream');

//
router.get('/:stop_id/:route_short_name/:direction_id', async (req, res) => {
  try {
    const pdf_base_url = 'https://raw.githubusercontent.com/carrismetropolitana/pdfs/latest/horarios/';
    const pdf_filename = `horario-singular-${req.params.stop_id}-${req.params.route_short_name}-${req.params.direction_id}.pdf`;
    const response = await fetch(pdf_base_url + pdf_filename);
    if (response.ok) {
      await res.setHeader('Content-Type', 'application/pdf');
      await res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename}"`);
      const pdfStream = Readable.from(response.body);
      pdfStream.pipe(res);
      console.log(`🟢 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Exists`);
    } else {
      await res.status(404).send();
      console.log(`🟡 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": File Not Found`);
    }
  } catch (err) {
    await res.status(500).send({});
    console.log(`🔴 → Request for "/api/pdf/${req.params.stop_id}/${req.params.route_short_name}/${req.params.direction_id}": Server Error`, err);
  }
});

module.exports = router;
