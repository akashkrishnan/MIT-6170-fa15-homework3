'use strict';

var Fritter = function () {

  var that = Object.create( Fritter.prototype );

  that.tweet = {

    add: function ( data, done ) {
      if ( data && data.text ) {
        if ( data.text.length > 140 ) {
          done( new Error( 'Tweet too long. Please shorten your tweet to 140 characters.' ) ); // TODO: USE CONFIG
        } else {

          var xhr = new XMLHttpRequest();

          xhr.onload = function () {

            var data = xhr.response;

            if ( data ) {

              if ( data.err ) {
                done( data.err, null );
              } else {
                done( null, data );
              }

            } else {
              console.error( 'Unable to add tweet. Invalid server response.' );
              alert( 'Unable to add tweet. Invalid server response.' );
            }

          };

          xhr.open( 'POST', '/api/tweet', true );
          xhr.setRequestHeader( 'Content-Type', 'application/json;charset=UTF-8' );
          xhr.responseType = 'json';
          xhr.send( JSON.stringify( data ) );

        }
      } else {
        done( new Error( 'Invalid argument text.' ) );
      }
    },

    remove: function ( data, done ) {
      if ( data && data._id ) {
        done( 'Not Implemented.' );
      } else {
        done( new Error( 'Invalid argument _id.' ) );
      }
    }

  };

  Object.freeze( that );

  return that;

};
