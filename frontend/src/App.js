import { Routes, Route } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import Logout from "./auth/logout";

export default function App() {
  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}