

var http = require('http');

module.exports = {

	search_bank: function(bankName, callbackResult, callbackError){
		var options = {
		  host: 'api.opencorporates.com',
		  port: 80,

		  path: '/v0.3/companies/search?q=' + encodeURIComponent(bankName) + '&format=json'
		  //path: '/v0.3/companies/search?q=barclays+bank&format=json'
		};

		http.get(options, function(res) {
		    var body = '';

		    res.on('data', function(chunk) {
		        body += chunk;
		    });

		    res.on('end', function() {
		        var data = JSON.parse(body)
		        callbackResult(data);
		    });
		}).on('error', function(e) {
		      console.log("Got error: ", e);
		});

	}

};