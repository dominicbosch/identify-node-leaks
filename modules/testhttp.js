var http = require( 'http' ),
	util = require( 'util' ),
	hyperquest = require( 'hyperquest' ),
	url = 'http://www.20min.ch/schweiz/';
var options = {
	url: url,
	pool: false
};

request( options, function( err, resReq, html ) {
	var ur = util.inspect(resReq);
	console.log(Object.keys(resReq));
	// console.log(ur);
	// var options = {
	// 	hostname: 'www.20min.ch',
	// 	port: 80,
	// 	path: '/schweiz'
	// };
	// http.get( options, function( resHttp ) {
	// 	var body = '',
	// 		uh = util.inspect(resHttp);
	// 	resHttp.on( 'data', function( d ) { body += d });
	// 	resHttp.on( 'end', function() {
	// 		console.log(body);
	// 		console.log( body === html );
	// 	});
	// 	// console.log(Object.keys(resHttp));
	// 	// console.log(uh);
	// 	// console.log(ur === uh);
	// });
});
        var r = hyperquest(url);
        r.pipe(process.stdout, { end: false });
        r.on('end', function () {
            console.log('BYE');
        });