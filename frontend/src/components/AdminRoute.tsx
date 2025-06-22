import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Center, 
  Spinner, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  VStack,
  Text,
  Button,
  Box
} from '@chakra-ui/react';
import { adminAPI } from '../services/api';

interface AdminRouteProps {
  children: React.ReactNode;
}

interface AdminSessionState {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiry?: Date;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [sessionState, setSessionState] = useState<AdminSessionState>({
    isValid: false,
    isLoading: true,
    error: null
  });

  const checkAdminSession = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if admin token exists
      const adminToken = localStorage.getItem('admin-token');
      if (!adminToken) {
        throw new Error('No admin session found');
      }

      // Validate session with backend
      const response = await adminAPI.validateSession();
      
      if (response.valid) {
        setSessionState({
          isValid: true,
          isLoading: false,
          error: null,
          sessionExpiry: new Date(response.sessionExpiry)
        });
        
        // Update stored user data
        localStorage.setItem('admin-user', JSON.stringify(response.user));
      } else {
        throw new Error(response.error || 'Invalid admin session');
      }
      
    } catch (error: any) {
      console.error('Admin session validation failed:', error);
      
      // Clear invalid session data
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-user');
      
      setSessionState({
        isValid: false,
        isLoading: false,
        error: error.response?.data?.error || error.message || 'Session validation failed'
      });
    }
  };

  useEffect(() => {
    checkAdminSession();
    
    // Set up periodic session validation (every 5 minutes)
    const interval = setInterval(checkAdminSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (sessionState.isLoading) {
    return (
      <Center h="100vh" bg="gray.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="red.400" thickness="4px" />
          <Text color="gray.300">Validating admin session...</Text>
        </VStack>
      </Center>
    );
  }

  // Session invalid - redirect to admin login
  if (!sessionState.isValid) {
    return <Navigate to="/admin-login" replace />;
  }

  // Session valid but has error (e.g., session expired)
  if (sessionState.error) {
    return (
      <Center h="100vh" bg="gray.900">
        <Box maxW="md" p={6}>
          <Alert 
            status="error" 
            flexDirection="column" 
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            bg="red.900"
            border="1px"
            borderColor="red.500"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg" color="red.300">
              Admin Session Error
            </AlertTitle>
            <AlertDescription maxWidth="sm" color="red.200">
              {sessionState.error}
            </AlertDescription>
            <Button 
              mt={4} 
              colorScheme="red" 
              onClick={() => window.location.href = '/admin-login'}
            >
              Return to Admin Login
            </Button>
          </Alert>
        </Box>
      </Center>
    );
  }

  // Session valid - render admin content with security wrapper
  return (
    <Box>
      {/* Session Expiry Warning */}
      {sessionState.sessionExpiry && (
        <SessionExpiryWarning expiry={sessionState.sessionExpiry} />
      )}
      
      {/* Admin Content */}
      {children}
    </Box>
  );
};

// Component to show session expiry warning
const SessionExpiryWarning: React.FC<{ expiry: Date }> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expiryTime = expiry.getTime();
      const remaining = expiryTime - now;
      
      setTimeLeft(remaining);
      
      // Show warning if less than 30 minutes left
      setShowWarning(remaining < 30 * 60 * 1000 && remaining > 0);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiry]);

  if (!showWarning) return null;

  const minutes = Math.floor(timeLeft / (1000 * 60));

  return (
    <Alert status="warning" bg="yellow.900" borderColor="yellow.500">
      <AlertIcon />
      <AlertTitle mr={2}>Session Expiring Soon!</AlertTitle>
      <AlertDescription>
        Your admin session will expire in {minutes} minutes. 
        Please save your work and refresh to extend the session.
      </AlertDescription>
    </Alert>
  );
};

export default AdminRoute; 