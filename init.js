'use strict';

var Config = require( './config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri );

console.log( util.format( 'Dropping database: %s.', Config.services.db.mongodb.db ) );
db.dropDatabase( function ( err ) {

  if ( err ) {
    throw err;
  }

  console.log( 'DONE.' );
  process.exit();

} );
