import React, { useState } from 'react';
import apiService from '../services/api';

const TestReports: React.FC = () => {
  const [expensesData, setExpensesData] = useState<any>(null);
  const [profitData, setProfitData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testExpenses = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing expenses API...');
      const response = await apiService.getExpensesReport({});
      console.log('🔍 Expenses response:', response);
      setExpensesData(response);
    } catch (error) {
      console.error('❌ Expenses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProfit = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing profit API...');
      const response = await apiService.getProfitReport({});
      console.log('🔍 Profit response:', response);
      setProfitData(response);
    } catch (error) {
      console.error('❌ Profit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Reports API</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testExpenses}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Expenses API'}
          </button>
          
          {expensesData && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-bold">Expenses Response:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(expensesData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={testProfit}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Profit API'}
          </button>
          
          {profitData && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-bold">Profit Response:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(profitData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestReports;
