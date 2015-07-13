
# 20 Min Comments
keen = require 'keen-js'
request = require 'request'
cheerio = require 'cheerio'

oUrls = {}
talkbackpath = '#talkback'
partialcommenturl = 'http://www.20min.ch/community/storydiscussion/messageoverview.tmpl?storyid='
rooturl = 'http://www.20min.ch'
commentOptionTimeMS = 172800000 #2 days

urlArr = [
	'http://www.20min.ch/schweiz'
	'http://www.20min.ch/ausland'
	'http://www.20min.ch/finance'
	'http://www.20min.ch/sport'
	'http://www.20min.ch/people'
	'http://www.20min.ch/entertainment'
	'http://www.20min.ch/digital'
	'http://www.20min.ch/wissen'
	'http://www.20min.ch/leben'
]

lastRequest = ''

requestArticleUrlForComments = (art, com, treepath) ->
	urlToRequest = if treepath is 'li' then com.url else art
	lastRequest = urlToRequest
	request urlToRequest, (error, response, html) ->
		if error
			console.error 'ERROR REQUESTING: ' + urlToRequest + ' (' + new Date() + ')'
			console.error error
		else
			tree = cheerio.load html

			## For each new comment, check if new and read relevant data
			tree(treepath).each (i, elem) ->
				currLI = {}

				listItem = tree(this)
				## new comment
				if listItem.attr('id') not in com.commentIDs
					dt = listItem.find('.time').first().text().slice(3)
					timezoneOffsetInHours = new Date().getTimezoneOffset() / 60
					currDate = Date.UTC(dt.substring(6,10),dt.substring(3,5)-1,dt.substring(0,2), parseInt(dt.substring(11,13))+timezoneOffsetInHours, dt.substring(14)) #+timezoneOffsetInHours

					currLI['timestamp'] = new Date()
					currLI['articleurl'] = art
					currLI['commenturl'] = com.url
					currLI['id'] = listItem.attr('id')
					currLI['commentTime'] = new Date currDate
					currLI['author'] = listItem.find('.author').first().text()
					currLI['title']=listItem.find('.title').first().text()
					currLI['content']=listItem.find('.content').first().text()
					currLI['parentEntry'] = (id for id in com.commentIDs when id.split('_')[0] is listItem.attr('id').split('_')[0])[0]
					currLI['parentEntry'] = '' if currLI['parentEntry'] is undefined

					console.log JSON.stringify currLI
					com.commentIDs.push listItem.attr('id')
				currLI = listItem = dt = i = elem = null
			treepath = null
		art = com = error = response = html = tree = null
	urlToRequest = null #option not yet implemented in running code
				

getLastCommentsAndDelete = (art, com, url) ->
	requestArticleUrlForComments art, com, '.comments > li'
	delete oUrls[url].articlelist[art]
	art = com = url = null

checkIfNewComments = (url4)->
	currentDateInMS = new Date().getTime()
	for art, com of oUrls[url4].articlelist
		timecheck = com.timeOfPublication.getTime() + commentOptionTimeMS
		if timecheck <= currentDateInMS
			getLastCommentsAndDelete art, com, url4
		else
			requestArticleUrlForComments art, com, 'li'
	currentDateInMS = timecheck = url4 = null

getDataTalkbackID = (articlehref,checkComments, url3) ->
	if articlehref!='-1'
		lastRequest = articlehref
		request articlehref, (error, response, html) ->#to get data-talkback-id
			if error
				console.error 'ERROR REQUESTING: ' + articlehref + ' (' + new Date() + ')'
				console.error error
			else
				tree = cheerio.load html
				datatalkbackid = tree( talkbackpath ).attr('data-talkbackid')
				commenturl = partialcommenturl + datatalkbackid
				if datatalkbackid
					oUrls[url3].articlelist[articlehref] = {}
					oUrls[url3].articlelist[articlehref].url = commenturl
					oUrls[url3].articlelist[articlehref].timeOfPublication = new Date()
					oUrls[url3].articlelist[articlehref].commentIDs = []
					console.log JSON.stringify {'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': commenturl, 'status': "START"}
				else
					console.log JSON.stringify {'timestamp': new Date(), 'articleurl': articlehref, 'commenturl': "", 'status':"KEINE"}
				checkComments url3
			commenturl = datatalkbackid = tree = response = html = error = url3 = checkComments = articlehref = null
	else
		checkComments url3
		url3 = checkComments = articlehref = null

checkIfNewArticle = (getTalkbackID, url2)->
	lastRequest = url2
	request url2, ( error, response, html ) ->
		if error
			console.error 'ERROR REQUESTING: ' + url2 + ' (' + new Date() + ')'
			console.error error
		else
			tree = cheerio.load html
			# get href from current article
			hrefelement = tree('#content').find('.clusterLeft').first().find('a').first().attr('href')
			if hrefelement != oUrls[url2].oldhrefelement
				articlehref = rooturl + hrefelement
				oUrls[url2].oldhrefelement = hrefelement
				getTalkbackID articlehref, checkIfNewComments, url2
			else
				getTalkbackID '-1', checkIfNewComments, url2
		articlehref = hrefelement = tree = error = response = html = url2 = getTalkbackID = null

get20MinCommentsV3 = (url) ->
	if !oUrls[url]
		oUrls[url] = {}
		oUrls[url].articlelist = {}
		oUrls[url].oldhrefelement = ''

	## EXECUTE ##
	checkIfNewArticle getDataTalkbackID, url

exports.test = () ->
	get20MinCommentsV3 url for url in urlArr

exports.getMemDump = () ->
	JSON.stringify
		oUrls: oUrls
		urlArr: urlArr
		lastRequest: lastRequest