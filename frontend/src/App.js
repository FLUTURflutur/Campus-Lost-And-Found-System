import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ItemDetail from './pages/ItemDetail';
import ReportItem from './pages/ReportItem';
import MyItems from './pages/MyItems';
import MyClaims from './pages/MyClaims';
import Profile from './pages/Profile';
import AdminPanel from './pages/admin/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/items/:id" element={<ItemDetail />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/report" element={<ReportItem />} />
                  <Route path="/my-items" element={<MyItems />} />
                  <Route path="/my-claims" element={<MyClaims />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
