
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
const formidable = require('formidable');
const path = require('path');
var fs = require('fs')
let usersList = []
app.use(cookieParser());
let file = ''
app.use(express.static("public"))
app.set('view engine','ejs') 
app.use(bodyParser.urlencoded({ extended: false }))
let error =''
      let dataFile 
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

app.get('/refresh/:id',(req,res)=>{
    let roomUsers = []
    for (let i = 0; i < usersList.length; i++) {
        if(usersList[i].roomid === req.params.id)
        {
            roomUsers.push(usersList[i])
        }
    }
    fs.writeFile('attendance.txt', '', function()
    {console.log('done')})
    for (let index = 0; index < roomUsers.length; index++) {
    fs.appendFile(`attendance.txt`, `\n ${roomUsers[index].name}`, function (err) {
    if (err) throw err;
    console.log('Saved!');
    });
}
    res.status(204).send()
})
app.get('/atte',(req,res)=>{
   res.download(__dirname +`/attendance.txt`);   
})
app.get('/download/:src',(req,res)=>{
    let source=req.params.src
    console.log(source)
   res.download(__dirname + '/'+source);   
})
  function get(file){
      console.log(file)
      if(file===''){
          return dataFile
      }
      else{
        dataFile = file 
        return true
      }
  }
app.post('/api/file', function(req, res) {
    console.log("FIIILLE")
    var form = new formidable.IncomingForm();
      // specify that we want to allow the user to upload multiple files in a single request
      form.multiples = true;
      // store all uploads in the /uploads directory
      form.uploadDir = path.basename(path.dirname('/public'))
      // every time a file has been uploaded successfully,
      // rename it to it's orignal name
      form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name), function(err){
            if (err) throw err;
            //console.log('renamed complete: '+file.name);
            const file_path = '/'+file.name
            file = file_path
            get(file)
            console.log(file)
        });
      });
      // log any errors that occur
      form.on('error', function(err) {
          console.log('An error has occured: \n' + err);
      });
      // once all the files have been uploaded, send a response to the client
      form.on('end', function() {
           //res.end('success');
           res.statusMessage = "Process cashabck initiated";
           res.statusCode = 200;
        //    res.redirect('/')
         res.status(204).send();
        //    res.end()
        
      });
      // parse the incoming request containing the form data
      form.parse(req);
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
    let roomUsers = []
    for (let i = 0; i < usersList.length; i++) {
        if(usersList[i].roomid === req.params.id)
        {
            roomUsers.push(usersList[i])
        }
    }
    res.render("room", { roomid: req.params.id ,list:context,userList:roomUsers});
})
io.on('connection',socket=>{
    socket.on('join-room', (roomId,userId,user,host) => {
            let roomUsers = []
            function refresh(){
            roomUsers = []
            for (let i = 0; i < usersList.length; i++) {
                if(usersList[i].roomid === roomId)
                {
                    roomUsers.push(usersList[i])
                }
            }
            }
          socket.on('file-submit',async()=>{
            await new Promise(resolve => setTimeout(resolve, 5000));
            let srcfile = get('')
            console.log(srcfile)
            io.to(roomId).emit('file-shared',srcfile)
          })
          socket.on('disconnect', () => {
            console.log(user + ' Got disconnect!');
            refresh()
            for (let i = 0; i < roomUsers.length; i++) {
                if(roomUsers[i].name===user){
                    roomUsers.splice(i,1)
                }                              
            }
            for (let i = 0; i < usersList.length; i++) {
                if(usersList[i].name === user && usersList[i].roomid===roomId){
                    usersList.splice(i,1)
                }
                
            }
            io.to(roomId).emit('refresh',roomUsers)
            socket.to(roomId).broadcast.emit('user-disconnected',userId);
            socket.leave(roomId)
        });
  
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
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
        })
         socket.on('user-unmuted',(user)=>{
            console.log(user+" unmuted")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].audio=true
                }
            }
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
        })
        /* VIDEO ON AND OFF */
        socket.on('user-video-off',(user)=>{
            console.log(user+" off")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].video=false
                }
            }
            refresh()

            io.to(roomId).emit('refresh',roomUsers)
        })
        socket.on('user-video-on',(user)=>{
            console.log(user+" on")
               for(let i=0;i<usersList.length;i++){
                if(user===usersList[i].name){
                    usersList[i].video=true
                }
            }
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
        })
        socket.on('user-raise',(name)=>{
             for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].hand=true
                }
            }
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
        })
          socket.on('user-down',(name)=>{
             for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].hand=false
                }
            }
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
        })
        /* MUTE THE USER */
        socket.on('mute-the-user',name=>{
            for(let i=0;i<usersList.length;i++){
                if(name===usersList[i].name){
                    usersList[i].audio=false
                }
            }
            refresh()
            io.to(roomId).emit('refresh-muted',roomUsers,name)
        })
        // BLOCK THE USER
        socket.on('block-the-user',name=>{
              for (let i = 0; i < usersList.length; i++) {
                if(usersList[i].name===name){
                    usersList.splice(i,1)
                }                              
            }
            refresh()
            io.to(roomId).emit('refresh',roomUsers)
            io.to(roomId).emit('make-user-leave',name)
        })
        let userinfo = {
            name:user,
            id:userId,
            roomid:roomId,
            audio:true,
            video:true,
            hand:false,
            host:host
        }
        console.log(host)
        usersList.push(userinfo)
     
        socket.join(roomId)
        refresh()
        socket.to(roomId).broadcast.emit('user-connected',userId,user,roomUsers);
    });
})


server.listen(process.env.PORT || 3030)