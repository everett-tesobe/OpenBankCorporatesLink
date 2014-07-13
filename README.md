A hackathon developed application to help add opencorporates urls to Open Bank Project data.

## SETUP

Get consumer key / secret:  
register your client at  
https://apisandbox.openbankproject.com/consumer-registration  
and use the credentials as _openbankConsumerKey/_openbankConsumerSecret in oauth.js  

Install Dependencies:  
npm install express  
npm install oauth
npm install express-session
npm install cookie-parser
npm install oauth

Start Server:  
node oauth.js  

Navigate to the page:  
Local host: http://127.0.0.1:8080  