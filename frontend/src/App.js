import React, { useEffect, useRef, useState } from 'react';
import Navbar from './Navbar';

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    startWebRTC();
    return () => {
      if (peerRef.current) peerRef.current.close();
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebRTC = async () => {
    try {
      setStatus('connecting');
      console.log('Starting WebRTC connection...');
      
      // Get user media
      // const stream = await navigator.mediaDevices.getUserMedia({ 
      //   video: { 
      //     width: { ideal: 640 },
      //     height: { ideal: 480 }
      //   }
      // });
      // console.log('Got media stream:', stream.getVideoTracks()[0].getSettings());

      // // Set local video
      // if (localVideoRef.current) {
      //   localVideoRef.current.srcObject = stream;
      // }
      //code commented dont want the user media 

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = pc;

      // Set up event handlers for the peer connection
      pc.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection State:', pc.connectionState);
        setStatus('Connection: ' + pc.connectionState);
      };

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (remoteVideoRef.current && event.streams[0]) {
          console.log('Setting remote stream to video element');
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Add local stream to peer connection
      // stream.getTracks().forEach(track => {
      //   console.log('Adding track to peer connection:', track.kind);
      //   pc.addTrack(track, stream);
      // });
      //dont want local steam

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Created and set local description');

      // Send offer to server
      console.log('Sending offer to server...');
      const response = await fetch('http://localhost:8000/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type
        })
      });

      const answerData = await response.json();
      console.log('Received answer from server');

      // Set remote description
      await pc.setRemoteDescription(answerData);
      console.log('Set remote description');
      setStatus('connected');

    } catch (err) {
      console.error('Error in WebRTC setup:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Navbar/>
      <h1>YOLO Detection</h1>
  
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Remote Stream (From Server)</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', border: '2px solid blue' }}
          />
        </div>
      </div>

      <div style={{
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        Status: {status}
      </div>
  
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}
  
      <button 
        onClick={startWebRTC}
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Restart Connection
      </button>
    </div>
  );
  
  
}


export default App;