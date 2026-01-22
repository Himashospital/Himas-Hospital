import React from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { FrontOfficeDashboard } from './views/FrontOfficeDashboard';
import { DoctorDashboard } from './views/DoctorDashboard';
import { PackageTeamDashboard } from './views/PackageTeamDashboard';

const MainApp: React.FC = () => {
  const { currentUserRole } = useHospital();

  if (!currentUserRole) {
    return <Login />;
  }

  const renderDashboard = () => {
    switch (currentUserRole) {
      case 'FRONT_OFFICE':
        return <FrontOfficeDashboard />;
      case 'DOCTOR':
        return <DoctorDashboard />;
      case 'PACKAGE_TEAM':
        return <PackageTeamDashboard />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HospitalProvider>
      <MainApp />
    </HospitalProvider>
  );
};

export default App;
