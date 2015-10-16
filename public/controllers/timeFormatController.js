'use strict';

(function () {

  var update = function () {

    var spans = document.querySelectorAll( 'span[time]' );

    for ( var i = 0; i < spans.length; i++ ) {
      var d = new Date( spans[ i ].getAttribute( 'time' ) );
      var m = moment( d );
      spans[ i ].innerHTML = m.fromNow();
    }

  };

  update();

  setInterval( update, 5000 );

})();
