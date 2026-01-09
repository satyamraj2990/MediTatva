import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./no-blur-override.css";

// Test backend connectivity on startup with detailed debugging
const testBackendConnection = async () => {
  console.log('═══════════════════════════════════════════════');
  console.log('🔍 FRONTEND STARTUP - CONNECTIVITY TEST');
  console.log('═══════════════════════════════════════════════');
  
  // Use relative URL to leverage Vite proxy
  const healthUrl = '/health';
  
  console.log('📋 Configuration:');
  console.log('   Using Vite Proxy: Yes');
  console.log('   Health URL:', healthUrl);
  console.log('   Window Origin:', window.location.origin);
  console.log('═══════════════════════════════════════════════');
  
  console.log('🧪 Testing backend connection...');
  console.log('🎯 Target:', healthUrl);
  
  try {
    const startTime = Date.now();
    const response = await fetch(healthUrl, { 
      method: 'GET',
      cache: 'no-cache',
    });
    const elapsed = Date.now() - startTime;
    
    console.log('📡 Response received in', elapsed, 'ms');
    console.log('   Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    if (data.status === 'ok' || data.ready === true) {
      console.log('✅ Backend connection successful!');
      console.log('📊 Backend status:', data);
      console.log('═══════════════════════════════════════════════');
      return true;
    } else {
      console.warn('⚠️ Backend responded but not ready:', data);
      console.log('═══════════════════════════════════════════════');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Backend connection failed!');
    console.error('   Error type:', error.name);
    console.error('   Error message:', error.message);
    console.error('💡 This is expected on initial load, will retry...');
    console.log('═══════════════════════════════════════════════');
    return false;
  }
};

// Run connection test
testBackendConnection();

// Ensure root element exists and has proper styling
const rootElement = document.getElementById("root");
if (rootElement) {
  // Add fallback background color immediately
  rootElement.style.minHeight = "100vh";
  rootElement.style.width = "100%";
  
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}

