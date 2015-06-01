// Generated by CoffeeScript 1.9.2
(function() {
  var checkIfNewArticle, checkIfNewComments, cheerio, commentOptionTimeMS, get20MinCommentsV3, getDataTalkbackID, getLastCommentsAndDelete, keen, oUrls, partialcommenturl, request, requestArticleUrlForComments, rooturl, talkbackpath, urlArr,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  keen = require('keen-js');

  request = require('request');

  cheerio = require('cheerio');

  oUrls = {};

  talkbackpath = '#talkback';

  partialcommenturl = 'http://www.20min.ch/community/storydiscussion/messageoverview.tmpl?storyid=';

  rooturl = 'http://www.20min.ch';

  commentOptionTimeMS = 172800000;

  urlArr = ['http://www.20min.ch/schweiz', 'http://www.20min.ch/ausland', 'http://www.20min.ch/finance', 'http://www.20min.ch/sport', 'http://www.20min.ch/people', 'http://www.20min.ch/entertainment', 'http://www.20min.ch/digital', 'http://www.20min.ch/wissen', 'http://www.20min.ch/leben'];

  requestArticleUrlForComments = function(art, com, treepath) {
    var urlToRequest;
    urlToRequest = treepath === 'li' ? com.url : art;
    return request(urlToRequest, function(error, response, html) {
      var tree;
      if (error) {
        return console.log("ERROR REQUESTING: " + urlToRequest + " (" + new Date() + ")");
      } else {
        tree = cheerio.load(html);
        return tree(treepath).each(function(i, elem) {
          var currDate, currLI, dt, id, listItem, ref, timezoneOffsetInHours;
          currLI = {};
          listItem = tree(this);
          if (ref = listItem.attr('id'), indexOf.call(com.commentIDs, ref) < 0) {
            dt = listItem.find('.time').first().text().slice(3);
            timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
            currDate = Date.UTC(dt.substring(6, 10), dt.substring(3, 5) - 1, dt.substring(0, 2), parseInt(dt.substring(11, 13)) + timezoneOffsetInHours, dt.substring(14));
            currLI['timestamp'] = new Date();
            currLI['articleurl'] = art;
            currLI['commenturl'] = com.url;
            currLI['id'] = listItem.attr('id');
            currLI['commentTime'] = new Date(currDate);
            currLI['author'] = listItem.find('.author').first().text();
            currLI['title'] = listItem.find('.title').first().text();
            currLI['content'] = listItem.find('.content').first().text();
            currLI['parentEntry'] = ((function() {
              var j, len, ref1, results;
              ref1 = com.commentIDs;
              results = [];
              for (j = 0, len = ref1.length; j < len; j++) {
                id = ref1[j];
                if (id.split('_')[0] === listItem.attr('id').split('_')[0]) {
                  results.push(id);
                }
              }
              return results;
            })())[0];
            if (currLI['parentEntry'] === void 0) {
              currLI['parentEntry'] = '';
            }
            com.commentIDs.push(listItem.attr('id'));
          }
          return currLI = {
            'val': 0
          };
        });
      }
    });
  };

  getLastCommentsAndDelete = function(art, com, url) {
    requestArticleUrlForComments(art, com, '.comments > li');
    return delete oUrls[url].articlelist[art];
  };

  checkIfNewComments = function(url4) {
    var art, com, currentDateInMS, ref, results, timecheck;
    currentDateInMS = new Date().getTime();
    ref = oUrls[url4].articlelist;
    results = [];
    for (art in ref) {
      com = ref[art];
      timecheck = com.timeOfPublication.getTime() + commentOptionTimeMS;
      if (timecheck <= currentDateInMS) {
        results.push(getLastCommentsAndDelete(art, com, url4));
      } else {
        results.push(requestArticleUrlForComments(art, com, 'li'));
      }
    }
    return results;
  };

  getDataTalkbackID = function(articlehref, checkComments, url3) {
    if (articlehref !== '-1') {
      return request(articlehref, function(error, response, html) {
        var commenturl, datatalkbackid, tree;
        if (error) {
          return console.log("ERROR REQUESTING: " + articlehref(+" (" + new Date() + ")"));
        } else {
          tree = cheerio.load(html);
          datatalkbackid = tree(talkbackpath).attr('data-talkbackid');
          commenturl = partialcommenturl + datatalkbackid;
          if (datatalkbackid) {
            oUrls[url3].articlelist[articlehref] = {};
            oUrls[url3].articlelist[articlehref].url = commenturl;
            oUrls[url3].articlelist[articlehref].timeOfPublication = new Date();
            oUrls[url3].articlelist[articlehref].commentIDs = [];
          }
          return checkComments(url3);
        }
      });
    } else {
      return checkComments(url3);
    }
  };

  checkIfNewArticle = function(getTalkbackID, url2) {
    return request(url2, function(error, response, html) {
      var articlehref, hrefelement, tree;
      if (error) {
        return console.log("ERROR REQUESTING: " + url2 + " (" + new Date() + ")");
      } else {
        tree = cheerio.load(html);
        hrefelement = tree('#content').find('.clusterLeft').first().find('a').first().attr('href');
        if (hrefelement !== oUrls[url2].oldhrefelement) {
          articlehref = rooturl + hrefelement;
          oUrls[url2].oldhrefelement = hrefelement;
          return getTalkbackID(articlehref, checkIfNewComments, url2);
        } else {
          return getTalkbackID('-1', checkIfNewComments, url2);
        }
      }
    });
  };

  get20MinCommentsV3 = function(url) {
    if (!oUrls[url]) {
      oUrls[url] = {};
      oUrls[url].articlelist = {};
      oUrls[url].oldhrefelement = '';
    }
    return checkIfNewArticle(getDataTalkbackID, url);
  };

  exports.test = function() {
    var j, len, results, url;
    results = [];
    for (j = 0, len = urlArr.length; j < len; j++) {
      url = urlArr[j];
      results.push(get20MinCommentsV3(url));
    }
    return results;
  };

}).call(this);
