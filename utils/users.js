const users = []; //Boş Bir array tanımladık.

//Bu fonksiyon bize Sohbete katılanların id isim ve katıldıgı oda ismini döndürecek.
function userJoin(id,username,room){

    const user = {id,username,room};

    users.push(user); //Users array e bilgileri push ediyoruz.

    return user;
}

//Mevcut Kullaniici Sorgulama
function getCurrentUser(id){
    return users.find(user => user.id===id);
};

//Kullanici Ayrilirsa users array'inden sil
function userLeave(id){
    const index = users.findIndex(user=>user.id === id);
    if(index !== -1){
        return users.splice(index,1)[0];
    }
}

//Aynı Odadaki Kullanicilari Filtreliyor.
function getRoomUsers(room){
    return users.filter(user=>user.room===room);
}
module.exports={
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
};