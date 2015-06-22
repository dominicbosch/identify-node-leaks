
var app, fs = require('fs'),
	express = require('express');

console.log('Libraries loaded, Starting server');

app = express();
app.use(express.static('webpage'));
app.post('/data/:chunksize/:category/:metric', function(req, res) {
	var oDat, prms = req.params;
	try {
		oDat = JSON.parse(fs.readFileSync('chunked/'
			+'chunk'+prms.chunksize
			+'_category'+prms.category
			+'_metric'+prms.metric, 'utf8'));
		res.send(oDat);
	} catch(e) {
		res.status(500).send('Error processing your request!');
		console.log(e);
	}
});

app.listen( 9876, function() {
	console.log('server listening on port ' + 8642);
});
