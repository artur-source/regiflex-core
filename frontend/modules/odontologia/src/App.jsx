import React from 'react';
import Odontograma from './components/Odontograma.jsx';
import Procedimentos from './components/Procedimentos.jsx';
import ProntuarioOdontologico from './components/ProntuarioOdontologico.jsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-700">RegiFlex - Módulo Odontologia</h1>
        <p className="text-xl text-gray-600">Instalação de Teste</p>
      </header>
      <main className="space-y-8">
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Prontuário Odontológico</h2>
          <ProntuarioOdontologico />
        </section>
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Odontograma</h2>
          <Odontograma />
        </section>
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Procedimentos</h2>
          <Procedimentos />
        </section>
      </main>
      <footer className="text-center mt-10 text-gray-500">
        <p>Desenvolvido com React, Vite e Tailwind CSS.</p>
      </footer>
    </div>
  );
}

export default App;
