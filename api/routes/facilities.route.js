/* * */
/* IMPORTS */

//
module.exports.all = async (request, reply) => {
  const collection = this.mongo.db.collection('facilities');
  const foundManyDocuments = await collection.find();
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  foundManyDocuments.sort((a, b) => collator.compare(a.code, b.code));
  return reply.send(foundManyDocuments || []);
};

//
module.exports.single = async (request, reply) => {
  const collection = this.mongo.db.collection('facilities');
  const foundOneDocument = await collection.findOne({ code: { $eq: request.params.code } });
  return reply.send(foundOneDocument || {});
};
