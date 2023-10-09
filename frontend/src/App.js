import { Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import Logout from "./auth/logout";

import ObservationPage from "./components/ObservationPage";
import PrivateRoute from "./PrivateRoute";
import Home from "./components/Home";

import sio from "./auth/socket";
// info.load();
sio.connect();

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/observation" element={
        <PrivateRoute>
          <ObservationPage />
        </PrivateRoute>
      } />
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
    </Routes>

    
  );
}
