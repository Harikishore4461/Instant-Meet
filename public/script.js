
const socket = io('/');
const displayGrid = document.getElementById("display");   
const displayList = document.getElementById("list_display");   
const myVideo = document.createElement('video')
const myStream = document.createElement('video')
let usersList = []
let screenStream
let myVideoStream
let myVideoStream1
let userID
myVideo.muted = true
let currentUsers = []
var peer = new Peer(undefined,{
    path:'/peerjs',
    host:'/',
    port:'5000'
}); 
console.log(USERS)
currentUsers.push(USERS)
let UserScreen = {}
const peers = {}
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
})
.then(stream=>{
    myVideoStream = stream;
    myVideoStream1 = stream;
    addVideoStream(myVideo,myVideoStream)
    usersList.push({
        name:USERS,
        audio:true,
        video:true,
        hand:false
    })
    if(list){
        console.log(list.length)
        for (let index = 0; index < list.length; index++) {
            console.log(list[index].name)
            usersList.push(list[index])
        }
    }
    displayUsersList(usersList)  
    socket.on('refresh',list=>{
        displayUsersList(list)
    })
    socket.on('refresh-muted',(list,name)=>{
        console.log(name)
        if(name===USERS){
             $(".main__mute_button").click();
        }
        displayUsersList(list)
    })
    peer.on('call',call=>{
        call.answer(myVideoStream)
        const video = document.createElement('video')
        call.on('stream',userVideoStream=>{
            addVideoStream(video,userVideoStream)
        })
    })

    socket.on('user-connected', (userId,username,list) => {
        console.log("new user")
        connectToNewuser(userId, myVideoStream);
        displayNewuser(username)
        displayUsersList(list)
    });
    socket.on('share-screen',(src)=>{
        console.log(src)
        alert("ok")
        connectToNewuser(userId, screenStream);
      
    })

    // socket.on('user-disconnected', (id) => {
    //     console.log(`${id}  disconneted:(`)
    // })
    socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
    })
    
})

const connectToNewuser = (userId,stream) =>{
    console.log("new user")
    const call = peer.call(userId,stream);
    const video = document.createElement("video")
    video.id = USERS
    call.on('stream',userVideoStream=>{
        addVideoStream(video,userVideoStream)
    })
}
const addVideoStream = (video,stream) =>{
    console.log(stream)
    video.srcObject = stream;
    video.addEventListener('loadedmetadata',()=>{
        video.play();
    });
    let val = document.getElementsByTagName('video')
    if(val.length>3){
        displayList.append(video)
    }
    else{
        displayGrid.append(video);
    }
}

// Display New User
const displayNewuser = (name=>{
    console.log(name)
    let html = `<li class="chat__convo"><h4 class="text-success">${name} Joined</h4></li>`;
        // document.querySelector('.chat__messages__list').innerHTML = html;
    $('.chat__messages__list').append(html)
})

const displayUsersList = list =>{
    let html = `<li  class="user__list"><h3>${list.length} Joined</h3></li>`
    document.querySelector('.main__right__usersList').innerHTML = html;
    for( i=0; i<list.length ; i++){
        let html = `<li class="user__list"><h6 class="text-dark">${list[i].name}</h6>
        <div class="userslist__icons">
        <i class="unmute fas ${list[i].hand ? 'fa-hand-paper' : ''}"></i>
        <i onclick="MuteTheUser('${list[i].name}')" class="unmute fas ${list[i].audio ? 'fa-microphone' :  'fa-microphone-slash'}"></i>
        <i class="unmute fas  ${list[i].video ? 'fa-video' :  'fa-video-slash'}"></i>
        <button class="btn btn-outline-dark ${Data.host ? '': 'd-none'}" onclick="BlockTheUser('${list[i].name}')">${Data.host ? 'Block' : ''}</buton>
        </div>
        </li>`;
        $('.main__right__usersList').append(html);
    }
}
/* MUTE THE USER */
function MuteTheUser(name){
    if(Data.host){
        console.log(name)
        socket.emit('mute-the-user',name)
    }
}
// BLOCK THE USER
function BlockTheUser(name){
    socket.emit('block-the-user',name)
}
socket.on('make-user-leave',user=>{
    if(user===USERS){
        leaveMeeting()
    }
})
// LEAVE THE MEETING

function leaveMeeting(){
    $('.main__video__button').click()
    socket.emit('disconnect')  
    window.history.back();

}

// AUDIO MUTE AND UNMUTE

$(".main__mute_button").click(() => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
    socket.emit('user-muted',USERS)
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
    socket.emit('user-unmuted',USERS)
  }
});

 const setUnmuteButton = () =>{
     const html = `<i class="unmute fas fa-microphone-slash"></i>
                    <span style="font-size:18px">Unmute</span>`;
     document.querySelector('.main__mute_button').innerHTML = html;
 }
  const setMuteButton = () => {
    const html = `<i class="unmute fas fa-microphone"></i>
                    <span style="font-size:18px">Mute</span>`;
    document.querySelector(".main__mute_button").innerHTML = html;
  };

// VIDEO ON AND OFF
$('.main__video__button').click(()=>{
      const enabled = myVideoStream.getVideoTracks()[0].enabled;
      if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
        socket.emit('user-video-off',USERS)
      } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
        socket.emit('user-video-on',USERS)
      }

})

 const setPlayVideo = () => {
   const html = `<i class="unmute fas fa-video-slash"></i>
                    <span style="font-size:18px">On</span>`;
   document.querySelector(".main__video__button").innerHTML = html;
 };
 const setStopVideo = () => {
   const html = `<i class="unmute fas fa-video"></i>
                    <span style="font-size:18px">Off</span>`;
   document.querySelector(".main__video__button").innerHTML = html;
 };

// Raise hand

function handPaper(){

    socket.emit('user-raise',USERS)
      const html = `<i onclick="handRock()" class="fas fa-hand-rock"></i>
                            <span  style="font-size:18px">Down</span>`;
   document.querySelector(".main__control__hand").innerHTML = html;
}

// Hand down
function handRock(){
    socket.emit('user-down',USERS)
      const html = `<i onclick="handPaper()" class="fas fa-hand-paper"></i>
                            <span style="font-size:18px">Raise</span>`;
   document.querySelector(".main__control__hand").innerHTML = html;
}

// Chat

let text = $(".input__msg");
    $(".input__msg")
    .keydown((e)=> {
    if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", text.val());
        text.val('');
    }});            
    socket.on('createMessage',message=>{
        console.log(message)
        $('.chat__messages__list').append(`<li class="chat__convo">${message}</li>`)
    })



$('.main__control__ppl').click(()=>{
    $('.chat').css("display","none");
    $('.userslist').css("display","block")
})

$('.main__control__chat').click(()=>{
    $('.userslist').css("display","none")
    $('.chat').css("display","block");
})



// Recording 
const start = document.getElementById("start");
const Stop = document.getElementById("stop");
const video = document.querySelector("video");
let recorder, stream;

async function startRecording() {
  stream = await navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: "screen" }
  });
  recorder = new MediaRecorder(stream);

  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = e => {
    const completeBlob = new Blob(chunks, { type: chunks[0].type });
    video.src = URL.createObjectURL(completeBlob);
  };

  recorder.start();
}

start.addEventListener("click", () => {

$('#start').css('visibility','hidden')
$('#stop').css('visibility','visible')

  startRecording();

});
Stop.addEventListener("click", () => {

$('#start').css('visibility','visible')
$('#stop').css('visibility','hidden')
  recorder.stop();
  stream.getVideoTracks()[0].stop();
});


// SCREEN SHARING
 socket.on('shareTheScreen',(src)=>{
        console.log(src)
        // addVideoStream(video,src)
    })

var startScreen = document.getElementById("startScreen")
var startVideo = document.getElementById("startVideo")
var stopScreen = document.getElementById("stopScreen")
var videoScreen = document.createElement("video")

var displayMediaOption = {
    videoScreen:{
        cursor:'always'
    },
    audio:false
}


startScreen.addEventListener("click", function(e){
    startscreen();
},false)

async function startscreen(){

    try{
        socket.on('share-screen', () => {
        console.log("pkeepfepo")
      
        });
        if(myVideoStream===myVideoStream1){
        let stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOption);
            myVideoStream = stream; 
            myVideo.srcObject = stream
            const html = `<i class=" fas fa-desktop"></i>
                            <span style="font-size:18px">Stop</span>`;
            document.querySelector("#startScreen").innerHTML = html;
        }
        else{
            myVideoStream = myVideoStream1; 
            myVideo.srcObject = myVideoStream1;
              const html = `<i class=" fas fa-desktop"></i>
                            <span style="font-size:18px">Share Screen</span>`;
            document.querySelector("#startScreen").innerHTML = html;
        }
        
        
}
 
    catch(err){
        console.error("Error" + err)
    }
}

function stopscreen(e){

    let tracks = videoScreen.srcObject.getTracks()

    tracks.forEach(track => track.stop())

    videoScreen.srcObject = null;
}

async function startvideo(){

    try{
        videoScreen.srcObject = await navigator.mediaDevices.getUserMedia(displayMediaOption);
    }

    catch(err){
        console.error("Error" + err)
    }
}




peer.on('open',(id)=>{
    userId = id
    socket.emit("join-room", ROOM_ID ,id,USERS);
})
