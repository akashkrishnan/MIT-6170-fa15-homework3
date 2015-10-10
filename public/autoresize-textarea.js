'use strict';

var AutoresizeTextarea = function ( textarea ) {

  var that = Object.create( AutoresizeTextarea.prototype );

  var submitListeners = [];

  var resize = function () {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight - 32) + 'px';
  };

  var asyncResize = function () {
    setTimeout( resize, 0 );
  };

  var submit = function () {

    var text = textarea.value;

    submitListeners.forEach( function ( cb ) {
      cb( text );
    } );

  };

  that.addSubmitListener = function ( cb ) {
    submitListeners.push( cb );
  };

  that.resize = function () {
    textarea.focus();
    textarea.select();
    asyncResize();
  };

  that.clear = function () {
    textarea.value = '';
  };

  textarea.addEventListener( 'change', resize, false );
  textarea.addEventListener( 'cut', asyncResize, false );
  textarea.addEventListener( 'paste', asyncResize, false );
  textarea.addEventListener( 'drop', asyncResize, false );
  textarea.addEventListener( 'keydown', asyncResize, false );

  // Add tweet on enter/return
  textarea.addEventListener( 'keydown', function ( e ) {

    // Using shift key allows user to add a new line
    if ( !e.shiftKey && e.keyCode === 13 ) {
      e.preventDefault();
      setTimeout( submit, 0 );
    }

  }, false );

  Object.freeze( that );

  return that;

};
