'use strict';

(function () {

  document.querySelector( '[home]' ).addEventListener( 'click', function ( e ) {
    window.location.replace( '/' );
  } );

  document.querySelector( '#search' ).addEventListener( 'keydown', function ( e ) {
    if ( e.keyCode === 13 ) {
      window.location.replace( '/' + e.target.value );
    }
  } );

  document.querySelector( '[logout]' ).addEventListener( 'click', function ( e ) {
    window.location.replace( '/logout' );
  } );

})();
