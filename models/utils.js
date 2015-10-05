'use strict';

module.exports = {
  noop: noop,
  safeFn: safeFn
};

/**
 * A function that does nothing.
 */
function noop() {
}

/**
 * Returns a function that can be executed if not originally defined. If the first argument is defined and of type
 * error, then its stack property will be printed and it will be replaced with its message property.
 *
 * @param {function|null|undefined} [fn]
 * @returns {function}
 */
function safeFn( fn ) {
  return function () {
    if ( arguments[ 0 ] ) {
      if ( arguments[ 0 ] instanceof Error ) {
        //require( './logger.js' ).error( arguments[ 0 ] );
        arguments[ 0 ] = arguments[ 0 ].message;
      } else {
        //require( './logger.js' ).error( new Error( arguments[ 0 ] ) );
      }
    }
    (fn || noop).apply( null, arguments );
  };
}
