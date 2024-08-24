const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestSchema=new Schema({
    image:{
       url:String,
      
    },
   
    h1:String,
    paragraph:String,
    
    
    
});
const latest=mongoose.model("latest",latestSchema);
module.exports=latest;