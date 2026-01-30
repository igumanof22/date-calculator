import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Export components for Module Federation
export { default as CreateView } from './CreateView';
export { default as EditView } from './EditView';
export { default as DetailView } from './DetailView';
export { default as GetDataView } from './GetDataView';
export { default as PostDataView } from './PostDataView';
export { default as IzinFormView } from './IzinFormView';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}