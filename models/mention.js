'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'mentions' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  addAll: addAll,
  removeAll: removeAll

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} mentions - list of mentions
 * @param {number} count -
 */

/**
 * Gets a list of mentions.
 *
 * @param {object} data -
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    done( 'Not Implemented.' );

  } catch ( err ) {
    done( err );
  }
}

/**
 * @callback addAllCallback
 * @param {Error} err - Error object
 */

/**
 * Adds tweet mentions.
 *
 * @param {object} data -
 * @param {string} data.tweet._id - Tweet._id
 * @param {Array.<string>} data.mentions - list of mentioned usernames
 * @param {addAllCallback} done - callback
 */
function addAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      'tweet._id': { type: 'string', required: true },
      mentions: { required: true }
    } );

    if ( criteria.mentions instanceof Array ) {

      // Ensure there is something to add
      if ( criteria.mentions.length ) {

        var bulk = db[ 'mentions' ].initializeUnorderedBulkOp();

        // Add remove queries
        criteria.mentions.forEach( function ( mention ) {
          bulk.insert( {
            tweet: { _id: criteria[ 'tweet._id' ] },
            mention: mention
          } );
        } );

        // Execute remove queries
        bulk.execute( function ( err ) {
          if ( err ) {
            done( err );
          } else {
            done( null );
          }
        } )

      } else {
        done( null );
      }

    } else {
      done( new Error(
        'Received invalid property type for `mentions`. Expected Array but found ' + typeof criteria.mentions + '.'
      ) );
    }

  } catch ( err ) {
    done( err );
  }
}

/**
 * @callback removeAllCallback
 * @param {Error} err - Error object
 */

/**
 * Removes all mentions associated with the specified tweet.
 *
 * @param {object} data
 * @param {string} data.tweet._id
 * @param {removeAllCallback} done - callback
 */
function removeAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      'tweet._id': { type: 'string', required: true }
    } );

    // Remove mentions from database
    db[ 'mentions' ].remove( { tweet: { _id: criteria[ 'tweet._id' ] } }, false, function ( err ) {
      if ( err ) {
        done( err );
      } else {
        done( null );
      }
    } );

  } catch ( err ) {
    done( err );
  }
}
