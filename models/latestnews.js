const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const latestnewsSchema=new Schema({
    
    latestparagraph:String,
    
    
    
});
const latestnews=mongoose.model("latestnews",latestnewsSchema);
module.exports=latestnews;