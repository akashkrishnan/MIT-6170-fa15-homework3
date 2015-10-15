'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var User = require( './user.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'mentions' ] );

db[ 'mentions' ].createIndex( { mention: 1, 'timestamps.created': 1 }, {} );

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
 * @param {Array.<ObjectId>} mentions - list of mentions
 * @param {number} count -
 */

/**
 * Gets a list of mentions.
 *
 * @param {object} data -
 * @param {string} data.mention - User._id
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
      mention: { type: 'string', required: true }
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

    db[ 'mentions' ].count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, null, null );
      } else {
        db[ 'mentions' ]
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 ) // TODO: IMPROVE PERFORMANCE
          .limit( data.limit || 0, function ( err, mentions ) {
            if ( err ) {
              done( err, null, null );
            } else {
              done( null, mentions, count );
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
 * Adds tweet mentions.
 *
 * @param {object} data -
 * @param {string} data.tweet - Tweet._id
 * @param {Array.<string>} data.mentions - list of mentioned User._id
 * @param {addAllCallback} done - callback
 */
function addAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      tweet: { type: 'string', required: true },
      mentions: { required: true },
      'timestamps.created': { required: true }
    } );

    if ( criteria.mentions instanceof Array ) {

      // Ensure there is something to add
      if ( criteria.mentions.length ) {

        var bulk = db[ 'mentions' ].initializeUnorderedBulkOp();

        // Add remove queries
        criteria.mentions.forEach( function ( mention ) {
          bulk.insert( {
            tweet: criteria.tweet,
            mention: mention,
            timestamps: {
              created: criteria[ 'timestamps.created' ]
            }
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
 * @param {object} data -
 * @param {string} data.tweet - Tweet._id
 * @param {removeAllCallback} done - callback
 */
function removeAll( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      tweet: { type: 'string', required: true }
    } );

    // Remove mentions from database
    db[ 'mentions' ].remove( criteria, false, function ( err ) {
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
 * @param {Array.<string>} mentions - list of unique User._id that were mentioned by @User.username
 */

/**
 * Extracts a list of unique & valid mentions in the provided message string.
 *
 * @param {string} msg - message string to extract mentions from
 * @param {extractCallback} done - callback
 */
function extract( msg, done ) {

  // Keep track of valid mentioned User._id
  var ids = [];

  // Get list of unique mentioned usernames (this includes the @)
  var mentions = Utils.unique( msg.match( /\B@[a-z0-9_-]+/gi ) || [] );

  // Loop through mentions and keep track of ids of valid usernames
  (function next( i, n ) {
    if ( i < n ) {
      User.get( { username: mentions[ i ].substring( 1 ) }, function ( err, user ) {
        if ( user ) {
          ids.push( user._id );
        }
        next( i + 1, n );
      } );
    } else {
      done( null, ids );
    }
  })( 0, mentions.length );

}
