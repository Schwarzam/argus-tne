import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css';

import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import App from "./App";
import Inicio from "./components/Inicio";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      
      <Inicio />
      <App />

      <ToastContainer 
        position="bottom-left"
      />
      
    </BrowserRouter>
  </StrictMode>
);