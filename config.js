'use strict';

var Config = module.exports = {
  verbose: !!process.env.verbose,
  web: {
    name: 'akashk16_proj3',
    version: '1.0.0',
    cookie: {
      name: 'apikey'
    },
    protocol: 'http',
    hostname: process.env._hostname || process.env.hostname || 'localhost',
    port: parseInt( process.env.port ) || 80,
    _base: function () {
      return Config.web.protocol + '://' + Config.web.hostname +
             ( Config.web.port === 80 ? '' : ':' + Config.web.port );
    },
    secret: 'thisissupersecret!!!'
  },
  services: {
    db: {
      mongodb: {
        db: 'akashk16_proj3_' + ( process.env.branch || 'master' ),
        uri: 'localhost:27017/akashk16_proj3_' + ( process.env.branch || 'master' )
      }
    }
  }
};
