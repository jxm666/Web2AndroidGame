/* 
* @Author: jiangxianmeng@haima.me  
* @Date: 2019-12-17 14:36:32  
 * @Last Modified by: jiangxianmeng@haima.me
 * @Last Modified time: 2019-12-17 15:51:56
*/


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
      remoteVideosContainer.appendChild(peer.remoteVideoEl);

//        //输出播放器宽度与高度
//        var div = document.getElementById("remoteVideosContainer").getElementsByTagName('video')[0];
//        console.log('onclick; 宽度：'+div.videoWidth+'高度：'+div.videoHeight);
       
//        div.onclick = function (event) {
//         event = event || window.event;
//         //2.获取鼠标在整个页面的位置
//         var pagex = event.pageX || scroll().left + event.clientX;
//         var pagey = event.pageY || scroll().top + event.clientY;
//         //3.获取盒子在整个页面的位置
//         var xx = div.offsetLeft;
//         var yy = div.offsetTop
//         //4.用鼠标的位置减去盒子的位置赋值给盒子的内容。
//         var targetx = pagex - xx;
//         var targety = pagey - yy;

//         var isFull = document.fullscreenEnabled || window.fullScreen || document.webkitIsFullScreen || document.msFullscreenEnabled;
// 　　　　if(isFull == undefined)
//           console.log('目前是全屏状态');
//         else
//         //控制台输出：
//           console.log("onclick; 宽度："+this.videoWidth+"高度："+this.videoHeight+"鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;");
//           //分辨率的宽与高，当获取的坐标点x或者y大于video初始大小，则是用分辨率数值。
//           // console.log("onclick; 宽度："+window.screen.width+"高度："+window.screen.height+"鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;");
//       }


//         //封装的scrollTop
//         function scroll() {
//             if(window.pageYOffset != null) {  // ie9+ 高版本浏览器
//                 // 因为 window.pageYOffset 默认的是  0  所以这里需要判断
//                 return {
//                     left: window.pageXOffset,
//                     top: window.pageYOffset
//                 }
//             }
//             else if(document.compatMode === "CSS1Compat") {    // 标准浏览器   来判断有没有声明DTD
//                 return {
//                     left: document.documentElement.scrollLeft,
//                     top: document.documentElement.scrollTop
//                 }
//             }
//             return {   // 未声明 DTD
//                 left: document.body.scrollLeft,
//                 top: document.body.scrollTop
//             }
//         }

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
    }
  };
  
});

var Peer = function (pcConfig, pcConstraints) {
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  // this.remoteVideoEl.controls = true;
  this.remoteVideoEl.autoplay = true;
}