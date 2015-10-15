'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var User = require( './user.js' );
var Mention = require( './mention.js' );
var Hashtag = require( './hashtag.js' );
var mongojs = require( 'mongojs' );
var ObjectId = mongojs.ObjectId;
var htmlEscape = require( 'escape-html' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'tweets' ] );

db[ 'tweets' ].createIndex( { user: 1, 'timestamps.created': 1 }, {} );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  listMentions: listMentions,
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
 * @param {string} [data.user] - User._id
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
      user: { name: 'user._id', type: 'string', required: true }
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
 * @callback listMentionsCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} tweets - list of mentioned Tweet objects
 * @param {number} count - total number of elements that match query before offset and limit
 */

/**
 * Gets a list of mentioned Tweet objects.
 *
 * @param {object} data
 * @param {string} [data.user] - User._id
 * @param {object} [data.projection] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {object} [data.sort] -
 * @param {number} [data.timestamps.created] -
 * @param {number} [data.offset=0] -
 * @param {number} [data.limit=0] -
 * @param {listMentionsCallback} done - callback
 */
function listMentions( data, done ) {
  try {

    var userCriteria = Utils.validateObject( data, {
      user: { type: 'string', required: true }
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

    // Ensure valid user
    User.get( { _id: userCriteria.user }, function ( err, user ) {
      if ( err ) {
        done( err, null, null );
      } else {

        Mention.list(
          {
            mention: user._id,
            projection: {
              timestamps: false
            },
            sort: sort,
            offset: data.offset,
            limit: data.limit
          },
          function ( err, mentions, count ) {
            if ( err ) {
              done( err, null, null );
            } else {

              // Retrieve list of Tweet._id
              var ids = mentions.map( function ( mention ) {
                return ObjectId( mention.tweet );
              } );

              var criteria = { _id: { $in: ids } };

              db[ 'tweets' ]
                .find( criteria, projection )
                .sort( sort, function ( err, tweets ) {
                  if ( err ) {
                    done( err, null, null );
                  } else {
                    done( null, tweets, count );
                  }
                } );

            }
          }
        );

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
 * @param {string} [data.user] - User._id
 * @param {object} [data.projection] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {getCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      user: { name: 'user._id', type: 'string' }
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

    console.log( criteria );

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
 */

/**
 * Adds a Tweet object.
 *
 * @param {object} data -
 * @param {string} data.user - User._id
 * @param {string} data.text - message of new tweet
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var insertData = Utils.validateObject( data, {
      user: { type: 'string', required: true },
      text: { type: 'string', required: true }
    } );

    Mention.extract( insertData.text, function ( err, mentions ) {
      if ( err ) {
        done( err, null );
      } else {

        Hashtag.extract( insertData.text, function ( err, hashtags ) {
          if ( err ) {
            done( err, null );
          } else {

            var now = new Date();

            insertData.text = htmlEscape( insertData.text );

            insertData.timestamps = {
              created: now
            };

            // Ensure valid user
            User.get( { _id: insertData.user }, function ( err, user ) {
              if ( err ) {
                done( err, null, null, null );
              } else {

                // NOTE: BECAUSE THE FOLLOWING ARE STORED AND CAN CHANGE, THESE NEED TO BE UPDATED ON CHANGE
                insertData.user = {
                  _id: user._id,
                  name: user.name,
                  username: user.username
                };

                // Insert into database
                db[ 'tweets' ].insert( insertData, function ( err, tweet ) {
                  if ( err ) {
                    done( err, null, null, null )
                  } else {

                    // Add mentions
                    Mention.addAll(
                      {
                        tweet: tweet._id.toString(),
                        mentions: mentions,
                        'timestamps.created': insertData.timestamps.created
                      },
                      Utils.safeFn( function () {

                        // NOTE: Continue even if an error occurred

                        // Add hashtags
                        Hashtag.addAll(
                          {
                            tweet: tweet._id.toString(),
                            hashtags: hashtags,
                            'timestamps.created': insertData.timestamps.created
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
 * @param {object} tweet - Tweet object before removal
 */

/**
 * Removes a Tweet object.
 *
 * @param {object} data -
 * @param {*} data._id - Tweet._id
 * @param {string} [data.user] - User._id
 * @param {removeCallback} done - callback
 */
function remove( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true },
      user: { type: 'string' }
    } );

    console.log( criteria );

    // Ensure valid tweet
    get( criteria, function ( err, tweet ) {
      if ( err ) {
        done( err, null );
      } else {

        // Remove associated mentions
        Mention.removeAll( { tweet: tweet._id.toString() }, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {

            // Remove associated hashtags
            Hashtag.removeAll( { tweet: tweet._id.toString() }, function ( err ) {
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
    done( err, null );
  }
}
