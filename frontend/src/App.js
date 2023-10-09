import { Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import Logout from "./auth/logout";
import { io } from "socket.io-client";
import Stellarium from "./components/Stellarium";

const socket = io('http://localhost:8000', { withCredentials: true });

socket.send('Hello!')

socket.on('disconnect', function() {
    console.log('Disconnected from the server.');
});

socket.on('connect', function() {
    console.log('Connected to the server.');
});

socket.on('message', function(data) {
    console.log(data);
});

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div></div>} />
      <Route path="/stellarium" element={<Stellarium />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}