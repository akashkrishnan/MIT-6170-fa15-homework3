'use strict';

(function () {

  document.querySelector( '#search' ).addEventListener( 'keydown', function ( e ) {
    if ( e.keyCode === 13 ) {
      window.location.replace( '/' + e.target.value );
    }
  } );

})();
