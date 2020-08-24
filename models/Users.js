const mongoose = require('mongoose');

module.exports = mongoose.model('Users' , new mongoose.Schema({
    name:{type:String,required:true,unique:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true}
}));