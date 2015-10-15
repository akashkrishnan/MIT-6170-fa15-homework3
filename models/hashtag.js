'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'hashtags' ] );

db[ 'hashtags' ].createIndex( { hashtag: 1, 'timestamps.created': 1 }, {} );

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
 * @param {Array.<object>} hashtags - list of Hashtag objects
 * @param {number} count -
 */

/**
 * Gets a list of hashtags.
 *
 * @param {object} data -
 * @param {string} data.hashtag - hashtag with #
 * @param {object} [data.projection] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {object} [data.sort] -
 * @param {number} [data.timestamps.created] -
 * @param {number} [data.offset=0] -
 * @param {number} [data.limit=0] -
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      hashtag: { type: 'string', required: true }
    } );

    var projection = Utils.validateObject( data, {
      projection: {
        type: {
          timestamps: { type: 'boolean' }
        },
        filter: 'projection',
        default: {} // TODO: DEFAULT TO MINIMAL PROJECTION
      }
    } ).projection;

    var sort = Utils.validateObject( data, {
      sort: {
        type: {
          'timestamps.created': { type: 'number' }
        },
        default: { 'timestamps.created': -1 }
      }
    } ).sort;

    db[ 'hashtags' ].count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, null, null );
      } else {
        db[ 'hashtags' ]
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 ) // TODO: IMPROVE PERFORMANCE
          .limit( data.limit || 0, function ( err, hashtags ) {
            if ( err ) {
              done( err, null, null );
            } else {
              done( null, hashtags, count );
            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
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
 * @param {string} data.tweet - Tweet._id
 * @param {Array.<string>} data.hashtags - list of mentioned hashtags with #
 * @param {addAllCallback} done - callback
 */
function addAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      tweet: { type: 'string', required: true },
      hashtags: { required: true },
      'timestamps.created': { required: true }
    } );

    if ( criteria.hashtags instanceof Array ) {

      // Ensure there is something to add
      if ( criteria.hashtags.length ) {

        var bulk = db[ 'hashtags' ].initializeUnorderedBulkOp();

        // Add remove queries
        criteria.hashtags.forEach( function ( hashtag ) {
          bulk.insert( {
            tweet: criteria.tweet,
            hashtag: hashtag,
            timestamps: { created: criteria[ 'timestamps.created' ] }
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
      tweet: { type: 'string', required: true }
    } );

    // Remove mentions from database
    db[ 'hashtags' ].remove( criteria, false, function ( err ) {
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
 * @callback extractCallback
 * @param {Error} err - Error object
 * @param {Array.<string>} hashtags - list of unique hashtags
 */

/**
 * Extracts a list of unique hashtags in the provided message string.
 *
 * @param {string} msg - message string to extract hashtags from
 * @param {extractCallback} done - callback
 */
function extract( msg, done ) {
  var hashtags = Utils.unique( msg.match( /\S*#(?:\[[^\]]+\]|\S+)/gi ) || [] );
  done( null, hashtags );
}
