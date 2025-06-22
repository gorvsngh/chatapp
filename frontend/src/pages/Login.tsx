import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Link as ChakraLink,
  Checkbox,
  FormErrorMessage,
  Flex,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoginFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();
  const { login } = useAuth();
  const toast = useToast();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex h="100vh" align="center" justify="center" bg="#fafafa">
      <Container maxW="container.sm">
        <Box bg="white" p={8} rounded="lg" shadow="base">
          <VStack spacing={6}>
            <Heading color="whatsapp.500">Welcome Back</Heading>
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.regNo}>
                  <FormLabel>Registration Number</FormLabel>
                  <Input
                    {...register('regNo', {
                      required: 'Registration number is required',
                      pattern: {
                        value: /^[A-Z0-9]+$/,
                        message: 'Invalid registration number format',
                      },
                    })}
                    placeholder="Enter your registration number"
                  />
                  <FormErrorMessage>{errors.regNo?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    placeholder="Enter your password"
                  />
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <Checkbox
                    colorScheme="whatsapp"
                  >
                    Remember me
                  </Checkbox>
                </FormControl>

                <Button
                  type="submit"
                  variant="whatsapp"
                  width="100%"
                  isLoading={isSubmitting}
                >
                  Login
                </Button>
              </VStack>
            </form>

            <Text>
              Don't have an account?{' '}
              <ChakraLink as={RouterLink} to="/register" color="whatsapp.500">
                Register here
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default Login; 