var http = require('http');
var http = require('follow-redirects').http;

module.exports = {

  search_bank: function(bankName, callbackResult, callbackError){
    var req_url = "http://opencorporates.com/reconcile?query=" + encodeURIComponent(bankName);
    
    http.get(req_url, function(res) {
      console.log(res.statusCode);
      var body = '';
      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
        var data = JSON.parse(body)
        callbackResult(data.result);
      });

    }).on('error', function(e) {
          console.log("Got error: ", e);
    });

  }

};