'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var User = require( './user.js' );
var Mention = require( './mention.js' );
var Hashtag = require( './Hashtag.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'tweets' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  get: get,
  add: add,
  remove: remove

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} tweets - list of Tweet objects
 * @param {number} count - total number of elements that match query before offset and limit
 */

/**
 * Gets a list of Tweet objects.
 *
 * @param {object} data
 * @param {string} [data.user._id] - User._id
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
      'user._id': { filter: 'MongoId', required: true }
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

    db[ 'tweets' ].count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, null, null );
      } else {
        db[ 'tweets' ]
          .find( criteria, projection )
          .sort( sort )
          .skip( data.offset || 0 ) // TODO: IMPROVE PERFORMANCE
          .limit( data.limit || 0, function ( err, tweets ) {
            if ( err ) {
              done( err, null, null );
            } else {
              done( null, tweets, count );
            }
          } );
      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

/**
 * @callback getCallback
 * @param {Error} err - Error object
 * @param {object} tweet - Tweet object
 */

/**
 * Gets a Tweet object.
 *
 * @param {object} data -
 * @param {*} data._id - Tweet._id
 * @param {string} [data.user._id] - User._id
 * @param {object} [data.projection] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {getCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      '_id': { filter: 'MongoId', required: true },
      'user._id': { type: 'string' }
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

    db[ 'tweets' ].findOne( criteria, projection, function ( err, tweet ) {
      if ( err ) {
        done( err, null );
      } else if ( tweet ) {
        done( null, tweet );
      } else {
        done( new Error( 'Tweet not found.' ), null );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} tweet - newly added Tweet object
 * @param {Array.<string>} mentions - list of mentions
 * @param {Array.<string>} hashtags - list of hashtags
 */

/**
 * Adds a Tweet object.
 *
 * @param {object} data -
 * @param {string} data.user._id - User._id
 * @param {string} data.text - message of new tweet
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      'user._id': { type: 'string', required: true }
    } );

    var insertData = Utils.validateObject( data, {
      text: { type: 'string', required: true }
    } );

    var mentions = extractMentions( insertData.text );
    var hashtags = extractHashtags( insertData.text );

    var now = new Date();

    insertData.user = {
      _id: criteria[ 'user._id' ]
    };

    insertData.timestamps = {
      created: now,
      modified: now,
      removed: null
    };

    // Ensure valid user
    User.get( { _id: insertData.user._id }, function ( err ) {
      if ( err ) {
        done( err, null );
      } else {

        // Insert into database
        db[ 'tweets' ].insert( insertData, function ( err, tweet ) {
          if ( err ) {
            done( err )
          } else {

            // Add mentions
            Mention.addAll(
              {
                'tweet._id': tweet._id,
                mentions: mentions
              },
              Utils.safeFn( function () {

                // NOTE: Continue even if an error occurred

                // Add hashtags
                Hashtag.addAll(
                  {
                    'tweet._id': tweet._id,
                    hashtags: hashtags
                  },
                  Utils.safeFn( function () {

                    // NOTE: Continue even if an error occurred
                    done( null, tweet, mentions, hashtags );

                  } )
                );

              } )
            );

          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null, null, null );
  }
}

/**
 * @callback removeCallback
 * @param {Error} err - Error object
 * @param {object} tweet - Tweet object before removal
 */

/**
 * Removes a Tweet object.
 *
 * @param {object} data -
 * @param {*} data._id - Tweet._id
 * @param {string} [data.user._id] - User._id
 * @param {removeCallback} done - callback
 */
function remove( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      '_id': { filter: 'MongoId', required: true },
      'user._id': { type: 'string' }
    } );

    // Ensure valid tweet
    get( criteria, function ( err, tweet ) {
      if ( err ) {
        done( err, null );
      } else {

        // Remove associated mentions
        Mention.removeAll( { 'tweet._id': tweet._id }, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {

            // Remove associated hashtags
            Hashtag.removeAll( { 'tweet._id': tweet._id }, function ( err ) {
              if ( err ) {
                done( err, null );
              } else {

                // Remove tweet from database
                db[ 'tweets' ].remove( { _id: tweet._id }, true, function ( err ) {
                  if ( err ) {
                    done( err, null );
                  } else {
                    done( null, tweet );
                  }
                } );

              }
            } );

          }
        } );

      }
    } );

  } catch ( err ) {
    done( err );
  }
}

/**
 * TODO: ENSURE VALID USERNAMES
 * TODO: RETRIEVE USER ID?
 *
 * @param msg
 * @returns {*|Boolean|Array|{index: number, input: string}}
 */
function extractMentions( msg ) {
  return msg.match( /\B@[a-z0-9_-]+/gi );
}

function extractHashtags( msg ) {
  return msg.match( /\S*#(?:\[[^\]]+\]|\S+)/gi );
}
