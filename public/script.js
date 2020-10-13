
const socket = io('/');
const displayGrid = document.getElementById("display");   
const displayList = document.getElementById("list_display");   
const myVideo = document.createElement('video')
let myVideoStream
myVideo.muted = true
let currentUsers = []
var peer = new Peer(undefined,{
    path:'/peerjs',
    host:'/',
    port:'5000'
}); 
console.log(USERS)
currentUsers.push(USERS)
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
})
.then(stream=>{
    myVideoStream = stream;
    addVideoStream(myVideo,stream)

    peer.on('call',call=>{
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream',userVideoStream=>{
            addVideoStream(video,userVideoStream)
        })
    })

    socket.on('user-connected', (userId,username,list) => {
        connectToNewuser(userId, stream);
        displayNewuser(username)
        displayUsersList(list)
    });
    socket.on('user-disconnected', (id) => {
        console.log(`${id}  disconneted:(`)
    })
})

peer.on('open',(id)=>{
   socket.emit("join-room", ROOM_ID ,id,USERS);
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
    console.log("in steam")
    video.srcObject = stream;
    video.addEventListener('loadedmetadata',()=>{
        video.play();
    });
    let val = document.getElementsByTagName('video')
    if(val.length>2){
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
    document.querySelector('.chat__messages__list').innerHTML = html;

})

const displayUsersList = list =>{
    let html = `<li></li>`
    document.querySelector('.main__right__usersList').innerHTML = html;
    for( i=0; i<list.length ; i++){
        let html = `<li class="chat__convo"><h4 class="text-success">${list[i]}</h4></li>`;
        $('.main__right__usersList').append(html);
    }
}

// AUDIO MUTE AND UNMUTE

$(".main__mute_button").click(() => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
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
      } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
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



