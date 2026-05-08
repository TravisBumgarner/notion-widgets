import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppThemeProvider from '@/styles/Theme';
import IndexPage from '@/widgets/IndexPage';
import LeanCoffee from '@/widgets/lean-coffee/LeanCoffee';

const App = () => {
  return (
    <BrowserRouter>
      <AppThemeProvider>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/w/lean-coffee" element={<LeanCoffee />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppThemeProvider>
    </BrowserRouter>
  );
};

export default App;
