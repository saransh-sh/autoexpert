import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Overview from './pages/Overview';
import Vehicles from './pages/Vehicles';
import Diagnose from './pages/Diagnose';
import Reports from './pages/Reports';
import Maintenance from './pages/Maintenance';
import KnowledgeBase from './pages/KnowledgeBase';
import Monitor from './pages/Monitor';
import AcademicDemo from './pages/AcademicDemo';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="demo" element={<AcademicDemo />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
