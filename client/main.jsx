
import React from "react";
import { createRoot } from "react-dom/client";
import VideoCall from "./VideoCall";

createRoot(document.getElementById("root")).render(
  <VideoCall roomId="test-room" />
);
