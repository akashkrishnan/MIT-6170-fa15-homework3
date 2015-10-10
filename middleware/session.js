'use strict';

var Config = require( '../config.js' );
var Logger = require( '../models/logger.js' );
var Utils = require( '../models/utils.js' );
var Session = require( '../models/session.js' );
var User = require( '../models/user.js' );

module.exports = function () {
  return function ( req, res, next ) {

    // We required that the cookie-parser middleware is registered before this middleware
    if ( req.cookies ) {

      // Store apikey for convenience
      req.apikey = req.cookies.apikey;

      if ( req.apikey ) {

        // Ensure valid session
        Session.get( { _id: req.apikey }, Utils.safeFn( function ( err, session ) {
          if ( err ) {
            next();
          } else {

            /**
             * Valid session; ensure valid user by seeing if we can update the active state.
             *
             * NOTE: a valid session doesn't guarantee the user is available
             */
            User.active( { _id: session.value }, Utils.safeFn( function ( err, user ) {
              if ( err ) {
                next();
              } else {

                /**
                 * Store the User._id for future user; this will serve as a valid authority.
                 *
                 * NOTE: We do not want to store the actual object because the data is subject to change and do not
                 * want to tempt developers to take shortcuts. It's best to query the User model for the latest data.
                 */
                req.user = user._id;

                next();

              }
            } ) );

          }
        } ) );

      } else {
        next();
      }

    }

  };
};
