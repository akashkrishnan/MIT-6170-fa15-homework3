'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'mentions', 'tweets' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list

};

function list( data, done ) {

}
