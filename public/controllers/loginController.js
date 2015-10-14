(function () {

  // Add keyup listener for enter/return inside of the form
  document.querySelector( '[form]' ).addEventListener( 'keyup', function ( e ) {

    // Check if Enter/Return
    if ( e.keyCode === 13 ) {

      // Validate the registration form
      validate();

    }

  }, false );

  document.querySelector( '[button][login]' ).addEventListener( 'click', function () {

    // Validate the registration form
    validate();

  }, false );

  var validate = function () {

    var username = document.querySelector( '#username' ).value;
    var password = document.querySelector( '#password' ).value;

    // Ensure username and password are set before querying the server
    if ( username && password ) {
      login( username, password );
    }

  };

  var login = function ( username, password ) {

    var data = {
      username: username,
      password: password
    };

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {

      var data = xhr.response;

      if ( data ) {

        if ( data.err ) {
          console.error( data.err );
          alert( data.err );
        } else {

          // Account has been registered; refresh the page to show new content
          window.location.replace( '/' );

        }

      } else {
        console.error( 'Unable to authenticate account. Invalid server response.' );
        alert( 'Unable to authenticate account. Invalid server response.' );
      }

    };

    xhr.open( 'POST', '/api/login', true );
    xhr.setRequestHeader( 'Content-Type', 'application/json;charset=UTF-8' );
    xhr.responseType = 'json';
    xhr.send( JSON.stringify( data ) );

  };

})();
