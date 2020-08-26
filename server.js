const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io'); //socket.io modülünü dahil ettik.
const io = socketio(server); //Socket.io'yu Servere Bağladık.
const {formatMessage,databaseMessage} = require('./utils/message'); //formatMessage fonksiyonunu çağırdık.
const {userJoin , getCurrentUser, userLeave, getRoomUsers} = require('./utils/users'); 
const PORT = process.env.PORT || 3000;
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);

//MongoDB veritabanı modellleme paketi
const mongoose = require('mongoose');   
const Users = require('./models/Users');
const users = require('./utils/users');
const Messages = require('./models/Messages');


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Ugur1621:Ugur1621@cluster0.az56l.mongodb.net/socketiotez?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true,useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});


mongoose.connect(uri,{useNewUrlParser: true,useUnifiedTopology: true,useCreateIndex: true})
    .then(()=>{console.log("Baglanti basarili")})
    .catch((error)=>{console.log("Baglantı Hatasi")});


//Public Dosyasının Erişimini Açıyorum.
app.use(express.static(__dirname + "/public"));
app.set('view-engine' , 'ejs');
app.use(express.urlencoded({extended:false})); //req.body deki post edilen bilgileri almak için.

//Session işlemleri için gerekli modül
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  }))


//mesaj Middleware
app.use((req,res,next)=>{
    res.locals.sessionFlash = req.session.sessionFlash
    delete req.session.sessionFlash
    next()
})


app.get('/' ,(req,res)=>{

    if(req.session.userId){
        return res.render('index.ejs',{isim:req.session.name})
    }else{
        res.redirect('/login');
    } 
})


app.get('/register' , (req,res)=>{
    res.render('register.ejs');
})


app.post('/register' , (req,res)=>{
    const {email} = req.body;
    Users.findOne({email}, (err,data)=>{
            if(email == req.body.email){
                req.session.sessionFlash={
                    message:"Böyle Bir E-mail veya Kullanıcı Adı Sistemimizde Kayıtlıdır!"
                }
            }
    })

    const user = new Users({
        name : req.body.username,
        email: req.body.email,
        password:req.body.password
    })

    user.save((err,data)=>{
        if(err){
            req.session.sessionFlash={
                message:"Böyle Bir Email veya Kullanıcı Adı Sistemimizde Kayıtlıdır!"
            }
            res.redirect("/register")
        }
        else{
            req.session.sessionFlash={
                message:"Kayıt Başarılı, Giriş Yapabilirsiniz..."
            }   
            res.redirect('/login');
        }
    })
})


app.get('/login' , (req,res)=>{
    if(req.session.userId){
        return res.redirect('/')
    }
    res.render('login.ejs');
})

app.post('/login' , (req,res)=>{
    const {email,password} = req.body;
    Users.findOne({email} , (err,user)=>{
        if(user){
            const name = user.name;
            if(user.password == password){
                req.session.userId = user._id;
                req.session.name = user.name;
                res.render('index.ejs', {isim:name});
            }else{
                req.session.sessionFlash={
                    message:"Kullanıcı Adı veya Şifre Yanlış!"
                }
                res.redirect('/login');
            }
        }else{
            req.session.sessionFlash={
                message:"Böyle Bir Üyelik Bulunmamaktadır!"
            }
            res.redirect('/login');
        }
    })
})

app.get('/chat' , (req,res)=>{
    if(req.session.userId){
        return res.render('chat.ejs');
    }else{
        res.redirect('/login');
    }
    
})

app.get("/logout" , (req,res)=>{
    req.session.destroy();
    res.redirect("/login");
})



const botName = "Admin";

//Kullanici Bağlandığı Zaman Yapılanlar.
io.on('connection' , socket =>{

    //Ön Yüzden Gelen kullaniciadi ve oda  bilgilerini aldık.
    socket.on('JoinRoom' , ({username , room})=>{

        //Odaya giren kişinin id'si kullanici adını ve girdiği odanın adını alıyoruz.
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //veritabanında girilen odanın mesajlarını alıyoruz. Map ile gelen her verideki elemanı sırasıyla liteliyorum.
        Messages.find({room:user.room},(err,data)=>{
            const veri = data.map(veriler=>{
                io.to(user.room).emit('message' , databaseMessage(veriler.username,veriler.text,veriler.time)) //io.emit sockete bağlı herkese mesajı yollar, yollayan da dahil.
            })
            
        })

        



        // Emit, Sockete bağlı herkese yollar.
        socket.emit('message' , formatMessage(botName,`Hoşgeldiniz...`));

        // Bağlanan Kişi Hariç Diğer Herkese Mesaj Yollar.
        socket.broadcast.to(user.room).emit('message' , formatMessage(botName,`${user.username} odaya katıldı.`));

        //Kullanici ve Oda Bilgisi Cliente Yollama
        io.to(user.room).emit('roomUsers' , {
            room:user.room,
            users:getRoomUsers(user.room)
        });
    });



    //Kullanici Ayrildiği Zaman Yapilacak İşlemler.
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message' , formatMessage(botName,`${user.username} odadan ayrildi.`));

                    //Kullanici ve Oda Bilgisi Yollama
                    io.to(user.room).emit('roomUsers' , {
                        room:user.room,
                        users:getRoomUsers(user.room),
            
                    });
        }
    });

    //İnputtan Gelen Değeri Servera Çekme
    socket.on("chatMessage" , msg=>{

        const user = getCurrentUser(socket.id);
        const mesaj = formatMessage(user.username,msg);

        io.to(user.room).emit('message' , formatMessage(user.username,msg)) //io.emit sockete bağlı herkese mesajı yollar, yollayan da dahil.

        //Ön yüzden gelen mesajı veritabanına kaydediyoruz.
        const Message = new Messages({
            username : mesaj.username,
            text : mesaj.text,
            time : mesaj.time,
            room : user.room
        })

        Message.save((err,data)=>{

        })
    });
});



//Server PORT değişkenindeki değer ile çalışacak...
server.listen(PORT , ()=>{console.log(`Server Port ${PORT}'de çalisiyor...`)})