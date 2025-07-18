import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { LandingPage } from "./components/LandingPage";
import { AddressInput } from "./components/AddressInput";
import { MainFeed } from "./components/MainFeed";
import { CreatePostModal } from "./components/CreatePostModal";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { useGeolocation } from "./hooks/useGeolocation";
import { usePerformance } from "./hooks/usePerformance";
import toast from "react-hot-toast";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<
    "landing" | "address" | "feed"
  >("landing");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
    location,
    loading,
    error,
    hasPermission,
    isManualLocation,
    requestLocation,
    setManualLocation,
    clearLocation,
  } = useGeolocation();

  // Performance optimization
  usePerformance();

  // Auto-navigate to feed if user is authenticated and has location
  useEffect(() => {
    if (user && location && hasPermission) {
      setCurrentView("feed");
    } else if (user && !location) {
      setCurrentView("landing");
    }
  }, [user, location, hasPermission]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  const handleLocationRequest = async () => {
    await requestLocation();
  };

  const handleManualAddress = () => {
    setCurrentView("address");
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setManualLocation(address, lat, lng);
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleClearCache = () => {
    clearLocation();
    setShowSettings(false);
    setCurrentView("landing");
    toast.success("Cache cleared successfully!");
  };

  const handleChangeLocation = () => {
    setShowSettings(false);
    setCurrentView("landing");
  };

  // Show loading screen while checking for stored location
  if (loading && !location) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Getting your location...
          </p>
        </div>
      </div>
    );
  }

  // Show address input page
  if (currentView === "address") {
    return (
      <AddressInput
        onAddressSelect={handleAddressSelect}
        onBack={handleBackToLanding}
        loading={loading}
      />
    );
  }

  // Show landing page if no location (but user is authenticated)
  if (currentView === "landing" || !location) {
    return (
      <LandingPage
        onRequestLocation={handleLocationRequest}
        onManualAddress={handleManualAddress}
        loading={loading}
        error={error}
      />
    );
  }

  // Show main feed (user authenticated + has location)
  return (
    <>
      <MainFeed
        userLocation={location}
        isManualLocation={isManualLocation}
        onCreatePost={handleCreatePost}
        onOpenSettings={handleOpenSettings}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        userLocation={location}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={handleCloseSettings}
        onClearCache={handleClearCache}
        onChangeLocation={handleChangeLocation}
        userLocation={location}
        isManualLocation={isManualLocation}
      />

      {/* PWA Features */}
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--toast-bg)",
              color: "var(--toast-color)",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;