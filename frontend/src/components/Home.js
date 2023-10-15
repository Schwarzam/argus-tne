import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h2 className="mb-4 text-3xl font-semibold text-center">Argus - Telescópio nas Escolas</h2>
      <div className="mb-8 max-w-lg text-left">
        <p className="mb-2">Integrante do projeto <a href="http://www.telescopiosnaescola.pro.br/" className="text-blue-600 hover:underline">Telescópios na Escola</a>.</p>
        <p className="mb-2">O "Argus" é um telescópio do tipo Schmidt-Cassegrain, marca Celestron, com abertura de 28cm e 2,8m de distância focal. Possui uma CCD ST7-XE (câmera digital astronômica) com filtros vermelho, verde, azul, ultra-violeta e infra-vermelho. A montagem robótica, Paramount GT1100-S, pode ser operada remotamente por qualquer escola com acesso à internet.</p>
        <p className="mb-2">É mantido pelo <a href="https://www.iag.usp.br/astronomia" className="text-blue-600 hover:underline">Departamento de Astronomia do IAG/USP</a>, no Observatório Abrahão de Moraes localizado no município de Valinhos em SP.</p>
        <p className="mb-2">Veja também o evento <a href="http://www.telescopiosnaescola.pro.br/argus/noite_com_as_estrelas.php" className="text-blue-600 hover:underline">Noite com as Estrelas</a> e venha nos fazer uma visita.</p>
      </div>
      <div className="grid gap-4 md:flex md:space-x-4">
        <ActionBox title="Observar!" onAction={() => navigate("/observation")} />
        <ActionBox title="Admin Access" onAction={() => navigate("/admin")} />
      </div>
    </div>
  );
}

const ActionBox = ({ title, onAction }) => (
  <div 
    onClick={onAction} 
    className="w-64 p-6 text-xl font-semibold text-center text-white cursor-pointer bg-blue-600 rounded-md shadow-md hover:bg-blue-700"
  >
    {title}
  </div>
);
