const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestSchema=new Schema({
    image:{
       url:String,
      
    },
   
    h1 : String,

    paragraph : String,
    
    createdAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    }
    
});
const latest=mongoose.model("latest",latestSchema);
module.exports=latest;