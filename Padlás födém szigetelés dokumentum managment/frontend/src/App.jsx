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
import LeadForm from './pages/LeadForm'; // [NEW]
import Inventory from './pages/Inventory';
import MaterialHandover from './pages/MaterialHandover';
import PendingHandovers from './pages/PendingHandovers';
import ProjectUsage from './pages/ProjectUsage'; // [NEW] Link
import HandoverHistory from './pages/HandoverHistory';
import StockHistory from './pages/StockHistory'; // [NEW]

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
                        <Route path="/ajanlatkeres" element={<LeadForm />} /> {/* [NEW] Public Lead Form */}

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
                        <Route path="/inventory" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <Inventory />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/handover" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <MaterialHandover />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/pending-handovers" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <PendingHandovers />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/projects/:id/usage" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <ProjectUsage />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                        <Route path="/stock-history" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <StockHistory />
                                </MainLayout>
                            </PrivateRoute>
                        } />
                    </Routes>
                </Router>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
