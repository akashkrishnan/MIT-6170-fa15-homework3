'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var User = require( './user.js' );
var mongojs = require( 'mongojs' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'friends' ] );

db[ 'friends' ].createIndex( { 'follower': 1, 'followee': 1 }, {} );
db[ 'friends' ].createIndex( { 'follower': 1, 'timestamps.created': 1 }, {} );
db[ 'friends' ].createIndex( { 'followee': 1, 'timestamps.created': 1 }, {} );

module.exports = {

  //---------------EXTERNAL---------------//

  list: list,
  get: get,
  add: add,
  remove: remove

};

function list( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      follower: { type: 'string' },
      followee: { type: 'string' }
    } );

    if ( criteria.follower ) {
      delete criteria.followee;
    } else if ( criteria.followee ) {
      delete criteria.follower;
    } else {
      return done( 'Invalid arguments. Expected follower or followee.' );
    }

    // TODO: ENSURE VALID FOLLOWER OR FOLLOWEE?

    db[ 'friends' ].count( criteria, function ( err, count ) {
      if ( err ) {
        done( err, null, null );
      } else {

        db[ 'friends' ].find( criteria, function ( err, followers ) {
          if ( err ) {
            done( err, null, null );
          } else {
            done( null, followers, count );
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null, null );
  }
}

function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      follower: { type: 'string', required: true },
      followee: { type: 'string', required: true }
    } );

    db[ 'friends' ].findOne( criteria, function ( err, follower ) {
      if ( err ) {
        done( err );
      } else if ( follower ) {
        done( null, follower );
      } else {
        done( 'Follower not found: ' + JSON.stringify( criteria ) );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      follower: { type: 'string', required: true },
      followee: { type: 'string', required: true }
    } );

    criteria.timestamps = {
      created: new Date()
    };

    // Ensure follower and followee are different
    if ( criteria.follower === criteria.followee ) {
      done( new Error( 'You cannot follow yourself.' ), null );
    } else {

      // Ensure user is not already following followee
      get( criteria, function ( err ) {
        if ( err ) {

          // Ensure valid follower
          User.get( { _id: criteria.follower }, function ( err ) {
            if ( err ) {
              done( err, null );
            } else {

              // Ensure valid followee
              User.get( { _id: criteria.followee }, function ( err ) {
                if ( err ) {
                  done( err, null );
                } else {

                  // Insert follower into database
                  db[ 'friends' ].insert( criteria, function ( err ) {
                    if ( err ) {
                      done( err, null );
                    } else {

                      // Properly get follower
                      get( criteria, function ( err, follower ) {
                        if ( err ) {
                          done( err, null );
                        } else {
                          done( null, follower );
                        }
                      } );

                    }
                  } );

                }
              } );

            }
          } );

        } else {
          done( new Error( 'User already followed.' ) );
        }
      } );

    }

  } catch ( err ) {
    done( err, null );
  }
}

function remove( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      follower: { type: 'string', required: true },
      followee: { type: 'string', required: true }
    } );

    // Ensure user is following followee
    get( criteria, function ( err, follower ) {
      if ( err ) {
        done( new Error( 'User not followed.' ) );
      } else {

        // Delete follower from database
        db[ 'friends' ].remove( criteria, true, function ( err ) {
          if ( err ) {
            done( err, null );
          } else {
            done( null, follower );
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err );
  }
}
