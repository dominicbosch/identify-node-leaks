'use strict';

var cheerio = require( 'cheerio' ),
	memwatch = require( 'memwatch-next' ),
	// keen = require( 'keen-js' ), 
	http = require( 'http' ), 
	oSectionUrls = {},
	interval = 2 * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
	urlDiscussion = 'http://www.20min.ch/community/storydiscussion/messageoverview.tmpl?storyid=', 
	rootUrl = 'http://www.20min.ch', 
	arrSectionUrls = [
		'http://www.20min.ch/schweiz/'
		//,
		// 'http://www.20min.ch/ausland/',
		// 'http://www.20min.ch/finance/',
		// 'http://www.20min.ch/sport/',
		// 'http://www.20min.ch/people/',
		// 'http://www.20min.ch/entertainment/',
		// 'http://www.20min.ch/digital/',
		// 'http://www.20min.ch/wissen/',
		// 'http://www.20min.ch/leben/'
	];

memwatch.on('leak', function(leak) {
	leak.timestamp = (new Date()).getTime();
	console.log('MEMWATCH LEAK: ', JSON.stringify(leak));
});

function request( url, cb ) {
	http.get( url, function( res ) {
		var chunks = [];
		res.on('data', function(chunk) { chunks.push(chunk) });
		res.on('end', function() { cb(null, null, chunks.join('')) });
	}).on('error', cb);
}

function unleakString( s ) { return (' '+s).substr(1) }

function requestArticleUrlForComments( urlArticle, oArticle, treepath ) {
	request( ( treepath === 'li' ? oArticle.url : urlArticle ), function( err, resp, html ) {
		if ( !err ) {
			cheerio.load( html )( treepath ).each(function( i, elem ) {
				var j, len, parId, currLI, currDate, dt, id, idFirstPart, listItem;
				listItem = cheerio( this );
				id = unleakString(listItem.attr('id'));
				if ( oArticle.commentIDs.indexOf( id ) < 0 ) {
					dt = listItem.find( '.time' ).first().text().slice( 3 );
					currDate = Date.UTC(
						unleakString(dt.substring( 6, 10 )),
						unleakString(dt.substring( 3, 5 )) - 1,
						unleakStringdt.substring( 0, 2 )),
						parseInt(unleakString(dt.substring( 11, 13 ))) + (new Date().getTimezoneOffset() / 60),
						unleakString(dt.substring( 14 ))
					);
					currLI = {
						timestamp: new Date(),
						articleurl: urlArticle,
						commenturl: oArticle.url,
						id: id,
						commentTime: new Date( currDate ),
						author: unleakString(listItem.find( '.author' ).first().text()),
						title: unleakString(listItem.find( '.title' ).first().text()),
						content: unleakString(listItem.find( '.content' ).first().text()),
						parentEntry: ''
					};
					idFirstPart = id.split('_')[0];
					j = 0;
					len = oArticle.commentIDs.length;
					while( j < len && currLI.parentEntry === '' ) {
						parId = oArticle.commentIDs[j++];
						if (parId.split( '_' )[0] === idFirstPart) {
							currLI.parentEntry = parId;
						}
					}
					console.log(JSON.stringify(currLI));
					oArticle.commentIDs.push( id );
				}
			});
		}
	});
};

function checkIfNewComments( sectionUrl ) {
	var art, currentDateInMS, oArticles, timecheck;
	currentDateInMS = new Date().getTime();
	oArticles = oSectionUrls[ sectionUrl ].articlelist;
	for( art in oArticles ) {
		timecheck = oArticles[ art ].timeOfPublication.getTime() + interval;
		if( timecheck <= currentDateInMS ) {
			requestArticleUrlForComments( art, oArticles[ art ], '.comments > li' );
			delete oSectionUrls[ sectionUrl ].articlelist[ art ];
		} else {
			requestArticleUrlForComments( art, oArticles[ art ], 'li' );
		}
	}
}

function get20MinCommentsV3( sectionUrl ) {
	if(!oSectionUrls[sectionUrl]) {
		oSectionUrls[sectionUrl] = {
			articlelist: {},
			oldArticlePath: ''
		};
		console.log('oSectionUrls increase: ' + JSON.stringify(oSectionUrls).length);
	}
	request(sectionUrl, function(err, resp, html) {
		var newArticleUrl, newPath;
		if(!err) {
			newPath = cheerio.load(html)('#content')
				.find('.clusterLeft').first().find('a').first().attr('href');

			// No new article, just check for new comments
			if(newPath === oSectionUrls[sectionUrl].oldArticlePath ) {
				checkIfNewComments( sectionUrl );

			// There is a new article! Let's fetch it and then check for comments
			} else {
				oSectionUrls[sectionUrl].oldArticlePath = newPath;
				newArticleUrl = rootUrl + newPath;

// Memleak avoidance:
// (' ' + string).replace(/^\s/, '')
// (' ' + string).substr(1) is shorter, easier to read, and faster. (And if you make a typo and write .substring(), it'll work just as well.)

// getTalkbackID(rootUrl + newPath, sectionUrl);
// function getTalkbackID( articlehref, url ) {
// }

				request( newArticleUrl, function( err, resp, html ) {
					var commenturl, datatalkbackid, oEvent;
					if( !err ) {
						datatalkbackid = cheerio.load( html )( '#talkback' ).attr( 'data-talkbackid' );
						commenturl = urlDiscussion + datatalkbackid;
						oEvent = {
							timestamp: new Date(),
							articleurl: newArticleUrl
						};
						if ( datatalkbackid ) {  
							oSectionUrls[ sectionUrl ].articlelist[ newArticleUrl ] = {
								url: commenturl,
								timeOfPublication: new Date(),
								commentIDs: []
							};
							oEvent.commenturl = commenturl;
							oEvent.status = "START";
						} else {
							oEvent.commenturl = '';
							oEvent.status = "KEINE";
						}
						console.log(JSON.stringify(oEvent));
						checkIfNewComments(sectionUrl);
					}
				});

			}
		}
	});
}

exports.test = function() {
	for( var j = 0; j < arrSectionUrls.length; j++ ) {
		get20MinCommentsV3( arrSectionUrls[j] );
	}
};

// 26529941