var PeerManager = (function () {

  var localId,
      config = {
        peerConnectionConfig: {
          iceServers: [
            {"url": "stun:172.16.211.23:3478"},
            {"url": "stun:172.16.211.24:3478"}
            // {"url": "stun:23.21.150.121"},
            // {"url": "stun:stun.l.google.com:19302"}
          ]
        },
        peerConnectionConstraints: {
          optional: [
            {"DtlsSrtpKeyAgreement": true}
          ]
        }
      },
      peerDatabase = {},
      localStream,
      remoteVideoContainer = document.getElementById('remoteVideosContainer'),
      remoteStream,bytesReceived=0,timestamp=0,jitterBufferDelay=0,
      framesReceived=0,packetsReceived=0,packetsLost=0,
      socket = io();
      
  socket.on('message', handleMessage);
  socket.on('id', function(id) {
    localId = id;
  });
      
  function addPeer(remoteId) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints);
    peer.pc.onicecandidate = function(event) {
      if (event.candidate) {
        send('candidate', remoteId, {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    peer.pc.onaddstream = function(event) {
      attachMediaStream(peer.remoteVideoEl, event.stream);
        remoteStream = event.stream;
      
        var btn=document.createElement("BUTTON");
        var t=document.createTextNode("全屏");
        btn.appendChild(t);
        btn.setAttribute("onclick","videoAll(this)");
        // btn.onclick="videoAll(this)";

      remoteVideosContainer.appendChild(btn);
      remoteVideosContainer.appendChild(peer.remoteVideoEl);
      //输出播放器宽度与高度remoteVideosContainer
      var videoElement = document.getElementById("remoteVideosContainer").getElementsByTagName('video')[0];
      console.log('onclick; 宽度：'+videoElement.videoWidth+'高度：'+videoElement.videoHeight);
      
      videoElement.onclick = function (event) {
       event = event || window.event;
       //2.获取鼠标在整个页面的位置
       var pagex = event.pageX || scroll().left + event.clientX;
       var pagey = event.pageY || scroll().top + event.clientY;
       //3.获取盒子在整个页面的位置
       var xx = videoElement.offsetLeft;
       var yy = videoElement.offsetTop
       //4.用鼠标的位置减去盒子的位置赋值给盒子的内容。
       var targetx = pagex - xx;
       var targety = pagey - yy;

       if(document.isFullScreen || document.mozIsFullScreen || document.webkitIsFullScreen)
        {
          //console.log('目前是全屏状态');
          targetx = parseInt(1.4*targetx);
          targety = parseInt(1.4*targety);
        }else{
          targetx = parseInt(1.5*targetx);
          targety = parseInt(1.5*targety);
        }
          
        var mesData = targetx+" "+targety;
        sendInput("tap",remoteId,mesData);
        console.log("onclick; 宽度："+this.videoWidth+"高度："+this.videoHeight+"鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;");
     }

    //  //定义按下鼠标x与y的值，及移动鼠标
    //  videoElement.onmousedown = function (event) {

    //  }
    document.onkeydown = function (ev) 
    {
      ev = ev || event;

      var mesData, keyCode = ev.keyCode;
      console.log("键盘输入值："+keyCode);
      switch(keyCode){
        case 87:
        case 38:
          console.log("上键");
          mesData ="300 850 300 700 1000";
          break;
        case 83:
        case 40:
          console.log("下键");
          mesData ="300 850 300 1050 1000";
          break;
        case 65:
        case 37:
          console.log("左键");
          mesData ="250 850 140 850 1000";
          break;
        case 68:
        case 39:
          console.log("右键");
          mesData =" 250 850 350 850 1000";
          break;
      }

      sendInput("swipe",remoteId,mesData);
    }

    };
    peer.pc.onremovestream = function(event) {
      peer.remoteVideoEl.src = '';
      remoteVideosContainer.removeChild(peer.remoteVideoEl);
    };
    peer.pc.oniceconnectionstatechange = function(event) {
      switch(
      (  event.srcElement // Chrome
      || event.target   ) // Firefox
      .iceConnectionState) {
        case 'disconnected':
          remoteVideosContainer.removeChild(peer.remoteVideoEl);
          break;
      }
    };
    peerDatabase[remoteId] = peer;
        
    return peer;
  }
    
  function answer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createAnswer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('answer', remoteId, sessionDescription);
      }, 
      error
    );
  }
  function offer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createOffer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('offer', remoteId, sessionDescription);
      }, 
      error
    );
  }
  function handleMessage(message) {
    var type = message.type,
        from = message.from,
        pc = (peerDatabase[from] || addPeer(from)).pc;

    console.log('received ' + type + ' from ' + from);
  
    switch (type) {
      case 'init':
        toggleLocalStream(pc);
        offer(from);
        break;
      case 'offer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        answer(from);
        break;
      case 'answer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        break;
      case 'candidate':
        if(pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
          }), function(){}, error);
        }
        break;
    }
  }
  function send(type, to, payload) {
    console.log('sending ' + type + ' to ' + to);

    socket.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }
  function sendInput(type, to, mesgData) {
    console.log('sending Input ' + type + ' to ' + to);

    socket.emit('input', {
      to: to,
      type: type,
      input: mesgData
    });
  }
  function toggleLocalStream(pc) {
    if(localStream) {
      (!!pc.getLocalStreams().length) ? pc.removeStream(localStream) : pc.addStream(localStream);
    }
  }
  function error(err){
    console.log(err);
  }

  return {
    getId: function() {
      return localId;
    },
    
    setLocalStream: function(stream) {

      // if local cam has been stopped, remove it from all outgoing streams.
      if(!stream) {
        for(id in peerDatabase) {
          pc = peerDatabase[id].pc;
          if(!!pc.getLocalStreams().length) {
            pc.removeStream(localStream);
            offer(id);
          }
        }
      }

      localStream = stream;
    }, 

    toggleLocalStream: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
      toggleLocalStream(peer.pc);
    },
    
    peerInit: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
      send('init', remoteId, null);
    },

    peerRenegociate: function(remoteId) {
      offer(remoteId);
    },

    send: function(type, payload) {
      socket.emit(type, payload);
    },
      getSomeMessage(remoteId) {
          peer = peerDatabase[remoteId] || addPeer(remoteId);
          let pc = peer.pc;
        console.log("getSomeMessage:",remoteStream);
        var str = "",endTimestamp=0,endBytesReceived=0,endframesReceived=0,
            endpacketsReceived=0,endjitterBufferDelay=0,endpacketsLost=0;
        var selector = remoteStream.getVideoTracks()[0];
        let deviceId = selector.getSettings().deviceId,
            height = selector.getSettings().height,
            width = selector.getSettings().width,
            frameRate = selector.getSettings().frameRate;
        console.log(deviceId+";"+height+";"+width+";"+frameRate);
        pc.getStats(null).then(stats => {
            stats.forEach(report => {
                console.log("report.type:"+report.type);
                //console.log("report:",JSON.stringify(report));

                if(report.type == "inbound-rtp" && report.mediaType == "video"){
                    if(firstStatus){
                        packetsReceived = report.packetsReceived;
                        packetsLost = report.packetsLost;
                        timestamp = Number(report.timestamp);
                        str += "<p> packetsReceived:"+packetsReceived+"</p>";
                        str += "<p> packetsLost:"+packetsLost+"</p>";
                    }else{
                        endpacketsReceived = report.packetsReceived;
                        endpacketsLost = report.packetsLost;
                        endTimestamp = Number(report.timestamp);
                        let packetsMs =  (endpacketsReceived - packetsReceived) / (endTimestamp - timestamp);
                        let packetsLostMs =  (endpacketsLost - packetsLost) / (endTimestamp - timestamp);
                        str += "<p> packetsReceived/s = "+(packetsMs*1000)+"</p>";
                        str += "<p> packetsLost/ms = "+packetsLostMs+"</p>";
                    }
                }
                if(report.type=="track"){
                    /*if(report.framesReceived){
                        framesReceived = Number(report.framesReceived);
                        str += "<p>framesReceived: "+framesReceived+"</p>";
                    }
                    */
                    if(report.jitterBufferDelay){
                        jitterBufferDelay = report.jitterBufferDelay;
                        str += "<p>"+(report.kind)+"--jitterBufferDelay: "+jitterBufferDelay+"</p>";
                    }
                    if(report.kind=="video"){
                        let frameHeight = report.frameHeight,
                            frameWidth = report.frameWidth;
                        str += "<p>video.frameWidth: "+frameWidth+"</p>";
                        str += "<p>video.frameHeight: "+frameHeight+"</p>";
                    }
                    if(firstStatus){
                        if(report.framesReceived){
                            framesReceived = Number(report.framesReceived);
                            timestamp = Number(report.timestamp);
                            str += "<p>framesReceived: "+framesReceived+"</p>";
                        }
                        /*
                        if(report.jitterBufferDelay){
                            jitterBufferDelay = report.jitterBufferDelay;
                            timestamp = Number(report.timestamp);
                            str += "<p>jitterBufferDelay: "+jitterBufferDelay+"</p>";
                        }*/
                    }else{
                        if(report.framesReceived){
                            endframesReceived = Number(report.framesReceived);
                            endTimestamp = Number(report.timestamp);
                            let framesReceivedMs =  (endframesReceived - framesReceived) / (endTimestamp - timestamp);
                            str += "<p> framesReceived/s = "+(framesReceivedMs*1000)+"</p>"
                        }
                        /*
                        if(report.jitterBufferDelay){
                            endjitterBufferDelay = report.jitterBufferDelay;
                            endTimestamp = Number(report.timestamp);
                        }
                        let jitterBufferMs =  (endjitterBufferDelay - jitterBufferDelay) / (endTimestamp - timestamp);
                        str += "<p> jitterBufferDelay/s = "+jitterBufferMs+"</p>"

                        let framesReceivedMs =  (endframesReceived - framesReceived) / (endTimestamp - timestamp);
                        str += "<p> framesReceived/s = "+(framesReceivedMs*1000)+"</p>"
                        */
                    }
                }
                if(report.type =="transport"){
                    if(firstStatus){
                        firstStatus = false;
                        bytesReceived = Number(report.bytesReceived);
                        timestamp = Number(report.timestamp);
                        str += "<p> bytesReceived:"+bytesReceived+"</p>"
                    }else{
                        endTimestamp = Number(report.timestamp);
                        endBytesReceived = Number(report.bytesReceived);

                        let bytesMs =  (endBytesReceived - bytesReceived) / (endTimestamp - timestamp);
                        str += "<p> bytesReceived/ms = "+bytesMs+"</p>"
                    }
                    str += "<p>getSettings().frameRate: "+frameRate+"</p>";
                }

                document.getElementById('showMessage').innerHTML = str;
            });
        })
    }
  };

});

var Peer = function (pcConfig, pcConstraints) {
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  this.remoteVideoEl.controls = false;
  this.remoteVideoEl.autoplay = true;
}

var firstStatus = true;

// 控制video全屏显示的按钮事件方法
function videoAll(bt){
  console.log("is videoAll click.");
  //$('.videofull').click(function(){
		// var videobox = $(this).siblings('.videobox');
		// var videoObj = videobox.find('video')[0];
		var videoObj = document.getElementById("remoteVideosContainer").getElementsByTagName('video')[0];
		if(videoObj.requestFullScreen) {
			videoObj.requestFullScreen(); 
		} else if(videoObj.mozRequestFullScreen) {
			videoObj.mozRequestFullScreen(); 
		} else if(videoObj.webkitRequestFullScreen) {
			videoObj.webkitRequestFullScreen(); 
    }
    
    videoObj.controls = false;
//	})

}

 //封装的scrollTop
 function scroll() {
  if(window.pageYOffset != null) {  // ie9+ 高版本浏览器
      // 因为 window.pageYOffset 默认的是  0  所以这里需要判断
      return {
          left: window.pageXOffset,
          top: window.pageYOffset
      }
  }
  else if(document.compatMode === "CSS1Compat") {    // 标准浏览器   来判断有没有声明DTD
      return {
          left: document.documentElement.scrollLeft,
          top: document.documentElement.scrollTop
      }
  }
  return {   // 未声明 DTD
      left: document.body.scrollLeft,
      top: document.body.scrollTop
  }
}

