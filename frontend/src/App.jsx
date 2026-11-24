import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './layouts/Layout';

const Overview = lazy(() => import('./pages/Overview'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Diagnose = lazy(() => import('./pages/Diagnose'));
const Reports = lazy(() => import('./pages/Reports'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Monitor = lazy(() => import('./pages/Monitor'));
const AcademicDemo = lazy(() => import('./pages/AcademicDemo'));
const About = lazy(() => import('./pages/About'));
const Settings = lazy(() => import('./pages/Settings'));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 px-4 bg-[#07090C]">
      <div className="h-0.5 w-40 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#00D9FF]" />
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8B96A5]">
        INITIALIZING MODULE...
      </span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Overview />
              </Suspense>
            }
          />
          <Route
            path="vehicles"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Vehicles />
              </Suspense>
            }
          />
          <Route
            path="diagnose"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Diagnose />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Reports />
              </Suspense>
            }
          />
          <Route
            path="maintenance"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Maintenance />
              </Suspense>
            }
          />
          <Route
            path="knowledge-base"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <KnowledgeBase />
              </Suspense>
            }
          />
          <Route
            path="monitor"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Monitor />
              </Suspense>
            }
          />
          <Route
            path="demo"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AcademicDemo />
              </Suspense>
            }
          />
          <Route
            path="about"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Settings />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
