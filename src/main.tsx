import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/lexend-deca/400.css';
import '@fontsource/lexend-deca/500.css';
import '@fontsource/lexend-deca/600.css';
import '../src/shared/theme/globals.css';
import App from './app/App';
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
