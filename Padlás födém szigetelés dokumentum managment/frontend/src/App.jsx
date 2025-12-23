import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Pages
import Home from './pages/Home';
import NewProject from './pages/NewProject';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import AdminDashboard from './pages/AdminDashboard';

// Layout
import MainLayout from './components/Layout/MainLayout';

function App() {
    return (
        <AppProvider>
            <Router>
                <MainLayout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/new-project" element={<NewProject />} />
                        <Route path="/projects" element={<ProjectList />} />
                        <Route path="/projects/:id" element={<ProjectDetails />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Routes>
                </MainLayout>
            </Router>
        </AppProvider>
    );
}

export default App;
