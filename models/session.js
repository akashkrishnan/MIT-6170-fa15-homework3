'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );
var crypto = require( 'crypto' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'sessions' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  get: get,
  add: add,
  remove: remove

};

/**
 * @callback getCallback
 * @param {Error} err - Error object
 * @param {object} session - Session object
 */

/**
 * Get a Session object.
 *
 * @param {object} data -
 * @param {string} data._id - Session._id
 * @param {getCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { type: 'string', required: true }
    } );

    db[ 'sessions' ].findOne( criteria, function ( err, session ) {
      if ( err ) {
        done( err, null );
      } else {
        done( null, session );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} session - newly added Session object
 */

/**
 * Add a new Session object with the provided value to the database.
 *
 * @param {object} data -
 * @param {*} data.value - value to store in session
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var insertData = Utils.validateObject( data, {
      value: { required: true }
    } );

    // Generate cryptographically secure apikey
    insertData._id = crypto.randomBytes( 256 / 8 ).toString( 'hex' );

    // Insert into database
    db[ 'sessions' ].insert( insertData, function ( err, session ) {
      if ( err ) {
        done( err, null );
      } else {

        // Get session to maintain public model consistency
        get( { _id: session._id }, function ( err, session ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, session );
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback removeCallback
 * @param {Error} err - Error object
 * @param {object} session - removed Session object
 */

/**
 * Removes a session from the database.
 *
 * @param {object} data -
 * @param {string} data._id - Session._id
 * @param {removeCallback} done - callback
 */
function remove( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { type: 'string', required: true }
    } );

    // Ensure valid session
    get( criteria, function ( err, session ) {
      if ( err ) {
        done( err, null );
      } else {

        // Remove from database
        db[ 'sessions' ].remove( criteria, true, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, session );
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}
