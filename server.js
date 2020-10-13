
const express = require('express')
const app = express()
const url = require('url');  
const server = require("http").createServer(app);
const bodyParser = require('body-parser')
const { v4:uuidv4 } = require('uuid')
const io = require("socket.io")(server);
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

app.use('/peerjs',peerServer)
app.get('/',(req,res)=>{
    res.render("sigin")
})
app.post('/',(req,res)=>{
    let items =req.body;
    items.host = false
    res.cookie("context", items , { httpOnly: true });
    res.redirect(`/${req.body.roomid}`)
})
var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};
app.get('/atte',(req,res)=>{
    fs.writeFile('mynewfile1.txt', '', function()
    {console.log('done')})
    for (let index = 0; index < usersList.length; index++) {
    fs.appendFile(`mynewfile1.txt`, `\n ${usersList[index]}`, function (err) {
    if (err) throw err;
    console.log('Saved!');
    });
   res.download(__dirname +`/mynewfile1.txt`);   
}
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
    console.log(context)
    res.render("room", { roomid: req.params.id ,list:context});
})
io.on('connection',socket=>{
    // Disconnection
    socket.on('join-room', (roomId,userId,user) => {
          socket.on('disconnect', () => {
            console.log(user + ' Got disconnect!');
            for (let i = 0; i < usersList.length; i++) {
                if(usersList[i]===user){
                    usersList.splice(i,1)
                }                              
            }
            // socket.to(roomId).broadcast.emit('user-disconnected',userId);
            // socket.leave(roomId)
        });
        socket.on('message',message =>{
            io.to(roomId).emit('createMessage',message)
        })
      
        usersList.push(user)
        console.log(usersList)
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId,user,usersList);

    });
})


server.listen(5000,()=>console.log("server runs on 5000"))