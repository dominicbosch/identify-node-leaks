if( process.argv.length < 4 ) {
	return console.log( 'USAGE: nodejs index.js [testModule] [interval]' );
	// return console.log( 'Please provide the module name to test from the modules folder' );
}

console.log( 'All arguments found, loading libraries' );

var app, server, evt,
	i = 1,
	fs = require( 'fs' ),
	// express = require( 'express' ),
	// socketio = require( 'socket.io' ),
	fileName = process.argv[ 2 ],
	modTest = require( __dirname + '/modules/' + fileName ),
	interval = parseInt( process.argv[ 3 ] ) * 1000;

// console.log( 'Libraries loaded, Starting server' );

// app = express();
// app.use( express.static( 'webpage' ) );
// server = app.listen( 8642, function() {
// 	console.log( 'server listening on port ' + 8642 );
// });
// io = socketio.listen( server );
// io.on( 'connection', function (socket) {
// 	console.log( 'socketio has new connection...' );
// 	fs.readFile( 'logs/' + fileName + '.log', 'utf8', function (err, data) {
// 		if( !err ) {
// 			var arr = data.split( '\n' );
// 			io.emit( 'init', { num: arr.length - 1 } );
// 			for( var i = 0; i < arr.length - 1; i++ ) {
// 				io.emit( 'memusage', JSON.parse( arr[ i ] ) );
// 			}
// 			io.emit( 'endinit' );
// 		}
// 		data = null;
// 		arr = null;
// 		err = null;
// 	});
// 	socket.on( 'disconnect', function() {
// 		console.log( 'user disconnected' );
// 	});
// 	socket = null;
// });

// console.log( 'Server started, Starting memoy leaking script' );

console.log( 'Starting memoy leaking script' );
fs.writeFileSync( 'logs/' + fileName + '.log', '' );

function doLoop() {
	console.log( 'Looping: ' + i++ );
	evt = process.memoryUsage();
	evt.category = 'before';
	evt.timestamp = (new Date()).getTime();
	fs.appendFileSync( 'logs/' + fileName + '.log', JSON.stringify( evt ) + '\n' );
	// io.emit( 'memusage', evt );
	
	modTest.test();

	evt = process.memoryUsage();
	evt.category = 'after';
	evt.timestamp = (new Date()).getTime();
	fs.appendFileSync( 'logs/' + fileName + '.log', JSON.stringify( evt ) + '\n' );
	// io.emit( 'memusage', evt );

	setTimeout( doLoop, interval );
}
doLoop();
