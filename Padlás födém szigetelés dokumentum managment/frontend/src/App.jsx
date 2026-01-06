import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import NewProject from './pages/NewProject';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import InviteUser from './pages/InviteUser';
import AcceptInvite from './pages/AcceptInvite';

// Layout
import MainLayout from './components/Layout/MainLayout';

// Private Route Component
const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    return token ? children : <Navigate to="/login" />;
};

function App() {
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
                        <Route path="/admin" element={
                            <PrivateRoute>
                                <MainLayout>
                                    <AdminDashboard />
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
                    </Routes>
                </Router>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
