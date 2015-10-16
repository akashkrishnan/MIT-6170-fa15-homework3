'use strict';

var Config = require( '../config.js' );
var Utils = require( '../models/utils.js' );
var Session = require( '../models/session.js' );
var User = require( '../models/user.js' );
var Feed = require( '../models/feed.js' );
var Tweet = require( '../models/tweet.js' );
var Follower = require( '../models/follower.js' );

module.exports = function ( app ) {

  app.get( '/', index );
  app.get( '/config.json', config );
  app.get( '/register', register );
  app.get( '/logout', logout );
  app.get( '/mentions', mentions );
  app.get( '/friends', friends );
  app.get( '/:username', userProfile );
  app.post( '/api/login', apiLogin );
  app.post( '/api/register', apiRegister );
  app.post( '/api/logout', apiLogout );
  app.post( '/api/tweet', apiTweetAdd );
  app.delete( '/api/tweet/:_id', apiTweetRemove );
  app.post( '/api/tweet/:_id/retweet', apiTweetRetweet );
  app.post( '/api/user/:followee/follow', apiUserFollow );
  app.post( '/api/user/:followee/unfollow', apiUserUnfollow );

  app.get( '*', otherwise );

};

function config( req, res ) {
  res.json( Utils.validateObject( Config, {
    registration: { required: true }
  } ) );
}

function index( req, res ) {
  if ( req.user ) {

    // Get tweets in feed
    Feed.list(
      {
        user: req.user._id,
        limit: 0
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'home', {
            web: Config.web,
            self: req.user,
            tweets: tweets
          } );
        }
      } )
    );

  } else {
    res.render( 'login', {
      web: Config.web
    } );
  }
}

function register( req, res, next ) {

  // Ensure guest (i.e. no user)
  if ( !req.user ) {
    res.render( 'register', {
      web: Config.web
    } );
  } else {
    next();
  }

}

function logout( req, res ) {

  // This route is restricted to authenticated users
  if ( req.user ) {

    // Remove session
    Session.remove( { _id: req.apikey }, Utils.safeFn( function ( err ) {
      if ( err ) {
        res.redirect( '/' );
      } else {

        // Remove cookie
        res.clearCookie( Config.web.cookie.name ).redirect( '/' );

      }
    } ) );

  } else {
    res.redirect( '/' );
  }

}

function mentions( req, res, next ) {

  // This route is restricted to authenticated users
  if ( req.user ) {

    // Get tweets
    Tweet.listFromMentions(
      {
        user: req.user._id,
        limit: 0
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'mentions', {
            web: Config.web,
            self: req.user,
            tweets: tweets
          } );
        }
      } )
    );

  } else {
    next();
  }

}

function friends( req, res, next ) {

  // This route is restricted to authenticated users
  if ( req.user ) {

    // Get tweets
    Tweet.listFromFriends(
      {
        user: req.user._id,
        limit: 0
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'friends', {
            web: Config.web,
            self: req.user,
            tweets: tweets
          } );
        }
      } )
    );

  } else {
    next();
  }
}

function userProfile( req, res, next ) {

  // NOTE: This is visible to the public.

  // Ensure valid username
  User.get( { username: req.params.username }, Utils.safeFn( function ( err, user ) {
    if ( err ) {
      next();
    } else {

      // Get tweets
      Tweet.list(
        {
          user: user._id,
          limit: 0
        },
        Utils.safeFn( function ( err, tweets ) {
          if ( err ) {
            res.json( { err: err } );
          } else {

            if ( req.user ) {

              // Get following state
              Follower.get( { follower: req.user._id, followee: user._id }, function ( err, follower ) {
                res.render( 'user', {
                  web: Config.web,
                  self: req.user,
                  user: user,
                  following: !!follower,
                  tweets: tweets
                } );
              } );

            } else {
              res.render( 'user', {
                web: Config.web,
                self: {},
                user: user,
                following: false,
                tweets: tweets
              } );
            }

          }
        } )
      );

    }
  } ) );

}

function apiLogin( req, res ) {

  // Ensure guest (i.e. no user)
  if ( !req.user ) {

    // Check if user exists with username and password
    User.get( req.body, Utils.safeFn( function ( err, user ) {
      if ( err ) {
        res.json( { err: 'Invalid Credentials' } );
      } else {

        // Add new session that persists indefinitely until logout
        Session.add( { value: user._id }, Utils.safeFn( function ( err, session ) {
          if ( err ) {
            res.json( { err: err } );
          } else {

            // Set cookie to be used for future authentication
            res.cookie( Config.web.cookie.name, session._id ).json( {} );

          }
        } ) );

      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User is already logged in.' } );
  }

}

function apiRegister( req, res ) {

  // Ensure guest (i.e. no user)
  if ( !req.user ) {

    // Register user by adding
    User.add( req.body, Utils.safeFn( function ( err ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( {} );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be anonymous to process request.' } );
  }

}

function apiLogout( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Remove session
    Session.remove( { _id: req.apikey }, Utils.safeFn( function ( err ) {
      if ( err ) {
        res.json( { err: err } );
      } else {

        // Remove cookie
        res.clearCookie( Config.web.cookie.name ).json( {} );

      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function apiTweetAdd( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure some properties
    req.body.user = req.user._id;

    // Add tweet
    Tweet.add( req.body, Utils.safeFn( function ( err, tweet ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( tweet );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function apiTweetRemove( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure some properties
    req.params.user = req.user._id;

    // Add tweet
    Tweet.remove( req.params, Utils.safeFn( function ( err, tweet ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( tweet );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function apiTweetRetweet( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure some properties
    req.params.user = req.user._id;

    // Retweet tweet
    Tweet.retweet( req.params, Utils.safeFn( function ( err, tweet ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( tweet );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function apiUserFollow( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure some properties
    req.params.follower = req.user._id;

    // Add tweet
    Follower.add( req.params, Utils.safeFn( function ( err, follower ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( follower );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function apiUserUnfollow( req, res ) {

  // Ensure user
  if ( req.user ) {

    // Ensure some properties
    req.params.follower = req.user._id;

    // Add tweet
    Follower.remove( req.params, Utils.safeFn( function ( err, follower ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        res.json( follower );
      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: User must be authenticated to process request.' } );
  }

}

function otherwise( req, res ) {
  console.error( 'Received bad request: ' + req.originalUrl );
  res.redirect( '/' );
}
