import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Materials from './pages/Materials.jsx';
import AddMaterial from './pages/AddMaterial.jsx';
import MaterialView from './pages/MaterialView.jsx';
import Revise from './pages/Revise.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="materials" element={<Materials />} />
        <Route path="materials/new" element={<AddMaterial />} />
        <Route path="materials/:id" element={<MaterialView />} />
        <Route path="revise" element={<Revise />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
