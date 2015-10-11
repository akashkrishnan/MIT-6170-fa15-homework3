'use strict';

var User = require( '../models/user.js' );
var Tweet = require( '../models/tweet.js' );
var assert = require( 'assert' );

describe( 'User', function () {

  describe( '#add', function () {

    it( 'adding correctly should throw no error', function () {
      User.add(
        {
          name: 'tester',
          username: 'tester',
          password: 'asdfASDF1234!@#$'
        },
        function ( err, user ) {
          assert( !err );
        }
      );
    } );

    it( 'adding with duplicate name should throw error', function () {
      User.add(
        {
          name: 'tester',
          username: 'tester',
          password: 'asdfASDF1234!@#$'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

    it( 'adding with same username and password should throw error', function () {
      User.add(
        {
          name: 'tester',
          username: 'tester',
          password: 'tester'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

    it( 'invalid password', function () {
      User.add(
        {
          name: 'tester',
          username: 'tester',
          password: 'asdf'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

  } );

  describe( '#get', function () {

    it( 'getting user by username that does not exist', function () {
      User.add(
        {
          username: 'tester2'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

    it( 'getting user by id that does not exist', function () {
      User.add(
        {
          _id: 'tester2'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

    it( 'getting user by username that does exist', function () {
      User.add(
        {
          username: 'tester'
        },
        function ( err, user ) {
          assert( !err );
        }
      );
    } );

    it( 'getting user by username and invalid password that does exist', function () {
      User.add(
        {
          username: 'tester',
          password: 'tester'
        },
        function ( err, user ) {
          assert( !!err );
        }
      );
    } );

    it( 'getting user by username and password that does exist', function () {
      User.add(
        {
          username: 'tester',
          password: 'asdfASDF1234!@#$'
        },
        function ( err, user ) {
          assert( !err );
        }
      );
    } );

  } );

} );

describe( 'Tweet', function () {

  describe( '#add', function () {

    it( 'adding multiple tweets', function () {

      Tweet.add( { text: 'test' }, function ( err, tweet ) {
        assert( !err );
        assert( tweet.text === 'test' );
      } );

      Tweet.add( { text: 'test' }, function ( err, tweet ) {
        assert( !err );
        assert( tweet.text === 'test' );
      } );

      Tweet.add( { text: 'test' }, function ( err, tweet ) {
        assert( !err );
        assert( tweet.text === 'test' );
      } );

    } );

  } );

  describe( '#add', function () {

    it( 'adding and getting tweet', function () {

      Tweet.add( { text: 'test' }, function ( err, tweet ) {
        Tweet.get( { _id: tweet._id }, function ( err, tweet ) {
          assert( !err );
          assert( tweet.text === 'test' );
        } );
      } );

    } );

  } );

  describe( '#list', function () {

    it( 'checking list length of tweets', function () {

      Tweet.list( {}, function ( err, tweets, count ) {
        assert( count === 4 );
      } );

    } );

  } );

} );
