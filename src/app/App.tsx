import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UndoToastProvider } from '@/features/undo/UndoToastContext';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { ItemFormPage } from '@/features/inventory/ItemFormPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { CategoriesSettingsPage } from '@/features/settings/CategoriesSettingsPage';
import { LocationsSettingsPage } from '@/features/settings/LocationsSettingsPage';
import { BackupSettingsPage } from '@/features/settings/BackupSettingsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <UndoToastProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/new" element={<ItemFormPage />} />
            <Route path="/inventory/:itemId/edit" element={<ItemFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/categories" element={<CategoriesSettingsPage />} />
            <Route path="/settings/locations" element={<LocationsSettingsPage />} />
            <Route path="/settings/backup" element={<BackupSettingsPage />} />
          </Route>
        </Routes>
      </UndoToastProvider>
    </ErrorBoundary>
  );
}
