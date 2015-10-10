'use strict';

var colors = require( 'colors' );

module.exports = {
  log: log,
  info: info,
  warn: warn,
  error: error
};

function log( msg ) {
  console.log( (msg + '' ) );
}

function info( msg ) {
  console.info( (msg + '' ).blue );
}

function warn( msg ) {
  console.warn( (msg + '' ).yellow );
}

function error( msg ) {
  if ( msg instanceof Error ) {
    console.error( (msg.stack + '' ).red );
  } else {
    console.error( (msg + '' ).red );
  }
}
