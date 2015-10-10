'use strict';

var Config = require( '../config.js' );
var Utils = require( '../models/utils.js' );
var Session = require( '../models/session.js' );
var User = require( '../models/user.js' );

module.exports = function ( app, sockets ) {

  app.get( '/', index );
  app.get( '/config.json', config );
  app.get( '/register', register );
  app.get( '/logout', logout );
  app.post( '/api/login', apiLogin );
  app.post( '/api/register', apiRegister );
  app.post( '/api/logout', apiLogout );

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
    res.render( 'home', {
      web: Config.web,
      user: req.user
    } );
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

function apiLogin( req, res ) {

  // Ensure guest (i.e. no user)
  if ( !req.user ) {

    // Check if user exists with username and password
    User.get( req.body, Utils.safeFn( function ( err, user ) {
      if ( err ) {
        res.json( { err: err } );
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
    User.add( req.body, Utils.safeFn( function ( err, user ) {
      if ( err ) {
        res.json( { err: err } );
      } else {

        // TODO: we need to sign in the user
        res.json( {} );

      }
    } ) );

  } else {
    res.status( 400 ).json( { err: 'Bad Request: Unable to registered account because user is already logged in.' } );
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
    res.status( 400 ).json( { err: 'Bad Request: User must be logged in to logout.' } );
  }

}

function otherwise( req, res ) {
  console.error( 'Received bad request: ' + req.originalUrl );
  res.redirect( '/' );
}
