const mongoose = require('mongoose');

module.exports = mongoose.model('Messages' , new mongoose.Schema({
    username:{type:String},
    text:{type:String},
    time:{type:String},
    room:{type:String}
}));