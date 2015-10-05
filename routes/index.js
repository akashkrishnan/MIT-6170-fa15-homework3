'use strict';

var Config = require( '../config.js' );

module.exports = function ( app, sockets ) {

  app.get( '/', index );
  app.get( '/config.json', config );
  app.get( '/register', register );

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

function register( req, res ) {
  res.render( 'register', {
    web: Config.web
  } );
}

function otherwise( req, res ) {
  console.error( 'Received unknown request: ' + req.originalUrl );
  res.redirect( '/' );
}
