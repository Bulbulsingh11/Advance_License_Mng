import { useState } from 'react';
import { ModuleId } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LicencesPage } from './components/LicencesPage';
import { MaterialsPage } from './components/MaterialsPage';
import { ImportTransactionsPage } from './components/ImportTransactionsPage';
import { ExportsPage } from './components/ExportsPage';
import { UtilizationPage } from './components/UtilizationPage';
import { LicenceFinderPage } from './components/LicenceFinderPage';
import { PortalGuidePage } from './components/PortalGuidePage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { AuthProvider } from './contexts/AuthContext';

function MainApp() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');
  
  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        currentModule={currentModule} 
        onSelectModule={setCurrentModule} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header currentModule={currentModule} />
        
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {currentModule === 'dashboard' ? (
            <Dashboard onNavigate={setCurrentModule} />
          ) : currentModule === 'licences' ? (
            <LicencesPage />
          ) : currentModule === 'materials' ? (
            <MaterialsPage />
          ) : currentModule === 'imports' ? (
            <ImportTransactionsPage />
          ) : currentModule === 'exports' ? (
            <ExportsPage />
          ) : currentModule === 'utilization' ? (
            <UtilizationPage onNavigate={setCurrentModule} />
          ) : currentModule === 'finder' ? (
            <LicenceFinderPage onNavigate={setCurrentModule} />
          ) : currentModule === 'reports' ? (
            <ReportsPage />
          ) : currentModule === 'settings' ? (
            <SettingsPage />
          ) : currentModule === 'guide' ? (
            <PortalGuidePage onNavigate={setCurrentModule} />
          ) : (
            <PlaceholderPage moduleId={currentModule} onNavigate={setCurrentModule} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
