
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Home } from './pages/Home.tsx';
import { Catalog } from './pages/Catalog.tsx';
import { SellVinyl } from './pages/SellVinyl.tsx';
import { ListingDetails } from './pages/ListingDetails.tsx';
import { Profile } from './pages/Profile.tsx';
import { Login } from './pages/Login.tsx';
import { ResetPassword } from './pages/ResetPassword.tsx';
import { ValidateAccount } from './pages/ValidateAccount.tsx';
import { Favorites } from './pages/Favorites.tsx';
import { EditListing } from './pages/EditListing.tsx';
import { ActivitySidebar } from './components/ActivitySidebar.tsx';
import { Calculator } from './components/Calculator.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { WelcomeModal } from './components/WelcomeModal.tsx';
import { LookingFor } from './pages/LookingFor.tsx';
import { LookingForDetails } from './pages/LookingForDetails.tsx';

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
