import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Fixtures from './pages/Fixtures';
import Broadcasts from './pages/Broadcasts';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/broadcasts" element={<Broadcasts />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
