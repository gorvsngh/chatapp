import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MobileProvider } from './contexts/MobileContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import theme from './theme';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <MobileProvider>
            <Box h="100vh" overflow="hidden">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                    <PrivateRoute requiredRole="admin">
                      <Admin />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </Box>
          </MobileProvider>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
