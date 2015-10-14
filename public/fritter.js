'use strict';

var Fritter = function () {

  var that = Object.create( Fritter.prototype );

  var ajax = function ( method, url, data, done ) {

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
      done( xhr.response );
    };

    xhr.open( method, url, true );
    xhr.setRequestHeader( 'Content-Type', 'application/json;charset=UTF-8' );
    xhr.responseType = 'json';
    xhr.send( JSON.stringify( data ) );

  };

  that.tweet = {

    add: function ( data, done ) {
      if ( data && data.text ) {
        if ( data.text.length > 140 ) {
          done( new Error( 'Tweet too long. Please shorten your tweet to 140 characters.' ) ); // TODO: USE CONFIG
        } else {
          ajax( 'POST', '/api/tweet', data, function ( data ) {
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
          } );
        }
      }
    },

    remove: function ( data, done ) {
      if ( data && data._id ) {
        ajax( 'DELETE', '/api/tweet/' + data._id, data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            console.error( 'Unable to remove tweet. Invalid server response.' );
            alert( 'Unable to remove tweet. Invalid server response.' );
          }
        } );
      }
    },

    retweet: function ( data, done ) {
      if ( data && data[ 'tweet._id' ] ) {
        ajax( 'POST', '/api/tweet/' + data[ 'tweet._id' ] + '/retweet', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            console.error( 'Unable to retweet tweet. Invalid server response.' );
            alert( 'Unable to retweet tweet. Invalid server response.' );
          }
        } );
      }
    }

  };

  that.user = {

    follow: function ( data, done ) {
      if ( data && data.followee ) {
        ajax( 'POST', '/api/user/' + data.followee + '/follow', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            console.error( 'Unable to follow user. Invalid server response.' );
            alert( 'Unable to follow user. Invalid server response.' );
          }
        } );
      }
    },

    unfollow: function ( data, done ) {
      if ( data && data.followee ) {
        ajax( 'POST', '/api/user/' + data.followee + '/unfollow', data, function ( data ) {
          if ( data ) {
            if ( data.err ) {
              done( data.err, null );
            } else {
              done( null, data );
            }
          } else {
            console.error( 'Unable to unfollow user. Invalid server response.' );
            alert( 'Unable to unfollow user. Invalid server response.' );
          }
        } );
      }
    }

  };

  Object.freeze( that.tweet );
  Object.freeze( that.user );
  Object.freeze( that );

  return that;

};
