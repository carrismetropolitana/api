const protobuf = require('protobufjs');
const gtfsRealtime = protobuf.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

function createAlertFeed(alertJson) {
  const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');

  const feed = {
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 0,
      timestamp: Math.floor(Date.now() / 1000),
    },
    entity: [],
  };

  const Alert = gtfsRealtime.root.lookupType('transit_realtime.Alert');
  const TranslatedString = gtfsRealtime.root.lookupType('transit_realtime.TranslatedString');

  for (let entity of alertJson.entity) {
    let alert = {
      cause: Alert.Cause[entity.alert.cause],
      effect: Alert.Effect[entity.alert.effect],
      url: TranslatedString.fromObject({
        translation: [
          TranslatedString.Translation.create({
            text: entity.alert.pid,
            language: 'pt',
          }),
        ],
      }),
      activePeriod: [
        {
          start: entity.alert.active_period.start,
          end: entity.alert.active_period.end,
        },
      ],
      headerText: TranslatedString.fromObject({
        translation: [TranslatedString.Translation.create(entity.alert.header_text[0].translation)],
      }),
      descriptionText: TranslatedString.fromObject({
        translation: [TranslatedString.Translation.create(entity.alert.description_text[0].translation)],
      }),
      informedEntity: [],
    };
    if (entity.alert.image[0].localized_image.url != '') {
      alert.image = {
        localizedImage: [
          {
            language: entity.alert.image[0].localized_image.language,
            mediaType: entity.alert.image[0].localized_image.media_type,
            url: entity.alert.image[0].localized_image.url,
          },
        ],
      };
    }
    for (let informed_entity of entity.alert.informed_entity) {
      if (informed_entity.stop_id) {
        alert.informedEntity.push({
          stopId: informed_entity.stop_id,
        });
      } else if (informed_entity.route_id) {
        alert.informedEntity.push({
          routeId: informed_entity.route_id,
        });
      }
    }
    feed.entity.push({
      id: entity.id,
      alert: alert,
    });
  }
  const message = FeedMessage.create(feed);
  const buffer = FeedMessage.encode(message).finish();

  // Decode binary to JSON
  const testDecodeMessage = FeedMessage.decode(buffer);
  const testDecodeMessageJson = FeedMessage.toObject(testDecodeMessage);
  // json now contains decoded data
  console.log(testDecodeMessageJson);
  console.log(testDecodeMessageJson.entity[1]);
  console.log(testDecodeMessageJson.entity[1].alert);
  console.log(testDecodeMessageJson.entity[1].alert.activePeriod[0].start);
  console.log(testDecodeMessageJson.entity.slice(-1)[0]);
  console.log(testDecodeMessageJson.entity.slice(-1)[0].alert);
  return buffer;
}

module.exports = {
  createAlertFeed,
};
