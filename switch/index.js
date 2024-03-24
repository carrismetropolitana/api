/* * */

const fastify = require('fastify')({ logger: true, requestTimeout: 10000 });

/* * */

fastify.get('/pip/:id', require('./handlers/pip.handler').handler);

/* * */

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
