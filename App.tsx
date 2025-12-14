import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { SellVinyl } from './pages/SellVinyl';
import { ListingDetails } from './pages/ListingDetails';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Favorites } from './pages/Favorites';
import { ActivitySidebar } from './components/ActivitySidebar';
import { Calculator } from './components/Calculator';
import { AdminDashboard } from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen bg-vinyl-black text-gray-100 font-sans flex flex-col">
          <Navbar />
          <div className="flex flex-1 relative">
            {/* Main Content Area */}
            <div className="flex-1 w-full lg:pr-80 transition-all duration-300">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/sell" element={<SellVinyl />} />
                <Route path="/listing/:id" element={<ListingDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
            
            {/* Real-time Sidebar */}
            <ActivitySidebar />
          </div>
          
          {/* Utilities */}
          <Calculator />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;