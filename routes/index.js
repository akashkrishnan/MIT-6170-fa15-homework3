'use strict';

var Config = require( '../config.js' );
var Utils = require( '../models/utils.js' );
var User = require( '../models/user.js' );
var multiparty = require( 'multiparty' );

module.exports = function ( app, sockets ) {

  app.get( '/', index );
  app.get( '/config.json', config );
  app.get( '/register', register );
  app.post( '/api/register', registerAccount );

  //require( './public.js' )( app, sockets );
  //require( './guest.js' )( app, sockets );
  //require( './user.js' )( app, sockets );

  app.get( '*', otherwise );

};

function config( req, res ) {
  res.json( {
    registration: Config.registration
  } );
}

function index( req, res ) {
  res.render( 'index', {
    web: Config.web
  } );
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

function registerAccount( req, res ) {

  // Ensure guest (i.e. no user)
  if ( !req.user ) {
    new multiparty.Form().parse( req, Utils.safeFn( function ( err, fields ) {
      if ( err ) {
        res.json( { err: err } );
      } else {
        User.add(
          {
            username: fields.username[ 0 ],
            password: fields.password[ 0 ]
          },
          Utils.safeFn( function ( err ) {

            // TODO: we need to sign in the user

            res.json( { err: err } );

          } )
        );
      }
    } ) );
  } else {
    res.status( 400 ).json( { err: 'Invalid request. Authenticated users may not register accounts.' } );
  }

}

function otherwise( req, res ) {
  console.error( 'Received unknown request: ' + req.originalUrl );
  res.redirect( '/' );
}
