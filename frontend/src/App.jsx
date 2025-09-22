import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Recorder from "./components/Recorder";
import RoomPage from "./components/RoomPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Recorder />} />
        <Route path="/room" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
