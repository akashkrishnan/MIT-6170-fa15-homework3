'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'followers' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  get: get,
  add: add,
  remove: remove

};

function list( data, done ) {
  try {

    done( new Error( 'Not implemented.' ) );

  } catch ( err ) {
    done( err );
  }
}

function get( data, done ) {
  try {

    done( new Error( 'Not implemented.' ) );

  } catch ( err ) {
    done( err );
  }
}

function add( data, done ) {
  try {

    done( new Error( 'Not implemented.' ) );

  } catch ( err ) {
    done( err );
  }
}

function remove( data, done ) {
  try {

    done( new Error( 'Not implemented.' ) );

  } catch ( err ) {
    done( err );
  }
}