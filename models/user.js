'use strict';

var Config = require( '../config.js' );

module.exports = {
  add: add
};

function add( data, done ) {
  try {

    done( new Error( 'Not implemented.' ) );

  } catch ( err ) {
    done( err );
  }
}
