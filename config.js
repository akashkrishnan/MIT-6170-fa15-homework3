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
    }
  },
  services: {
    db: {
      mongodb: {
        db: 'akashk16_proj3_' + ( process.env.branch || 'master' ),
        uri: 'localhost:27017/akashk16_proj3_' + ( process.env.branch || 'master' )
      }
    }
  },
  registration: {
    name: {
      length: {
        min: 3,
        max: 100
      }
    },
    username: {
      length: {
        min: 4,
        max: 15
      },
      regex: {
        valid: '^[A-Za-z0-9_]*$'
      }
    },
    password: {
      length: {
        min: 8,
        max: 32
      },
      regex: {
        hasNumeral: '[0-9]',
        hasUpper: '[A-Z]',
        hasLower: '[a-z]'
      }
    }
  }
};
