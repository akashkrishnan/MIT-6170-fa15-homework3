'use strict';

var Config = require( '../config.js' );
var Utils = require( './utils.js' );
var mongojs = require( 'mongojs' );
var crypto = require( 'crypto' );

var db = mongojs( Config.services.db.mongodb.uri, [ 'users' ] );

module.exports = {

  //---------------EXTERNAL---------------//

  exists: exists,
  get: get,
  add: add,


  //---------------INTERNAL---------------//

  validateCredentials: validateCredentials,
  sign: sign,
  active: active

};

/**
 * @callback existsCallback
 * @param {Error} err - Error object
 * @param {boolean} user - true if user exists; false otherwise
 */

/**
 * Checks to see if a User object exists by _id or username.
 *
 * @param {object} data
 * @param {*} [data._id] - User._id
 * @param {string} [data.username] - User.username
 * @param {existsCallback} done - callback
 */
function exists( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      username: { type: 'string' }
    } );

    // Handle different input combinations
    if ( criteria._id ) {
      delete criteria.username;
    } else if ( criteria.username ) {
      delete criteria._id;
    } else {
      return done( new Error( 'Invalid parameters.' ), null );
    }

    db[ 'users' ].findOne( criteria, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {
        done( null, !!user );
      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback getCallback
 * @param {Error} err - Error object
 * @param {object} user - User object
 */

/**
 * Gets a User object.
 *
 * @param {object} data
 * @param {*} [data._id] - User._id
 * @param {string} [data.username] - User.username
 * @param {string} [data.password] - User.password
 * @param {getCallback} done - callback
 */
function get( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId' },
      username: { type: 'string' },
      password: { type: 'string' }
    } );

    /**
     * Called after user is found in database and password has been validated if applicable.
     *
     * @param {object} criteria
     */
    var next = function ( criteria ) {

      db[ 'users' ].findOne( criteria, function ( err, user ) {
        if ( err ) {
          done( err, null );
        } else if ( user ) {

          // Do not leak the salt or password
          delete user.salt;
          delete user.password;

          // Stringify the MongoId
          user._id = user._id.toString();

          done( null, user );

        } else {
          done( new Error( 'User not found: ' + JSON.stringify( criteria ) ), null );
        }
      } );

    };

    // Handle different input combinations
    if ( criteria._id ) {

      // Delete unused criteria
      delete criteria.username;
      delete criteria.password;

      // We don't have any passwords to check; let's continue getting the user
      next( criteria );

    } else if ( criteria.username || criteria.password ) {

      // Delete unused criteria
      delete criteria._id;

      if ( criteria.password ) {

        // We're dealing with a password; we first need to retrieve the salt and password for the username
        db[ 'users' ].findOne(
          {
            username: criteria.username
          },
          {
            _id: true,
            salt: true,
            password: true
          },
          function ( err, user ) {
            if ( err ) {
              done( err, null );
            } else if ( user ) {

              // User exists; let's generate the salted hash
              var sha256 = crypto.createHash( 'sha256' );
              sha256.update( user.salt + criteria.password );
              var saltedHash = sha256.digest( 'hex' );

              // Check if passwords match
              if ( saltedHash === user.password ) {

                // Passwords match; let's continue getting the user
                delete criteria.password;
                next( criteria );

              } else {
                done(
                  'Invalid password provided for user: ' + JSON.stringify( { username: criteria.username } ),
                  null
                );
              }

            } else {
              done( new Error( 'User not found: [' + JSON.stringify( { username: criteria.username } ) ), null );
            }
          }
        );

      } else {

        // We're only dealing with an email; delete the unused password criteria and continue getting the user
        delete criteria.password;
        next( criteria );

      }

    } else {
      done( new Error( 'Invalid parameters.' ), null );
    }

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback addCallback
 * @param {Error} err - Error object
 * @param {object} user - newly created User object
 */

/**
 * Adds a user.
 *
 * @param {object} data
 * @param {string} data.username - User.username
 * @param {string} data.password - User.password
 * @param {addCallback} done - callback
 */
function add( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      username: {
        type: 'string',
        filter: function ( username ) {
          if ( username ) {
            return username.trim();
          }
        },
        required: true
      },
      password: {
        type: 'string',
        filter: function ( password ) {
          if ( password ) {
            return password.trim();
          }
        },
        required: true
      }
    } );

    // Make sure username and password are well-defined
    validateCredentials( criteria.username, criteria.password, function ( err ) {
      if ( err ) {
        done( err, null );
      } else {

        // Ensure username is unique
        exists( { username: criteria.username }, function ( err, _exists ) {
          if ( err ) {
            done( err, null );
          } else if ( _exists ) {
            done(
              new Error( 'User already exists: ' + JSON.stringify( { username: criteria.username } ) + '.' ),
              null
            );
          } else {
            try {

              // Generate cryptographically strong pseudo-random salt
              var salt = crypto.randomBytes( 256 / 8 ).toString( 'hex' );

              // Generate salted hash
              var sha256 = crypto.createHash( 'sha256' );
              sha256.update( salt + criteria.password );
              var saltedPasswordHash = sha256.digest( 'hex' );

              // Insert new user data into database
              db[ 'users' ].insert(
                {
                  username: criteria.username,
                  salt: salt,
                  password: saltedPasswordHash,
                  timestamps: {
                    created: new Date(),
                    last_signed: null,
                    signed: null,
                    active: null
                  }
                },
                function ( err, user ) {

                  // Get the new user object the proper way
                  get( { _id: user._id }, done );

                }
              );

            } catch ( err ) {
              done( 'Unable to securely add user. Please try again.', null );
            }
          }
        } );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback validateCredentialsCallback
 * @param {Error} err - Error object
 */

/**
 * Checks to make sure username and password are well-defined and conform to the restrictions defined in the config
 * file.
 *
 * @param {string} username - User.username
 * @param {string} password - User.password
 * @param {validateCredentialsCallback} done - callback
 */
function validateCredentials( username, password, done ) {
  try {

    var usernameMinLength = Config.registration.username.length.min;
    var usernameMaxLength = Config.registration.username.length.max;
    var validUsername = new RegExp( Config.registration.username.regex.valid ).test( username );

    var passwordMinLength = Config.registration.password.length.min;
    var passwordMaxLength = Config.registration.password.length.max;
    var hasNumeral = new RegExp( Config.registration.password.regex.hasNumeral ).test( password );
    var hasUpper = new RegExp( Config.registration.password.regex.hasUpper ).test( password );
    var hasLower = new RegExp( Config.registration.password.regex.hasLower ).test( password );

    if ( username.length < usernameMinLength ) {
      done( new Error( 'Username must contain at least ' + usernameMinLength + ' characters.' ) );
    } else if ( username.length > usernameMaxLength ) {
      done( new Error( 'Username must contain at most ' + usernameMaxLength + ' characters.' ) );
    } else if ( !validUsername ) {
      done( new Error( 'Username contains invalid characters. Please use alphanumeric characters and underscores.' ) );
    } else if ( username === password ) {
      done( new Error( 'Password and email must be different.' ) );
    } else if ( password.length < passwordMinLength ) {
      done( new Error( 'Password must contain at least ' + passwordMinLength + ' characters.' ) );
    } else if ( password.length > passwordMaxLength ) {
      done( new Error( 'Password must contain at most ' + passwordMaxLength + ' characters.' ) );
    } else if ( !hasNumeral ) {
      done( new Error( 'Password must contain at least one (1) Arabic numeral (0-9).' ) );
    } else if ( !hasUpper ) {
      done( new Error( 'Password must contain at least one (1) uppercase English alphabet character (A-Z).' ) );
    } else if ( !hasLower ) {
      done( new Error( 'Password must contain at least one (1) lowercase English alphabet character (a-z).' ) );
    } else {
      done( null );
    }

  } catch ( err ) {
    done( err );
  }
}

/**
 * @callback signCallback
 * @param {Error} err - Error object
 * @param {object} user - User object after sign
 */

/**
 * Signs a user by updating the timestamps.last_sign, timestamps.sign, timestamps.active properties accordingly.
 *
 * @param {object} data
 * @param {signCallback} done - callback
 */
function sign( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true }
    } );

    // Ensure user exists; get timestamps.signed from User Object
    get( criteria, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {

        // Sign user
        db[ 'users' ].update(
          criteria,
          {
            $set: {
              'timestamps.last_signed': user.timestamps.signed
            },
            $currentDate: {
              'timestamps.signed': true,
              'timestamps.active': true
            }
          },
          {},
          function ( err ) {
            if ( err ) {
              done( err, null );
            } else {
              get( user, done );
            }
          }
        );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}

/**
 * @callback activeCallback
 * @param {Error} err - Error object
 * @param {object} user - User object after sign
 */

/**
 * Updates user's timestamps.active date.
 *
 * @param {object} data
 * @param {activeCallback} done - callback
 */
function active( data, done ) {
  try {

    var criteria = Utils.validateObject( data, {
      _id: { filter: 'MongoId', required: true }
    } );

    // Ensure user exists
    get( criteria, function ( err, user ) {
      if ( err ) {
        done( err, null );
      } else {

        // Update active date
        db[ 'users' ].update(
          criteria,
          {
            $currentDate: {
              'timestamps.active': true
            }
          },
          {},
          function ( err ) {
            if ( err ) {
              done( err, null );
            } else {
              get( user, done );
            }
          }
        );

      }
    } );

  } catch ( err ) {
    done( err, null );
  }
}
