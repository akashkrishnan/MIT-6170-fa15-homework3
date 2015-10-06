'use strict';

var colors = require( 'colors' );

module.exports = {
  log: log,
  info: info,
  warn: warn,
  error: error
};

function log( msg ) {
  console.log( msg.toString() );
}

function info( msg ) {
  console.info( msg.toString().blue );
}

function warn( msg ) {
  console.warn( msg.toString().yellow );
}

function error( msg ) {
  if ( msg instanceof Error ) {
    console.error( msg.stack.toString().red );
  } else {
    console.error( msg.toString().red );
  }
}
