(function () {

  var config;

  // Add keyup listener for enter/return inside of the form
  document.querySelector( '[form]' ).addEventListener( 'keyup', function ( e ) {

    // Check if Enter/Return
    if ( e.keyCode === 13 ) {

      // Validate the registration form
      validate();

    }

  }, false );

  document.querySelector( '[button][register]' ).addEventListener( 'click', function () {

    // Validate the registration form
    validate();

  }, false );

  /**
   * Retrieves config data from server. Config data includes information on username and passwords constraints.
   *
   * @param {function()} done - callback function
   */
  var loadConfig = function ( done ) {

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {

      config = xhr.response;

      if ( config ) {
        done();
      } else {
        console.error( 'Unable to retrieve configuration file. Invalid server response.' );
        alert( 'Unable to retrieve configuration file. Invalid server response.' );
      }

    };

    xhr.open( 'GET', '/config.json', true );
    xhr.responseType = 'json';
    xhr.send();

  };

  var validate = function () {

    // Retrieve config if it hasn't already been loaded
    if ( !config ) {
      loadConfig( validate );
    } else {

      var name = document.querySelector( '#name' ).value;
      var username = document.querySelector( '#username' ).value;
      var password = document.querySelector( '#password' ).value;
      var password_verify = document.querySelector( '#password_verify' ).value;

      var nameMinLength = config.registration.name.length.min;
      var nameMaxLength = config.registration.name.length.max;

      var usernameMinLength = config.registration.username.length.min;
      var usernameMaxLength = config.registration.username.length.max;
      var validUsername = new RegExp( config.registration.username.regex.valid ).test( username );

      var passwordMinLength = config.registration.password.length.min;
      var passwordMaxLength = config.registration.password.length.max;
      var hasNumeral = new RegExp( config.registration.password.regex.hasNumeral ).test( password );
      var hasUpper = new RegExp( config.registration.password.regex.hasUpper ).test( password );
      var hasLower = new RegExp( config.registration.password.regex.hasLower ).test( password );

      if ( name.length < nameMinLength ) {
        alert( 'Full Name must contain at least ' + nameMinLength + ' characters.' );
      } else if ( name.length > nameMaxLength ) {
        alert( 'Full Name must contain at most ' + nameMaxLength + ' characters.' );
      } else if ( username.length < usernameMinLength ) {
        alert( 'Username must contain at least ' + usernameMinLength + ' characters.' );
      } else if ( username.length > usernameMaxLength ) {
        alert( 'Username must contain at most ' + usernameMaxLength + ' characters.' );
      } else if ( !validUsername ) {
        alert( 'Username contains invalid characters. Please use alphanumeric characters and underscores.' );
      } else if ( password !== password_verify ) {
        alert( 'Passwords do not match.' );
      } else if ( username === password ) {
        alert( 'Username and password must be different.' );
      } else if ( password.length < passwordMinLength ) {
        alert( 'Password must contain at least ' + passwordMinLength + ' characters.' );
      } else if ( password.length > passwordMaxLength ) {
        alert( 'Password must contain at most ' + passwordMaxLength + ' characters.' );
      } else if ( !hasNumeral ) {
        alert( 'Password must contain at least one (1) Arabic numeral (0-9).' );
      } else if ( !hasUpper ) {
        alert( 'Password must contain at least one (1) uppercase English alphabet character (A-Z).' );
      } else if ( !hasLower ) {
        alert( 'Password must contain at least one (1) lowercase English alphabet character (a-z).' );
      } else {
        register( name, username, password );
      }

    }

  };

  /**
   * Sends XHR to register user; if successful, user is automatically logged in and redirected to the homepage.
   *
   * @param {string} name
   * @param {string} username
   * @param {string} password
   */
  var register = function ( name, username, password ) {

    var data = {
      name: name,
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
        console.error( 'Unable to register account. Invalid server response.' );
        alert( 'Unable to register account. Invalid server response.' );
      }

    };

    xhr.open( 'POST', '/api/register', true );
    xhr.setRequestHeader( 'Content-Type', 'application/json;charset=UTF-8' );
    xhr.responseType = 'json';
    xhr.send( JSON.stringify( data ) );

  };

})();
