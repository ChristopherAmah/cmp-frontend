// PDF.js Worker Configuration
// This file must be imported before any react-pdf components
// Import pdfjs from react-pdf to ensure we use the same version react-pdf expects
import { pdfjs } from 'react-pdf';

// Use CDN for PDF.js worker - more reliable in production
// react-pdf uses pdfjs-dist@5.4.296 internally, but we'll use the latest compatible version
// Using unpkg CDN ensures the worker is always accessible
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

console.log('PDF.js worker configured:', workerUrl);

// Ensure it's also set on window for compatibility
if (typeof window !== 'undefined') {
  window.pdfjsWorker = workerUrl;
}

export default pdfjs;
