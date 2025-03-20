// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

let peerConnection;
let signaling;
let localStream;

// Connect to signaling server
function connectSignaling() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsURL = `${protocol}//${window.location.host}/webrtc`;
  
  signaling = new WebSocket(wsURL);
  
  signaling.onopen = () => {
    console.log('Connected to signaling server');
  };
  
  signaling.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    
    if (data.sdp) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signaling.send(JSON.stringify({ sdp: peerConnection.localDescription }));
      }
    } else if (data.ice) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    }
  };
  
  signaling.onerror = (error) => {
    console.error('Signaling server error:', error);
  };
}

// Initialize WebRTC
async function initWebRTC() {
  try {
    // Get local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    
    // Create peer connection
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.send(JSON.stringify({ ice: event.candidate }));
      }
    };
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
      }
    };
    
    connectSignaling();
    
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
  }
}

// Start call
async function startCall() {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signaling.send(JSON.stringify({ sdp: peerConnection.localDescription }));
  } catch (error) {
    console.error('Error starting call:', error);
  }
}

// Hang up call
function hangupCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  document.getElementById('localVideo').srcObject = null;
  document.getElementById('remoteVideo').srcObject = null;
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startButton').addEventListener('click', initWebRTC);
  document.getElementById('callButton').addEventListener('click', startCall);
  document.getElementById('hangupButton').addEventListener('click', hangupCall);
});