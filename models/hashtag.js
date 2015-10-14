'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'hashtags' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  addAll: addAll,
  removeAll: removeAll,


  //---------------INTERNAL---------------//

  extract: extract

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} hashtags - list of hashtags
 * @param {number} count -
 */

/**
 * Gets a list of hashtags.
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
 * Adds tweet hashtags.
 *
 * @param {object} data -
 * @param {string} data.tweet._id - Tweet._id
 * @param {Array.<string>} data.hashtags - list of mentioned hashtags
 * @param {addAllCallback} done - callback
 */
function addAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      'tweet._id': { type: 'string', required: true },
      hashtags: { required: true }
    } );

    if ( criteria.hashtags instanceof Array ) {

      // Ensure there is something to add
      if ( criteria.hashtags.length ) {

        var bulk = db[ 'hashtags' ].initializeUnorderedBulkOp();

        // Add remove queries
        criteria.hashtags.forEach( function ( hashtag ) {
          bulk.insert( {
            tweet: { _id: criteria[ 'tweet._id' ] },
            hashtag: hashtag
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
        'Received invalid property type for `hashtags`. Expected Array but found ' + typeof criteria.hashtags + '.'
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
 * Removes all hashtags associated with the specified tweet.
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
    db[ 'hashtags' ].remove( { tweet: { _id: criteria[ 'tweet._id' ] } }, false, function ( err ) {
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

/**
 * Extracts a list of unique hashtags in the provided message string.
 *
 * @param {string} msg - message string to extract hashtags from
 * @returns {Array.<string>} - list of unique hashtags
 */
function extract( msg ) {
  return Utils.unique( msg.match( /\S*#(?:\[[^\]]+\]|\S+)/gi ) || [] );
}
