
var app, server, evt, i, j,
	fs = require( 'fs' ),
	express = require( 'express' ),
	socketio = require( 'socket.io' );

console.log( 'Libraries loaded, Starting server' );

app = express();
app.use( express.static( 'webpage' ) );
server = app.listen( 8642, function() {
	console.log( 'server listening on port ' + 8642 );
});
io = socketio.listen( server );
io.on( 'connection', function (socket) {
	console.log( 'socketio has new connection...' );
	io.emit( 'init' );
	fs.readdir( 'logs/', function( err, files ) {
		if( !err ) {
			files.forEach(function( file ) {
				try {
					var o, arr, arrFile = [],
						strFile = fs.readFileSync( 'logs/' + file, 'utf8' );
					arr = strFile.split( '\n' );
					for( var i = 0; i < arr.length - 1; i++ ) {
						o = JSON.parse( arr[ i ] );
						o.file = file.substring( 0, file.length - 4 );
						arrFile.push( o );
					}
					io.emit( 'memusage', arrFile );
				} catch( e ) {
					console.log( e );
				}
			});
		}
		io.emit( 'endinit' );
	});
});
