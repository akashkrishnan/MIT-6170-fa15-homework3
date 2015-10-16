(function () {

  var fritter = Fritter();

  var textarea = document.querySelector( 'textarea[tweet-input]' );
  if ( textarea ) {

    var tweeter = AutoresizeTextarea( textarea );

    tweeter.addSubmitListener( function ( text ) {
      fritter.tweet.add( { text: text }, function ( err, tweet ) {
        if ( err ) {
          console.error( err );
          alert( err );
        } else {
          tweeter.clear();
          addTweet( tweet );
        }
      } );
    } );

  }

  var feed = document.querySelector( '[feed]' );
  if ( feed ) {
    feed.addEventListener( 'click', function ( e ) {

      if ( e.target.hasAttribute( 'remove-tweet' ) ) {
        e.preventDefault();
        fritter.tweet.remove(
          { _id: e.target.parentElement.parentElement.id },
          function ( err, tweet ) {
            if ( err ) {
              console.error( err );
              alert( err );
            } else {
              removeTweet( tweet );
            }
          }
        );
      } else if ( e.target.hasAttribute( 'retweet-tweet' ) ) {
        e.preventDefault();
        fritter.tweet.retweet(
          { _id: e.target.parentElement.parentElement.id },
          function ( err, tweet ) {
            if ( err ) {
              console.error( err );
              alert( err );
            } else {
              addTweet( tweet );
            }
          }
        );
      }

    } );
  }

  var addTweet = function ( tweet ) {

    var html = '';

    html += '<div id="' + tweet._id + '" tweet layout-vertical>';
    html += '<div header layout-horizontal>';
    html += '<span author-name><strong>' + tweet.user.name + '</strong></span>';
    html += '<a author-handle href="/' + tweet.user.username + '">@' + tweet.user.username + '</a>';
    html += '<span time>' + tweet.timestamps.created + '</span>';
    html += '<span flex></span>';
    html += '<span remove-tweet>X</span>';
    html += '</div>';
    html += '<div text>' + tweet.text + '</div>';
    html += '</div>';

    var feed = document.querySelector( '[feed] [list]' );
    if ( feed ) {
      feed.insertAdjacentHTML( 'afterbegin', html );
    }

  };

  var removeTweet = function ( tweet ) {
    var e = document.getElementById( tweet._id );
    if ( e ) {
      e.parentElement.removeChild( e );
    }
  }

})();
