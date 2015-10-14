(function () {

  var fritter = Fritter();

  var textarea = AutoresizeTextarea( document.querySelector( 'textarea[tweet-input]' ) );
  textarea.addSubmitListener( function ( text ) {
    fritter.tweet.add( { text: text }, function ( err, tweet ) {
      if ( err ) {
        console.error( err );
        alert( err );
      } else {
        textarea.clear();
        addTweet( tweet );
      }
    } );
  } );

  document.querySelector( '[feed]' ).addEventListener( 'click', function ( e ) {
    if ( e.target.hasAttribute( 'remove-tweet' ) ) {
      e.preventDefault();
      fritter.tweet.remove(
        {
          _id: e.target.parentElement.parentElement.id
        },
        function ( err, tweet ) {
          if ( err ) {
            console.error( err );
            alert( err );
          } else {
            removeTweet( tweet );
          }
        }
      );
    }
  } );

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

    document.querySelector( '[feed]' ).insertAdjacentHTML( 'afterbegin', html );

  };

  var removeTweet = function ( tweet ) {
    var e = document.getElementById( tweet._id );
    if ( e ) {
      e.parentElement.removeChild( e );
    }
  }

})();
