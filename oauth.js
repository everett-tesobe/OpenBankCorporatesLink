// npm install express
// npm install express-session
// npm install cookie-parser
// npm install oauth
// npm install jsonfile
// npm install follow-redirects


var openCorp = require('./openCorp');
var fs = require('fs');

var http = require('http');
var express = require('express');
var session = require('express-session')
var cookieParser = require('cookie-parser')
var util = require('util');
var oauth = require('oauth');
var jf = require('jsonfile');

var app = express();

var _openbankConsumerKey = "";
var _openbankConsumerSecret = "";

var consumer = null;



var file = 'credentials.json';

jf.readFile(file, function(err, obj) {

  //hacky callback fun - don't load the page until this executes please!
  _openbankConsumerKey = obj.consumer;
  _openbankConsumerSecret = obj.secret;

  consumer =  new oauth.OAuth(
  'https://apisandbox.openbankproject.com/oauth/initiate',
  'https://apisandbox.openbankproject.com/oauth/token',
  _openbankConsumerKey,
  _openbankConsumerSecret,
  '1.0', 
  'http://127.0.0.1:8080/callback', 
  'HMAC-SHA1');
});
 
app.use(cookieParser());
app.use(session({ secret: "very secret" }));

app.get('/connect', function(req, res){
	consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
			res.send("Error getting OAuth request token : " + util.inspect(error), 500);
		} else {
			req.session.oauthRequestToken = oauthToken;
			req.session.oauthRequestTokenSecret = oauthTokenSecret;
			res.redirect("https://apisandbox.openbankproject.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
		}
	});
});


app.get('/callback', function(req, res){
	consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
		if (error) {
			res.send("Error getting OAuth access token : " + util.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+util.inspect(results)+"]", 500);
		} else {
			req.session.oauthAccessToken = oauthAccessToken;
			req.session.oauthAccessTokenSecret = oauthAccessTokenSecret; 
			res.redirect('/signed_in');
		}
	});
});


app.get('/signed_in', function(req, res){
	res.send('Thank you for logging in! <br><a href="/getAccount">Account transactions</a>')
});

app.get('/getAccount', function(req, res){
	consumer.get("https://apisandbox.openbankproject.com/obp/v1.2.1/banks/rbs/accounts/main/owner/transactions", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
		var parsedData = JSON.parse(data);
		var counterparties = parsedData.transactions.map(function(t) {
			var result = {
			  name: t.other_account.holder.name,
			  url: t.other_account.metadata.open_corporates_URL,
			  jurisdiction: t.other_account.bank.national_identifier,
      };
      return result;
		});
		res.send(counterparties)		
	});
});


var url = require('url');

app.get('/searchBank', function(req, res){
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	openCorp.search_bank(query['query'], function(result){
		res.send(result);
	}, function(error){
		res.send(error);
	});
	
});
	

app.get('/accountList', function(req, res){
	fs.readFile('./webUI/list.html', function (err, html) {
	    if (err) {
	        throw err; 
	    }       
	    res.writeHeader(200, {"Content-Type": "text/html"});  
	    res.write(html);  
	    res.end();  
	});
});

app.get('*', function(req, res){
	res.redirect('/connect');
});
 
app.listen(8080);


