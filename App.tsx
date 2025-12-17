
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
import { ResetPassword } from './pages/ResetPassword';
import { ValidateAccount } from './pages/ValidateAccount';
import { Favorites } from './pages/Favorites';
import { EditListing } from './pages/EditListing';
import { ActivitySidebar } from './components/ActivitySidebar';
import { Calculator } from './components/Calculator';
import { AdminDashboard } from './pages/AdminDashboard';
import { WelcomeModal } from './components/WelcomeModal';
import { LookingFor } from './pages/LookingFor';
import { LookingForDetails } from './pages/LookingForDetails';

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen bg-vinyl-black text-gray-100 font-sans flex flex-col">
          <Navbar />
          <div className="flex flex-1 relative">
            <div className="flex-1 w-full lg:pr-80 transition-all duration-300">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/procuro-por" element={<LookingFor />} />
                <Route path="/procuro-por/:id" element={<LookingForDetails />} />
                <Route path="/sell" element={<SellVinyl />} />
                <Route path="/edit/:id" element={<EditListing />} />
                <Route path="/listing/:id" element={<ListingDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/validate" element={<ValidateAccount />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
            <ActivitySidebar />
          </div>
          <Calculator />
          <WelcomeModal />
        </div>
      </Router>
    </StoreProvider>
  );
};

export default App;
