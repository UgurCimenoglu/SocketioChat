const moment = require('moment'); //Saati Almak için moment paketi

//Mesajları ve kullanicilar buraya yollayıp bu fonksiyonu kullanacağız.
function formatMessage(username,text){
    return {
        username,
        text,
        time:moment().format('h:mm a')
    }
}

module.exports = formatMessage;