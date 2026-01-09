import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, API_BASE_URL } from '@/lib/apiClient';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export const ConnectionDiagnostics = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTest = (name: string, status: 'running' | 'success' | 'error', details: string) => {
    setTests(prev => [...prev, { name, status, details, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Environment
    addTest('Environment Variables', 'running', 'Checking...');
    try {
      const envUrl = import.meta.env.VITE_API_URL;
      addTest('Environment Variables', 'success', `VITE_API_URL: ${envUrl || '(not set)'}\nAPI_BASE_URL: ${API_BASE_URL}\nMode: ${import.meta.env.MODE}`);
    } catch (e: any) {
      addTest('Environment Variables', 'error', e.message);
    }

    // Test 2: Health Check
    addTest('Health Check', 'running', 'Checking...');
    try {
      const healthUrl = API_BASE_URL.replace('/api', '/health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors'
      });
      const data = await response.json();
      addTest('Health Check', 'success', `URL: ${healthUrl}\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (e: any) {
      addTest('Health Check', 'error', `Failed to connect: ${e.message}\nURL: ${API_BASE_URL.replace('/api', '/health')}`);
    }

    // Test 3: API Test Endpoint
    addTest('API Test', 'running', 'Checking...');
    try {
      const result = await api.testConnection();
      addTest('API Test', result.success ? 'success' : 'error', JSON.stringify(result, null, 2));
    } catch (e: any) {
      addTest('API Test', 'error', e.message);
    }

    // Test 4: Inventory
    addTest('Inventory Load', 'running', 'Checking...');
    try {
      const result = await api.inventory.getAll();
      addTest('Inventory Load', result.success ? 'success' : 'error', `Found ${result.data?.length || 0} items`);
    } catch (e: any) {
      addTest('Inventory Load', 'error', e.message);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="p-6 m-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">🔬 Connection Diagnostics</h2>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run Tests'}
        </Button>
      </div>

      <div className="space-y-3">
        {tests.map((test, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${
            test.status === 'success' ? 'bg-green-50 border-green-200' :
            test.status === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {test.status === 'success' && <CheckCircle2 className="text-green-600" />}
              {test.status === 'error' && <XCircle className="text-red-600" />}
              {test.status === 'running' && <AlertCircle className="text-blue-600 animate-pulse" />}
              <span className="font-semibold">{test.name}</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-white p-2 rounded">{test.details}</pre>
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Click "Run Tests" to start diagnostics
        </div>
      )}
    </Card>
  );
};
