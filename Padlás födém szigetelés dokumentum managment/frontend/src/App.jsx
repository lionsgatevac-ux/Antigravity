import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import NewProject from './pages/NewProject';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import EditProject from './pages/EditProject';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import InviteUser from './pages/InviteUser';
import AcceptInvite from './pages/AcceptInvite';
import EmailSettings from './pages/EmailSettings';
import RemoteSign from './pages/RemoteSign';

// Layout
import MainLayout from './components/Layout/MainLayout';

// Private Route Component
const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return token ? children : <Navigate to="/login" />;
};

function App() {
    // Add PWA update listener
    useEffect(() => {
        let refreshing = false;
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }, []);

    return (
        <AuthProvider>
            <AppProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <Home />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/new-project" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <NewProject />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/projects" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <ProjectList />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/projects/:id" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <ProjectDetails />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/projects/:id/edit" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <EditProject />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/admin" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <AdminDashboard />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/admin/email-settings" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <EmailSettings />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/invite" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <InviteUser />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/accept-invite" element={<AcceptInvite />} />
                        <Route path="/sign/:token" element={<RemoteSign />} />
                    </Routes>
                </Router>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
