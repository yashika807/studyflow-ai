import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StudyProvider>
        <App />
      </StudyProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
