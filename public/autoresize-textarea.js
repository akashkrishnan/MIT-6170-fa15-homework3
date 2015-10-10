'use strict';

var AutoresizeTextarea = function ( textarea ) {

  var that = Object.create( AutoresizeTextarea.prototype );

  var resize = function () {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight - 32) + 'px';
  };

  var asyncResize = function () {
    setTimeout( resize, 0 );
  };

  that.resize = function () {
    textarea.focus();
    textarea.select();
    asyncResize();
  };

  textarea.addEventListener( 'change', resize, false );
  textarea.addEventListener( 'cut', asyncResize, false );
  textarea.addEventListener( 'paste', asyncResize, false );
  textarea.addEventListener( 'drop', asyncResize, false );
  textarea.addEventListener( 'keydown', asyncResize, false );

  Object.freeze( that );

  return that;

};
