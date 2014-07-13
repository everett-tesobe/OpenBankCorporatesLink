
module.exports = {
  
  filename: "db.sqlite",
  
  getDb: function(jf, sqlite3){
    var exists = jf.existsSync(this.filename);
    var db = new sqlite3.Database(this.filename);
    db.serialize(function() {
      if(!exists) {
        db.run("CREATE TABLE suggestions (name TEXT PRIMARY KEY, url TEXT)", function(e){
          console.log(e);
        }, function(e){
          console.log(e);
        });
      }
    });
    
    return db;
  },
  
  
  save_suggestion: function(jf, sqlite3, bankName, bankurl){
    var db = this.getDb(jf, sqlite3);
    db.serialize(function(){
      db.run("insert or replace into suggestions (name, url) values ('"+bankName +"','" + bankurl + "')");
    });
  },
  
  get_suggestion: function(jf, sqlite3, bankName, callback){
    var db = this.getDb(jf, sqlite3);
    var result = null;
    db.serialize(function() {
      db.get("SELECT name, url FROM suggestions where name like '" + bankName +"'", [], function(err, row) {
         callback(row ? row.url : null);
      });
    });
  },

};