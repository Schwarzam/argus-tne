import { Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import Logout from "./auth/logout";

import ObservationPage from "./components/ObservationPage";

import sio from "./auth/socket";
import info from "./auth/appinfo";

// info.load();
sio.connect();



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div></div>} />
      <Route path="/observation" element={<ObservationPage />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
