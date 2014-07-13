// npm install express
// npm install express-session
// npm install cookie-parser
// npm install oauth
// npm install jsonfile
// npm install follow-redirects


var openCorp = require('./openCorp');
var openToken = require('./oauthToken');
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
      
      openToken.saveToken(jf, oauthAccessToken, oauthAccessTokenSecret);
       
			res.redirect('/signed_in');
		}
	});
});


app.get('/signed_in', function(req, res){
	res.send('Thank you for logging in! <br><a href="/getAccount">Account transactions</a>')
});

app.get('/getAccount', function(req, res){

  var sendResponse = function(){
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
  };

 if (!req.session.oauthAccessToken){
    openToken.getToken(jf, req, sendResponse);
  } else {
    sendResponse();
  }

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
  var sendResponse = function(){
  	fs.readFile('./webUI/list.html', function (err, html) {
      if (err) {
          throw err; 
      }       
      res.writeHeader(200, {"Content-Type": "text/html"});  
      res.write(html);  
      res.end();  
  	 });
  }; 

  if (!req.session.oauthAccessToken){
    openToken.getToken(jf, req, sendResponse);
  } else {
    sendResponse();
  }

});





// write into Open Corporte URL Field
app.get('/writeOCURLField', function(req, res){	
  
  	// if (request.method != 'POST') 
  	// 	return;

	// TODO: get this from the req!
	var ACCOUNT_ID = "main";
	var VIEW_ID = "owner";
	var OTHER_ACCOUNT_ID = "52ef858cca8aa4fe2d46d3c9";
	var queryUrl = "http://google.com";

	// get post reqest data 
	// ACCOUNT_ID = req.body.ACCOUNT_ID;
	// VIEW_ID = req.body.VIEW_ID;
	// OTHER_ACCOUNT_ID = req.body.OTHER_ACCOUNT_ID;
	// queryUrl = req.body.queryUrl;


	//var body = "{'open_corporates_URL':'" + queryUrl +"'}";
	var body = JSON.stringify({"open_corporates_URL": queryUrl});

	// An object of options to indicate where to post to
	// var post_options = {
	//   host: 'https://apisandbox.openbankproject.com',
	//   port: '80',
	//   path: '/banks/rbs/accounts/main/owner/other_accounts/52ef858cca8aa4fe2d46d3c9/metadata/open_corporates_url',
	//   method: 'POST',
	//   headers: {
	//       'Content-Type': 'application/json',
	//       'Content-Length': body.length
	//   }
	// };


	// Set up the request
	

	//var url = 'https://apisandbox.openbankproject.com/banks/rbs/accounts/main/owner/other_accounts/52ef858cca8aa4fe2d46d3c9/open_corporates_url';
	var url = 'https://apisandbox.openbankproject.com/obp/v1.2.1/banks/rbs/accounts/' + 
				ACCOUNT_ID + 
				'/' + 
				VIEW_ID + 
				'/other_accounts/' + 
				OTHER_ACCOUNT_ID +
				'/open_corporates_url';


	consumer.post(url, 
				 req.session.oauthAccessToken, 
				 req.session.oauthAccessTokenSecret, 
				 body, 
				 'application/json; charset=utf-8', 
				 function(error,data, response) {
					res.send(data);
				});
});
 
app.get('*', function(req, res){
	res.redirect('/connect');
});


app.listen(8080);


