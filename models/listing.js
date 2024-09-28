const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const listschema=new Schema({
    title:{
        type:String,
       
        
    },
    description:{
        type: String,
    },

    image:{
        
        
            filename: String,
            url: String
        
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    }
    
    
   
  

})
const listing=mongoose.model('listing', listschema);



module.exports=listing;