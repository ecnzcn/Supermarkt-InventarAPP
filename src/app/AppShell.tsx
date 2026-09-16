import { Outlet } from 'react-router-dom';
import { Nav } from '@/components/Nav';

export function AppShell() {
  return (
    <div className="app-shell">
      <Nav />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
