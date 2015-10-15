'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var Follower = require( './follower.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'mentions', 'tweets' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list

};

/**
 * @callback listCallback
 * @param {Error} err - Error object
 * @param {Array.<object>} tweets - list of Tweet objects
 */

/**
 * ...
 *
 * @param {object} data -
 * @param {string} data.user - User._id
 * @param {object} [data.projection] -
 * @param {boolean} [data.projection.timestamps] -
 * @param {number} [data.offset=0] - offset
 * @param {number} [data.limit=0] - limit
 * @param {listCallback} done - callback
 */
function list( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
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

    // Get list of users we follow
    Follower.list( { follower: criteria.user }, function ( err, followers ) {
      if ( err ) {
        done( err, null, null );
      } else {

        // Convert to a list of User._ids
        var users = followers.map( function ( follower ) {
          return follower.followee;
        } );

        // Add ourselves to users
        users.push( criteria[ 'user' ] );

        // Get list of mentions for all users
        db[ 'mentions' ].find(
          {
            mention: { $in: users },
            limit: data.limit
          },
          function ( err, mentions ) {
            if ( err ) {
              done( err, null, null );
            } else {

              // Convert to list of Tweet._id
              var mention_tweets = mentions.map( function ( mention ) {
                return mention.tweet;
              } );

              var criteria = {
                $or: [
                  { user: { $in: users } },
                  { _id: { $in: mention_tweets } }
                ]
              };

              db[ 'tweets' ].count( criteria, function ( err, count ) {
                if ( err ) {
                  done( err, null, null );
                } else {

                  // Get tweets for all users and mention_tweets
                  db[ 'tweets' ]
                    .find( criteria, projection )
                    .limit( data.limit || 0, function ( err, tweets ) {
                      if ( err ) {
                        done( err, null, null );
                      } else {
                        done( null, tweets, count );
                      }
                    }
                  );

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
