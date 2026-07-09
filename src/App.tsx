import { HistoryDashboard } from './components/HistoryDashboard';
import { Layout } from './components/Layout';
import { LiveDashboard } from './components/LiveDashboard';

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return <Layout>{path === '/history' ? <HistoryDashboard /> : <LiveDashboard />}</Layout>;
}
