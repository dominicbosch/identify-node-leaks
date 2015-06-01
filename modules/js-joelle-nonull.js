
var cheerio = require( 'cheerio' ), 
	request = require( 'request' ), 
	keen = require( 'keen-js' ), 
	oUrls = {},
	interval = 48 * 60 * 60 * 1000,
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
		if ( err ) {
			console.log( 'ERROR REQUESTING: ' + urlToRequest + ' (' + new Date() + ')' );
		} else {
			tree = cheerio.load( html );
			tree( treepath ).each(function( i, elem ) {
				var id, listItem;
				// var currDate, currLI, dt, id, listItem, ref, timezoneOffsetInHours;
				// currLI = {};
				listItem = tree( this );
				id = listItem.attr( 'id' );
				if ( com.commentIDs.indexOf( id ) < 0 ) {
					// dt = listItem.find( '.time' ).first().text().slice( 3 );
					// timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
					// currDate = Date.UTC(
					// 	dt.substring( 6, 10 ),
					// 	dt.substring( 3, 5 ) - 1,
					// 	dt.substring( 0, 2 ),
					// 	parseInt( dt.substring( 11, 13 ) ) + timezoneOffsetInHours,
					// 	dt.substring( 14 )
					// );
					// currLI[ 'timestamp' ] = new Date();
					// currLI[ 'articleurl' ] = art;
					// currLI[ 'commenturl' ] = com.url;
					// currLI[ 'id' ] = id;
					// currLI[ 'commentTime' ] = new Date( currDate );
					// currLI[ 'author' ] = listItem.find( '.author' ).first().text();
					// currLI[ 'title' ] = listItem.find( '.title' ).first().text();
					// currLI[ 'content' ] = listItem.find( '.content' ).first().text();
					// currLI[ 'parentEntry' ] = ((function() {
					// 	var j, len, ref1, results, parId;
					// 	ref1 = com.commentIDs;
					// 	results = [];
					// 	for (j = 0, len = ref1.length; j < len; j++) {
					// 		parId = ref1[j];
					// 		if (parId.split( '_' )[0] === id.split( '_' )[0]) {
					// 			results.push( parId );
					// 		}
					// 	}
					// 	return results;
					// })())[0];
					// if (currLI['parentEntry'] === void 0) {
					// 	currLI['parentEntry'] = '';
					// }
					com.commentIDs.push( id );
				}
				// return currLI = {
				// 	'val': 0
				// };
			});
		}
	});
};

function getLastCommentsAndDelete( art, com, url ) {
	requestArticleUrlForComments( art, com, '.comments > li' );
	return delete oUrls[ url ].articlelist[ art ];
}

function checkIfNewComments( url4 ) {
	var art, com, currentDateInMS, oArticles, timecheck;
	currentDateInMS = new Date().getTime();
	oArticles = oUrls[ url4 ].articlelist;
	for( art in oArticles ) {
		com = oArticles[ art ];
		timecheck = com.timeOfPublication.getTime() + interval;
		if( timecheck <= currentDateInMS ) {
			getLastCommentsAndDelete( art, com, url4 );
		} else {
			requestArticleUrlForComments( art, com, 'li' );
		}
	}
}

function getTalkbackID( articlehref, url3 ) {
	if( articlehref !== '-1' ) {
		request( articlehref, function( err, resp, html ) {
			var commenturl, datatalkbackid, tree;
			if( err ) console.log( 'ERROR REQUESTING: ' + articlehref + ' (' + new Date() + ')' );
			else {
				tree = cheerio.load( html );
				datatalkbackid = tree( talkbackpath ).attr( 'data-talkbackid' );
				commenturl = partialcommenturl + datatalkbackid;
				if ( datatalkbackid ) {
					oUrls[ url3 ].articlelist[ articlehref ] = {};
					oUrls[ url3 ].articlelist[ articlehref ].url = commenturl;
					oUrls[ url3 ].articlelist[ articlehref ].timeOfPublication = new Date();
					oUrls[ url3 ].articlelist[ articlehref ].commentIDs = [];
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
		if( err ) console.log( 'ERROR REQUESTING: ' + url + ' (' + new Date() + ')');
		else {
			tree = cheerio.load( html );
			hrefelement = tree( '#content' )
				.find( '.clusterLeft' ).first()
				.find( 'a' ).first()
					.attr( 'href' );
			if( hrefelement !== oUrls[ url ].oldhrefelement ) {
				oUrls[ url ].oldhrefelement = hrefelement;
				getTalkbackID( rooturl + hrefelement, checkIfNewComments, url );
			} else {
				getTalkbackID( '-1', checkIfNewComments, url );
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
