import { useState } from 'react';
import { ModuleId } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LicencesPage } from './components/LicencesPage';
import { PlaceholderPage } from './components/PlaceholderPage';

export default function App() {
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
          ) : (
            <PlaceholderPage moduleId={currentModule} onNavigate={setCurrentModule} />
          )}
        </main>
      </div>
    </div>
  );
}
