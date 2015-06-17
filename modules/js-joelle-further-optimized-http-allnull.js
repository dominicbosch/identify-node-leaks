'use strict';

var cheerio = require( 'cheerio' ),
	memwatch = require( 'memwatch-next' ),
	// keen = require( 'keen-js' ), 
	http = require( 'http' ), 
	oSectionUrls = {},
	interval = 2 * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
	urlDiscussion = 'http://www.20min.ch/community/storydiscussion/messageoverview.tmpl?storyid=', 
	rooturl = 'http://www.20min.ch', 
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
	console.log( 'MEMWATCH LEAK' );
	console.log( leak );
});
// memwatch.on('stats', function(stats) {
// 	console.log( 'MEMWATCH STATS' );
// 	console.log( stats );
// });
function request( url, cb ) {
	http.get( url, function( res ) {
		var body = '';
		res.on( 'data', function( d ) {
			body += d;
			d = null;
		});
		res.on( 'end', function() {
			cb( null, null, body );
			cb = body = null;
		});
	}).on( 'error', cb );
	url = null;
}

function requestArticleUrlForComments( urlArticle, oArticle, treepath ) {
	console.log( 'requestArticleUrlForComments -> urlArticle: ', typeof urlArticle );
	console.log( 'requestArticleUrlForComments -> urlArticle: ', urlArticle );
	console.log( 'requestArticleUrlForComments -> oArticle: ', typeof oArticle );
	console.log( 'requestArticleUrlForComments -> oArticle.url: ', oArticle.url );
	console.log( 'requestArticleUrlForComments -> treepath: ', typeof treepath );
	
	request( ( treepath === 'li' ? oArticle.url : urlArticle ), function( err, resp, html ) {
		if ( !err ) {
			cheerio.load( html )( treepath ).each(function( i, elem ) {
				var j, len, parId, currLI, currDate, dt, id, idFirstPart, listItem;
				console.log( Object.keys(this) );
				listItem = cheerio( this );
				console.log( Object.keys(listItem) );
				id = listItem.attr( 'id' );
				console.log( 'requestArticleUrlForComments -> id: ', typeof id );
				if ( oArticle.commentIDs.indexOf( id ) < 0 ) {
					dt = listItem.find( '.time' ).first().text().slice( 3 );
					console.log( 'requestArticleUrlForComments -> dt: ', typeof dt );
					currDate = Date.UTC(
						dt.substring( 6, 10 ),
						dt.substring( 3, 5 ) - 1,
						dt.substring( 0, 2 ),
						parseInt( dt.substring( 11, 13 ) ) + (new Date().getTimezoneOffset() / 60),
						dt.substring( 14 )
					);
					console.log( 'requestArticleUrlForComments -> currDate: ', typeof currDate );
					currLI = {
						timestamp: new Date(),
						articleurl: urlArticle,
						commenturl: oArticle.url,
						id: id,
						commentTime: new Date( currDate ),
						author: listItem.find( '.author' ).first().text(),
						title: listItem.find( '.title' ).first().text(),
						content: listItem.find( '.content' ).first().text(),
						parentEntry: ''
					};
					console.log( 'requestArticleUrlForComments -> currLI.timestamp: ', typeof currLI.timestamp );
					console.log( 'requestArticleUrlForComments -> currLI.commenturl: ', typeof currLI.commenturl );
					console.log( 'requestArticleUrlForComments -> currLI.author: ', typeof currLI.author );
					console.log( 'requestArticleUrlForComments -> currLI.title: ', typeof currLI.title );
					console.log( 'requestArticleUrlForComments -> currLI.content: ', typeof currLI.content );
					idFirstPart = id.split( '_' )[0];
					j = 0;
					len = oArticle.commentIDs.length;
					console.log(oArticle.commentIDs);
					while( j < len && currLI.parentEntry === '' ) {
						parId = oArticle.commentIDs[j++];
						if (parId.split( '_' )[0] === idFirstPart) {
							currLI.parentEntry = parId;
						}
					}
					console.log(JSON.stringify(currLI));
					oArticle.commentIDs.push( id );
				}
				j = len = parId = currLI = currDate = dt = id = idFirstPart = listItem = null;
			});
		}
		err = resp = urlArticle = oArticle = treepath = null;
	});
};

function checkIfNewComments( urlSection ) {
	console.log( 'checkIfNewComments -> urlSection: ', typeof urlSection )
	var art, currentDateInMS, oArticles, timecheck;
	currentDateInMS = new Date().getTime();
	console.log( 'checkIfNewComments -> currentDateInMS: ', typeof currentDateInMS )
	oArticles = oSectionUrls[ urlSection ].articlelist;
	for( art in oArticles ) {
		console.log( 'art: ', art );
		console.log( 'checkIfNewComments -> currentDateInMS: ', typeof currentDateInMS )
		timecheck = oArticles[ art ].timeOfPublication.getTime() + interval;
		if( timecheck <= currentDateInMS ) {
			requestArticleUrlForComments( art, oArticles[ art ], '.comments > li' );
			delete oSectionUrls[ urlSection ].articlelist[ art ];
		} else {
			requestArticleUrlForComments( art, oArticles[ art ], 'li' );
		}
	}
	urlSection = art = currentDateInMS = oArticles = timecheck = null;
}

function getTalkbackID( articlehref, url ) {
	console.log( 'getTalkbackID -> articlehref: ', typeof articlehref )
	console.log( 'getTalkbackID -> url: ', typeof url )
	request( articlehref, function( err, resp, html ) {
		var commenturl, datatalkbackid;
		if( !err ) {
			datatalkbackid = cheerio.load( html )( '#talkback' ).attr( 'data-talkbackid' );
			console.log( 'getTalkbackID -> datatalkbackid: ', typeof datatalkbackid )
			commenturl = urlDiscussion + datatalkbackid;
			console.log( 'getTalkbackID -> commenturl: ', typeof commenturl )
			if ( datatalkbackid ) {  
				oSectionUrls[ url ].articlelist[ articlehref ] = {
					url: commenturl,
					timeOfPublication: new Date(),
					commentIDs: []
				};
				console.log( JSON.stringify( oSectionUrls[ url ].articlelist[ articlehref ] ));
				console.log( JSON.stringify(
					{'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': commenturl, 'status': "START"}
				));
			} else {
				console.log( JSON.stringify(
					{'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': '', 'status': "KEINE"}
				));
			}
			checkIfNewComments( url );
			commenturl = datatalkbackid = articlehref = url = null;
		}
	});
}

function get20MinCommentsV3( urlSection ) {
	console.log( 'get20MinCommentsV3 -> urlSection: ', typeof urlSection )
	if( !oSectionUrls[ urlSection ] ) {
		oSectionUrls[ urlSection ] = {
			articlelist: {},
			oldhrefelement: ''
		};
	}
	request( urlSection, function( err, resp, html ) {
		var hrefelement;
		if( !err ) {
			hrefelement = cheerio.load( html )( '#content' )
				.find( '.clusterLeft' ).first()
				.find( 'a' ).first()
					.attr( 'href' );
			console.log( 'get20MinCommentsV3 -> hrefelement: ', typeof hrefelement )
			if( hrefelement !== oSectionUrls[ urlSection ].oldhrefelement ) {
				oSectionUrls[ urlSection ].oldhrefelement = hrefelement;
				getTalkbackID( rooturl + hrefelement, urlSection );
			} else {
				checkIfNewComments( urlSection );
			}
		}
		hrefelement = err = resp = html = urlSection = null;
	});
}

exports.test = function() {
	for( var j = 0; j < arrSectionUrls.length; j++ ) {
		get20MinCommentsV3( arrSectionUrls[j] );
	}
};
