import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Worksheets from './pages/Worksheets';
import CreateWorksheet from './pages/CreateWorksheet';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/worksheets" element={<Worksheets />} />
            <Route path="/worksheets/new" element={<CreateWorksheet />} />
            <Route path="/settings" element={<Settings />} />
            {/* Add more protected routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
