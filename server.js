
const express = require('express')
const app = express()
const url = require('url');  
const server = require("http").createServer(app);
const bodyParser = require('body-parser')
const { v4:uuidv4 } = require('uuid')
const io = require("socket.io")(server);
const ss = require('socket.io-stream')
const http = require('http')
// PEER CONNECTION ESTABLISHMET
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server,{debug:true}); 
var cookieParser = require("cookie-parser");
var fs = require('fs')
let usersList = []
app.use(cookieParser());

app.use(express.static("public"))
app.set('view engine','ejs') 
app.use(bodyParser.urlencoded({ extended: false }))
let error =''
app.use('/peerjs',peerServer)
app.get('/',(req,res)=>{
    res.render("sigin",{error:error})
})

app.post('/',(req,res)=>{
    let items =req.body;
    items.host = false
            console.log(items.username)
            console.log(usersList)
    for(let i=0;i<usersList.length;i++){
        if(items.username === usersList[i].name){
            console.log("errrrrr")
            let error = "Try any another username"
            res.render("sigin",{error:error})
        }
    }
    res.cookie("context", items , { httpOnly: true });
    res.redirect(`/${req.body.roomid}`)
})

app.get('/refresh',(req,res)=>{
    // res.end("ok")
    fs.writeFile('attendance.txt', '', function()
    {console.log('done')})
    for (let index = 0; index < usersList.length; index++) {
    fs.appendFile(`attendance.txt`, `\n ${usersList[index].name}`, function (err) {
    if (err) throw err;
    console.log('Saved!');
    });
}
    res.status(204).send()
})
app.get('/atte',(req,res)=>{

   res.download(__dirname +`/attendance.txt`);   

})
app.post('/room', (req, res) => {
       let items ={
        username:req.body.host,
        host:true
    };
    console.log("room")
    res.cookie("context",items, { httpOnly: true });
    res.redirect(`/${uuidv4()}`)
})
app.get('/:id',(req,res)=>{
    var context = req.cookies["context"];
    res.clearCookie("context", { httpOnly: true });

    res.render("room", { roomid: req.params.id ,list:context,userList:usersList});
})
io.on('connection',socket=>{
    socket.on('join-room', (roomId,userId,user) => {
          socket.on('disconnect', () => {
            console.log(user + ' Got disconnect!');
            for (let i = 0; i < usersList.length; i++) {
                if(usersList[i].name===user){
                    usersList.splice(i,1)
                }                              
            }
            io.to(roomId).emit('refresh',usersList)
            socket.to(roomId).broadcast.emit('user-disconnected',userId);
            socket.leave(roomId)
        });
    //        socket.on('disconnect', () => {
    //   socket.to(roomId).broadcast.emit('user-disconnected', userId)
    // })
        socket.on('screen-shared',(src)=>{
            //  const _srcObject = ss.createStream();
            console.log(src)
           
            io.to(roomId).emit('share-screen',src);
        })
        socket.on('message',message =>{
            io.to(roomId).emit('createMessage',message)
        })
        /* MUTE AND UNMUTE */
        socket.on('user-muted',(user)=>{
            console.log(user+" muted")
            for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].audio=false
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
         socket.on('user-unmuted',(user)=>{
            console.log(user+" unmuted")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].audio=true
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
        /* VIDEO ON AND OFF */
        socket.on('user-video-off',(user)=>{
            console.log(user+" off")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].video=false
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
        socket.on('user-video-on',(user)=>{
            console.log(user+" on")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].video=true
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
        socket.on('user-raise',(name)=>{
             for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].hand=true
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
          socket.on('user-down',(name)=>{
             for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].hand=false
                }
            }
            io.to(roomId).emit('refresh',usersList)
        })
        /* MUTE THE USER */
        socket.on('mute-the-user',name=>{
            for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].audio=false
                }
            }
            io.to(roomId).emit('refresh-muted',usersList,name)
        })
        // BLOCK THE USER
        socket.on('block-the-user',name=>{
              for (let i = 0; i < usersList.length; i++) {
                if(usersList[i].name===name){
                    usersList.splice(i,1)
                }                              
            }
            io.to(roomId).emit('refresh',usersList)
            io.to(roomId).emit('make-user-leave',name)
        })
        let userinfo = {
            name:user,
            id:userId,
            audio:true,
            video:true,
            hand:false
        }
        usersList.push(userinfo)
     
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId,user,usersList);
    });
})


server.listen(process.env.PORT || 3030)