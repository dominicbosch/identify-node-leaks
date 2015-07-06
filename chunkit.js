
var fs = require('fs'),
	oFiles = {};
	arrChunks = [0.25, 0.5, 1, 3, 6, 12, 24],
	oGetMetric = {
		'rss': function(oEvt) { return oEvt.rss },
		'heapTotal': function(oEvt) { return oEvt.heapTotal },
		'heapUsed': function(oEvt) { return oEvt.heapUsed },
		'diffRSSAndTotal': function(oEvt) { return oEvt.rss - oEvt.heapTotal }
	};

console.log('Libraries loaded, Starting to parse');

function insertMetrics( oChunks, oEvt, begin ) {
	var oTmp;
	for (var mtrc in oGetMetric) {
		if(!oChunks[mtrc]) {
			oChunks[mtrc] = {};
		}
		if(!oChunks[mtrc][oEvt.category]) {
			oChunks[mtrc][oEvt.category] = {};
		}
		for(var j = 0; j < arrChunks.length; j++) {
			if(!oChunks[mtrc][oEvt.category][arrChunks[j]]) {
				oChunks[mtrc][oEvt.category][arrChunks[j]] = {};
			}						
			if(!oChunks[mtrc][oEvt.category][arrChunks[j]][oEvt.file]) {
				oChunks[mtrc][oEvt.category][arrChunks[j]][oEvt.file] = {};
			}	
			// if((oEvt.timestamp-begin)<0) console.log(oEvt, begin);
			chunk = parseInt((oEvt.timestamp-begin)/1000/60/60/arrChunks[j]);
			if(!oChunks[mtrc][oEvt.category][arrChunks[j]][oEvt.file][chunk]) {
				oChunks[mtrc][oEvt.category][arrChunks[j]][oEvt.file][chunk] = {
					timestamp: (chunk + arrChunks[j] / 2) * 60 * 60 * 1000 * arrChunks[j],
					sumMem: oGetMetric[mtrc](oEvt),
					numChunks: 1
				};
			} else {
				oTmp = oChunks[mtrc][oEvt.category][arrChunks[j]][oEvt.file][chunk];
				oTmp.sumMem += oGetMetric[mtrc](oEvt);
				oTmp.numChunks++;
				oTmp.averageMem = oTmp.sumMem / oTmp.numChunks;
			}
		}
	}
}

fs.readdir('logs/', function(err, files) {
	if(!err) {
		var arrData, len, oEvt, fileName, oChunks, begin;

		oChunks = {
			rss: {},
			heapUsed: {},
			heapTotal: {},
			diffRSSAndTotal: {}
		};

		files.forEach(function(file) {
			var ts;
			arrData = fs.readFileSync('logs/'+file, 'utf8').split('\n');
			if( arrData.length > 0 ) {
				try {
					ts = JSON.parse(arrData[0]).timestamp;
					if(ts) {
						oFiles[file] = {
							data: arrData,
							begin: ts
						}
					}
				} catch(e) {
					console.log('Can\'t parse first line of '+file);
				}
			}

		});
		console.log('Loaded files: \n --> '+Object.keys(oFiles).join('\n --> '));
		// console.log(oFiles);
		for(var file in oFiles) {
			console.log('Processing file '+file);
			fileName = file.substring(0, file.length-4);
			arrData = oFiles[file].data;
			begin = oFiles[file].begin;
			for(var i = 0; i < arrData.length-1; i++) {
				// try  {
					oEvt = JSON.parse(arrData[i]);
					oEvt.file = fileName;
					insertMetrics(oChunks, oEvt, begin);
				// } catch(e) {
				// 	console.log('error writing: '+file+', line: '+i, e);
				// }
			}
		}
		for(var mtrc in oChunks) {
			for(var cat in oChunks[mtrc]) {
				for(var chnksize in oChunks[mtrc][cat]) {
					fs.writeFileSync('chunked/chunk'+chnksize+'_category'+cat+'_metric'+mtrc, JSON.stringify(oChunks[mtrc][cat][chnksize]));
				}
			}
		}
		console.log('Done chunking!');
	}
});
