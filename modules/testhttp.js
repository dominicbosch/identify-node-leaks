var http = require( 'http' ),
	util = require( 'util' ),
	request = require( 'request' ),
	url = 'http://www.20min.ch/schweiz/';

request( url, function( err, resReq, html ) {
	var ur = util.inspect(resReq);
	// console.log(Object.keys(resReq));
	// console.log(ur);
	http.get( url, function( resHttp ) {
		var body = '',
			uh = util.inspect(resHttp);
		resHttp.on( 'data', function( d ) { body += d });
		resHttp.on( 'end', function() {
			console.log(body);
			console.log( body === html );
		});
		// console.log(Object.keys(resHttp));
		// console.log(uh);
		// console.log(ur === uh);
	});
});