import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'highlight.js/styles/atom-one-dark.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
