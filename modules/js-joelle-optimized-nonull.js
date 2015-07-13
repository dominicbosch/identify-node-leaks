'use strict';

var cheerio = require( 'cheerio' ), 
	request = require( 'request' ), 
	keen = require( 'keen-js' ), 
	oUrls = {},
	interval = 2 * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
	partialcommenturl = 'http://www.20min.ch/community/storydiscussion/messageoverview.tmpl?storyid=', 
	talkbackpath = '#talkback', 
	rooturl = 'http://www.20min.ch', 
	urlArr = [
		'http://www.20min.ch/schweiz',
		'http://www.20min.ch/ausland',
		'http://www.20min.ch/finance',
		'http://www.20min.ch/sport',
		'http://www.20min.ch/people',
		'http://www.20min.ch/entertainment',
		'http://www.20min.ch/digital',
		'http://www.20min.ch/wissen',
		'http://www.20min.ch/leben'
	];

function requestArticleUrlForComments( art, com, treepath ) {
	var urlToRequest = ( treepath === 'li' ? com.url : art );
	request( urlToRequest, function( err, resp, html ) {
		var tree;
		if ( !err ) {
			tree = cheerio.load( html );
			tree( treepath ).each(function( i, elem ) {
				var j, len, parId, currDate, dt, id, idFirstPart, listItem,
					currLI = {};
				listItem = tree( this );
				id = listItem.attr( 'id' );
				if ( com.commentIDs.indexOf( id ) < 0 ) {
					dt = listItem.find( '.time' ).first().text().slice( 3 );
					currDate = Date.UTC(
						dt.substring( 6, 10 ),
						dt.substring( 3, 5 ) - 1,
						dt.substring( 0, 2 ),
						parseInt( dt.substring( 11, 13 ) ) + (new Date().getTimezoneOffset() / 60),
						dt.substring( 14 )
					);
					currLI[ 'timestamp' ] = new Date();
					currLI[ 'articleurl' ] = art;
					currLI[ 'commenturl' ] = com.url;
					currLI[ 'id' ] = id;
					currLI[ 'commentTime' ] = new Date( currDate );
					currLI[ 'author' ] = listItem.find( '.author' ).first().text();
					currLI[ 'title' ] = listItem.find( '.title' ).first().text();
					currLI[ 'content' ] = listItem.find( '.content' ).first().text();
					currLI[ 'parentEntry' ] = '';
					idFirstPart = id.split( '_' )[0];
					j = 0;
					len = com.commentIDs.length;
					while( j < len && currLI['parentEntry'] === '' ) {
						parId = com.commentIDs[j++];
						if (parId.split( '_' )[0] === idFirstPart) {
							currLI[ 'parentEntry' ] = parId;
						}
					}
					console.log(JSON.stringify(currLI));
					com.commentIDs.push( id );
				}
			});
		}
	});
};

function checkIfNewComments( url4 ) {
	var art, com, currentDateInMS, oArticles, timecheck;
	currentDateInMS = new Date().getTime();
	oArticles = oUrls[ url4 ].articlelist;
	for( art in oArticles ) {
		com = oArticles[ art ];
		timecheck = com.timeOfPublication.getTime() + interval;
		if( timecheck <= currentDateInMS ) {
			requestArticleUrlForComments( art, com, '.comments > li' );
			delete oUrls[ url4 ].articlelist[ art ];
		} else {
			requestArticleUrlForComments( art, com, 'li' );
		}
	}
}

function getTalkbackID( articlehref, url3 ) {
	if( articlehref !== '-1' ) {
		request( articlehref, function( err, resp, html ) {
			var commenturl, datatalkbackid, tree;
			if( !err ) {
				tree = cheerio.load( html );
				datatalkbackid = tree( talkbackpath ).attr( 'data-talkbackid' );
				commenturl = partialcommenturl + datatalkbackid;
				if ( datatalkbackid ) {
					oUrls[ url3 ].articlelist[ articlehref ] = {};
					oUrls[ url3 ].articlelist[ articlehref ].url = commenturl;
					oUrls[ url3 ].articlelist[ articlehref ].timeOfPublication = new Date();
					oUrls[ url3 ].articlelist[ articlehref ].commentIDs = [];
					console.log( JSON.stringify(
						{'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': commenturl, 'status': "START"}
					));
				} else {
					console.log( JSON.stringify(
						{'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': '', 'status': "KEINE"}
					));
				}
				checkIfNewComments( url3 );
			}
		});
	} else {
		checkIfNewComments( url3 );
	}
}

function get20MinCommentsV3( url ) {
	if( !oUrls[ url ] ) {
		oUrls[ url ] = {};
		oUrls[ url ].articlelist = {};
		oUrls[ url ].oldhrefelement = '';
	}
	request( url, function(err, resp, html ) {
		var hrefelement, tree;
		if( !err ) {
		//  console.log( 'ERROR REQUESTING: ' + url + ' (' + new Date() + ')');
		// else {
			tree = cheerio.load( html );
			hrefelement = tree( '#content' )
				.find( '.clusterLeft' ).first()
				.find( 'a' ).first()
					.attr( 'href' );
			if( hrefelement !== oUrls[ url ].oldhrefelement ) {
				oUrls[ url ].oldhrefelement = hrefelement;
				getTalkbackID( rooturl + hrefelement, url );
			} else {
				getTalkbackID( '-1', url );
			}
		}
	});
}

exports.test = function() {
	var j, len;
	for( j = 0, len = urlArr.length; j < len; j++ ) {
		get20MinCommentsV3( urlArr[j] );
	}
};


exports.getMemDump = function() {
	return JSON.stringify({
		oUrls: oUrls,
		urlArr: urlArr
	});
};