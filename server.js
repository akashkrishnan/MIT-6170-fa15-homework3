'use strict';

console.log( '-------------\nInitializing.' );

// Imports
var Config = require( './config.js' );
var Logger = require( './models/logger.js' );
var Session = require( './middleware/session.js' );
var domain = require( 'domain' );
var express = require( 'express' );
var compression = require( 'compression' );
var CookieParser = require( 'cookie-parser' );
var BodyParser = require( 'body-parser' );

// Use domain to catch runtime errors and prevent termination of application

var d = domain.create();

d.on( 'error', function ( err ) {
  Logger.error( err );
} );

d.run( function () {

  // Structure the HTTP & WS servers
  var app = express();
  var server = require( 'http' ).createServer( app );

  // Configure Express
  app.engine( '.ejs', require( 'ejs' ).renderFile );
  app.set( 'trust proxy', true );
  app.set( 'view engine', 'ejs' );
  app.set( 'views', __dirname + '/source/templates' );
  app.use( compression( { level: 9, memLevel: 9 } ) );
  app.use( CookieParser() );
  app.use( BodyParser.json() );
  app.use( express.static( __dirname + '/public' ) );
  app.use( Session( Config.web.cookie.name ) );

  console.log( 'READY: Express' );

  // Set up handlers
  require( './routes' )( app );

  console.log( 'READY: Request Handlers' );

  // Start the server
  server.listen( Config.web.port, function () {
    console.log( 'Listening on port ' + Config.web.port + '.' );
  } );

} );
