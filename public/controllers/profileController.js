'use strict';

(function () {

  var fritter = Fritter();

  // Get id of user
  var id;
  var profile = document.querySelector( '[user-profile]' );
  if ( profile ) {
    id = profile.id;
  }

  var followButton = document.querySelector( '[button][follow]' );
  if ( followButton ) {

    // Follow button click listener
    followButton.addEventListener( 'click', function () {

      // Toggle follow state
      if ( followButton.hasAttribute( 'active' ) ) {

        // Unfollow
        fritter.user.unfollow( { 'followee': id }, function ( err ) {
          if ( err ) {
            console.error( err );
            alert( err );
          } else {
            followButton.innerHTML = 'Follow';
            followButton.removeAttribute( 'active' );
          }
        } );

      } else {

        // Follow
        fritter.user.follow( { 'followee': id }, function ( err ) {
          if ( err ) {
            console.error( err );
            alert( err );
          } else {
            followButton.innerHTML = 'Following';
            followButton.setAttribute( 'active', '' );
          }
        } );

      }

    }, false );

  }

})();
