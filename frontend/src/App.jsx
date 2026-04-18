import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar           from './components/Sidebar.jsx';
import HomePage          from './pages/HomePage.jsx';
import ResourcesPage     from './pages/ResourcesPage.jsx';
import TeamsPage         from './pages/TeamsPage.jsx';
import ReleasesPage      from './pages/ReleasesPage.jsx';
import ReleaseDetailPage from './pages/ReleaseDetailPage.jsx';
import EpicsPage         from './pages/EpicsPage.jsx';
import EpicDetailPage    from './pages/EpicDetailPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <div className="app-content">
            <Routes>
              <Route path="/"               element={<HomePage />} />
              <Route path="/resources"      element={<ResourcesPage />} />
              <Route path="/teams"          element={<TeamsPage />} />
              <Route path="/releases"       element={<ReleasesPage />} />
              <Route path="/releases/:id"   element={<ReleaseDetailPage />} />
              <Route path="/epics"          element={<EpicsPage />} />
              <Route path="/epics/:id"      element={<EpicDetailPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
