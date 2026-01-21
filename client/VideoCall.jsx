
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://videocalloperation.onrender.com");

export default function VideoCall({ roomId }) {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const peer = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideo.current.srcObject = stream;
      });

    socket.emit("join-room", { roomId });

    socket.on("user-joined", createOffer);
    socket.on("offer", handleOffer);
    socket.on("answer", answer => peer.current.setRemoteDescription(answer));
    socket.on("ice-candidate", c => peer.current.addIceCandidate(c));

    return () => socket.disconnect();
  }, []);

  const startTimer = () => setInterval(() => setSeconds(s => s + 1), 1000);

  const createPeer = () => {
    const p = new RTCPeerConnection();
    localVideo.current.srcObject.getTracks().forEach(t =>
      p.addTrack(t, localVideo.current.srcObject)
    );
    p.ontrack = e => remoteVideo.current.srcObject = e.streams[0];
    p.onicecandidate = e => e.candidate && socket.emit("ice-candidate", { roomId, candidate: e.candidate });
    peer.current = p;
    return p;
  };

  const createOffer = async () => {
    const p = createPeer();
    const offer = await p.createOffer();
    await p.setLocalDescription(offer);
    socket.emit("offer", { roomId, offer });
    socket.emit("call-started", { roomId });
    startTimer();
  };

  const handleOffer = async offer => {
    const p = createPeer();
    await p.setRemoteDescription(offer);
    const answer = await p.createAnswer();
    await p.setLocalDescription(answer);
    socket.emit("answer", { roomId, answer });
    socket.emit("call-started", { roomId });
    startTimer();
  };

  const endCall = () => {
    socket.emit("call-ended", { roomId });
    peer.current.close();
  };

  return (
    <>
      <video ref={localVideo} autoPlay muted />
      <video ref={remoteVideo} autoPlay />
      <p>Time: {Math.floor(seconds / 60)}:{seconds % 60}</p>
      <button onClick={endCall}>End Call</button>
    </>
  );
}
