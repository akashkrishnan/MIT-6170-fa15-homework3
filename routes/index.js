'use strict';

var Config = require( '../config.js' );
var Utils = require( '../models/utils.js' );
var Session = require( '../models/session.js' );
var User = require( '../models/user.js' );
var Tweet = require( '../models/tweet.js' );

module.exports = function ( app, sockets ) {

  app.get( '/', index );
  app.get( '/config.json', config );
  app.get( '/register', register );
  app.get( '/logout', logout );
  app.get( '/mentions', mentions );
  app.get( '/followers', followers );
  app.get( '/:username', userProfile );
  app.post( '/api/login', apiLogin );
  app.post( '/api/register', apiRegister );
  app.post( '/api/logout', apiLogout );
  app.post( '/api/tweet', apiTweetAdd );
  app.delete( '/api/tweet/:_id', apiTweetRemove );

  //require( './public.js' )( app, sockets );
  //require( './guest.js' )( app, sockets );
  //require( './user.js' )( app, sockets );

  app.get( '*', otherwise );

};

function config( req, res ) {
  res.json( Utils.validateObject( Config, {
    registration: { required: true }
  } ) );
}

function index( req, res ) {
  if ( req.user ) {

    // Get tweets
    Tweet.list(
      {
        'user._id': req.user._id,
        limit: 20
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'home', {
            web: Config.web,
            user: req.user,
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

  // Ensure user
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

  if ( req.user ) {

    // Get tweets
    Tweet.list(
      {
        'user._id': req.user._id,
        limit: 20
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'mentions', {
            web: Config.web,
            user: req.user,
            tweets: tweets
          } );
        }
      } )
    );

  } else {
    next();
  }

}

function followers( req, res, next ) {

  if ( req.user ) {

    // Get tweets
    Tweet.list(
      {
        'user._id': req.user._id,
        limit: 20
      },
      Utils.safeFn( function ( err, tweets ) {
        if ( err ) {
          res.json( { err: err } );
        } else {
          res.render( 'followers', {
            web: Config.web,
            user: req.user,
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
          'user._id': user._id,
          limit: 20
        },
        Utils.safeFn( function ( err, tweets ) {
          if ( err ) {
            res.json( { err: err } );
          } else {
            res.render( 'user', {
              web: Config.web,
              user: req.user,
              name: user.name,
              username: user.username,
              tweets: tweets
            } );
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
    req.body[ 'user._id' ] = req.user._id;

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
    req.params[ 'user._id' ] = req.user._id;

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

function otherwise( req, res ) {
  console.error( 'Received bad request: ' + req.originalUrl );
  res.redirect( '/' );
}
