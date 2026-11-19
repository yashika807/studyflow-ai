import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Materials from './pages/Materials.jsx';
import AddMaterial from './pages/AddMaterial.jsx';
import MaterialView from './pages/MaterialView.jsx';
import CalendarPage from './pages/Calendar.jsx';
import Revise from './pages/Revise.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { user } = useAuth();

  // The login page is the first thing visitors see.
  if (!user) return <Login />;

  // key={user.id} gives every account its own fresh state
  return (
    <StudyProvider key={user.id}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="materials/new" element={<AddMaterial />} />
          <Route path="materials/:id" element={<MaterialView />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="revise" element={<Revise />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StudyProvider>
  );
}
