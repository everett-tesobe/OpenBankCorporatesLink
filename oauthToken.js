module.exports = {

  filename: "oauthToken.json",

	getToken: function(jf, req, callback){
    
    jf.readFile(this.filename, function(err, jsonString) {

      var obj = JSON.parse(jsonString);  
      //hacky callback fun - don't load the page until this executes please!
			req.session.oauthAccessToken = obj.consumerKey;
			req.session.oauthAccessTokenSecret = obj.consumerSecret; 
			callback();
    });
	},
	
	saveToken : function(jf, key, secret){
	 var obj = {
	   consumerKey : key,
	   consumerSecret : secret,
   };
   jf.writeFile(this.filename, JSON.stringify(obj) , function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 
	
  },

};