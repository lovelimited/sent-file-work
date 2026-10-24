import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherDashboard } from './TeacherDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return <TeacherDashboard />;
};
