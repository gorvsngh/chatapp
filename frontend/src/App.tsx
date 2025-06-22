import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MobileProvider } from './contexts/MobileContext';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import theme from './theme';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import TestCredentials from './components/TestCredentials';

// Component to handle conditional redirects
const HomeRedirect = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="whatsapp.500" />
      </Center>
    );
  }
  
  return <Navigate to={user ? "/groups" : "/login"} replace />;
};

// Component to protect login/register pages from authenticated users
const AuthPageWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="whatsapp.500" />
      </Center>
    );
  }
  
  if (user) {
    return <Navigate to="/groups" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Box h="100vh" overflow="hidden">
      <Routes>
        <Route 
          path="/login" 
          element={
            <AuthPageWrapper>
              <Login />
            </AuthPageWrapper>
          } 
        />
        <Route 
          path="/register" 
          element={
            <AuthPageWrapper>
              <Register />
            </AuthPageWrapper>
          } 
        />
        <Route 
          path="/admin-login" 
          element={<AdminLogin />} 
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <MobileProvider>
            <AppRoutes />
            <TestCredentials />
          </MobileProvider>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
