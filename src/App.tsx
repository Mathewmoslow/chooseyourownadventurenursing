import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { SimulatorPage } from './pages/SimulatorPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<SimulatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
