import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Container,
  Flex,
  Badge,
  Divider,
  Icon,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiShield, FiEye, FiEyeOff, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

interface AdminLoginFormData {
  regNo: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormData>();
  
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    minutes: number;
  } | null>(null);
  
  const toast = useToast();
  const navigate = useNavigate();

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      setLockoutInfo(null);
      
      const response = await adminAPI.login(data);
      
      // Store admin session data
      localStorage.setItem('admin-token', response.token);
      localStorage.setItem('admin-user', JSON.stringify(response.user));
      
      toast({
        title: 'Admin Login Successful',
        description: `Welcome ${response.user.name}. Session expires in ${response.sessionExpiry}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to admin dashboard
      navigate('/admin');
      
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.code === 'ACCOUNT_LOCKED') {
        setLockoutInfo({
          isLocked: true,
          minutes: errorData.lockoutMinutes
        });
        
        toast({
          title: 'Account Temporarily Locked',
          description: `Too many failed attempts. Try again in ${errorData.lockoutMinutes} minutes.`,
          status: 'error',
          duration: 10000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Admin Login Failed',
          description: errorData?.error || 'Invalid admin credentials',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Flex h="100vh" align="center" justify="center" bg="gray.900" p={4}>
      <Container maxW="md" w="100%">
        <Box 
          bg="gray.800" 
          p={{ base: 6, md: 8 }} 
          rounded="lg" 
          shadow="2xl" 
          border="1px" 
          borderColor="red.500"
          maxH="95vh"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(239, 68, 68, 0.5)',
              borderRadius: '20px',
            },
          }}
        >
          {/* Header with Security Warning */}
          <VStack spacing={{ base: 4, md: 6 }} mb={{ base: 4, md: 6 }}>
            <Flex align="center" gap={3}>
              <Icon as={FiShield} boxSize={{ base: 6, md: 8 }} color="red.400" />
              <Heading color="red.400" size={{ base: "md", md: "lg" }}>Admin Access</Heading>
            </Flex>
            
            <Alert status="warning" rounded="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize={{ base: "sm", md: "md" }}>Restricted Area!</AlertTitle>
                <AlertDescription fontSize={{ base: "xs", md: "sm" }}>
                  This is a secure admin portal. All access attempts are logged and monitored.
                  Unauthorized access is prohibited.
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>

          {/* Security Features Display */}
          <Box mb={{ base: 4, md: 6 }} p={{ base: 3, md: 4 }} bg="gray.700" rounded="md">
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300" mb={2}>
              <Icon as={FiLock} mr={2} />
              Security Features Active:
            </Text>
            <Flex wrap="wrap" gap={2}>
              <Badge colorScheme="green" size="sm">IP Monitoring</Badge>
              <Badge colorScheme="blue" size="sm">Rate Limited</Badge>
              <Badge colorScheme="purple" size="sm">Session Timeout</Badge>
              <Badge colorScheme="orange" size="sm">Audit Logging</Badge>
              <Badge colorScheme="red" size="sm">Account Lockout</Badge>
            </Flex>
          </Box>

          {/* Lockout Warning */}
          {lockoutInfo?.isLocked && (
            <Alert status="error" mb={4} rounded="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Account Locked!</AlertTitle>
                <AlertDescription>
                  Too many failed login attempts. Please wait {lockoutInfo.minutes} minutes before trying again.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={{ base: 3, md: 4 }}>
              <FormControl isInvalid={!!errors.regNo}>
                <FormLabel color="gray.300">Admin Registration Number</FormLabel>
                <Input
                  {...register('regNo', {
                    required: 'Admin registration number is required',
                    pattern: {
                      value: /^[A-Z0-9]+$/,
                      message: 'Invalid registration number format',
                    },
                  })}
                  placeholder="Enter admin registration number"
                  bg="gray.700"
                  border="1px"
                  borderColor="gray.600"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'red.400', boxShadow: '0 0 0 1px red.400' }}
                />
                <FormErrorMessage>{errors.regNo?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="gray.300">Admin Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Admin password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    placeholder="Enter admin password"
                    bg="gray.700"
                    border="1px"
                    borderColor="gray.600"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                    _focus={{ borderColor: 'red.400', boxShadow: '0 0 0 1px red.400' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      size="sm"
                      variant="ghost"
                      color="gray.400"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="red"
                width="100%"
                size={{ base: "md", md: "lg" }}
                isLoading={isSubmitting}
                loadingText="Authenticating..."
                leftIcon={<FiShield />}
                isDisabled={lockoutInfo?.isLocked}
              >
                Secure Admin Login
              </Button>
            </VStack>
          </form>

          <Divider my={{ base: 4, md: 6 }} borderColor="gray.600" />

          {/* Security Notice */}
          <Box textAlign="center">
            <Flex align="center" justify="center" gap={2} mb={2}>
              <Icon as={FiAlertCircle} color="yellow.400" />
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.400">
                Security Notice
              </Text>
            </Flex>
            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.500" lineHeight="shorter">
              • Admin sessions expire after 4 hours<br />
              • Maximum 3 login attempts allowed<br />
              • Failed attempts trigger 15-minute lockout<br />
              • All activities are logged and monitored
            </Text>
          </Box>
        </Box>
      </Container>
    </Flex>
  );
};

export default AdminLogin; 