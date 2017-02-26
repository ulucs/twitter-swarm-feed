const config = require('./config.js');
const Twitter = require('twitter');
const rp = require('request-promise');

const client = Twitter(config.twitter);

const swarmUrl = shortId =>
  `https://api.foursquare.com/v2/checkins/resolve?oauth_token=${config.swarm.oauthToken}&v=20131016&shortId=${shortId}`;

let stream = client.stream('statuses/filter', {track: 'swarmapp'});

stream.on('error', console.error);

stream.on('data', event => {
  if(Math.random() < 0.05 && event && event.entities &&
      event.entities.urls && event.entities.urls[0] &&
      event.entities.urls[0].display_url.startsWith('swarmapp.com/c/')) {
    const sid = event.entities.urls[0].display_url.substr(-11);
    rp.get(swarmUrl(sid)).then(resp => {
      const data = JSON.parse(resp);
      if(Object.keys(data.response)[0] === "checkin") {
        return rp({
          uri: 'http://localhost:1337/swarmcheckins/pushhandler',
          json: true,
          body: data,
          method: 'POST'
        });
      }
      return 200;
    }).then(data => {
      return 'ok.';
    });
  }
})
