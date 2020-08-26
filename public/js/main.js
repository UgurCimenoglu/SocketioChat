const chatForm = document.getElementById('chat-form'); //chat-form id li form elemanını aldık.
const chatMessages = document.querySelector('.chat-messages'); //chat-messages id li elemanı değişkene aldık.
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


//URl'den Username ve room bilgisi alıyoruz.
const {username,room} = Qs.parse(location.search , {ignoreQueryPrefix:true})

//socket.io Bağlanti
const socket = io.connect();

//Çevrimiçi User ve Room Bilgilerini Serverdan Alma
socket.on('roomUsers' , ({room,users})=> {
    outputRoomName(room);
    outputUser(users);

})

//Oda Ve İsim Bilgisi Alıp Servera Yolluyoruz.
socket.emit("JoinRoom", {username,room});

//Serverden Gelen bildirim Mesajlarını Alıyoruz.
socket.on('message' , message=>{
    outputMessage(message);
    bildirim();

    //Scroll Bar'ın Hep En Aşağıda Kalmasını Sağladık.
    chatMessages.scrollTop = chatMessages.scrollHeight;
})


//Bu Fonksiyon Form Submit Olduğu Zaman Sayfa Refresh'i engelleyecek.
chatForm.addEventListener('submit' , (e)=>{
    e.preventDefault();

    const msg = e.target.elements.msg.value; //İnput daki yazılan değeri değiikene atıyoruz.

    socket.emit('chatMessage',msg); //inputtan Aldığımız Değeri Herkese Göndermek İçin Servera Yolluyoruz.

    e.target.elements.msg.value = ""; //İnputttaki Değeri Siliyoruz.
    e.target.elements.msg.focus(); //inputa focus

});

//outputMessage Fonksiyonu
function outputMessage(message){
    const div = document.createElement('div'); //Div Oluşturuyoruz
    div.classList.add('message');//Dive message class ını verdik ve alt satırda divin içine gelecekleri yazdık.
    div.innerHTML=`<p class="meta">${message.username} <span>${message.time}</span></p> 
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div); // oluşturduğum Div'i .chat-message classına child olarak ekliyorum.
}


//Room ismini DOM a Ekleme
function outputRoomName(room){
    roomName.innerText=room;
}

//Çevrimiçi Kullanicilar Ekleme
function outputUser(users){
    userList.innerHTML=`${users.map(user=>`<li>${user.username}</li>`).join("")}`;
}

//Bildirim Sesleri
function bildirim(){
    const audio = new Audio("/sounds/notification.mp3");
    audio.play();
}

function cikis(){
    const cikisAudio = new Audio("/sounds/error-4.mp3");
    cikisAudio.play();
}

function giris(){
    const girisAudio = new Audio("/sounds/giris.mp3");
    girisAudio.play();
}