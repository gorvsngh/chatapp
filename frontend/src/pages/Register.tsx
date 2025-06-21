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
  Select,
  FormErrorMessage,
  Flex,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { RegisterFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
];

const Register: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();
  const { register: registerUser } = useAuth();
  const toast = useToast();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex h="100vh" align="center" justify="center" bg="#fafafa" py={4}>
      <Container maxW="container.sm" h="100%">
        <Flex h="100%" align="center" justify="center">
          <Box 
            bg="white" 
            p={8} 
            rounded="lg" 
            shadow="base" 
            w="100%" 
            maxH="95vh"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(155, 155, 155, 0.5)',
                borderRadius: '20px',
              },
            }}
          >
            <VStack spacing={6}>
              <Heading color="whatsapp.500">Create Account</Heading>
              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.name}>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 3,
                          message: 'Name must be at least 3 characters',
                        },
                      })}
                    />
                    <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                  </FormControl>

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
                    />
                    <FormErrorMessage>{errors.regNo?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.department}>
                    <FormLabel>Department</FormLabel>
                    <Select
                      {...register('department', {
                        required: 'Department is required',
                      })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.department?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.year}>
                    <FormLabel>Year</FormLabel>
                    <Select
                      {...register('year', {
                        required: 'Year is required',
                      })}
                    >
                      <option value="">Select Year</option>
                      {[1, 2, 3, 4].map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.year?.message}</FormErrorMessage>
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
                    />
                    <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === password || 'Passwords do not match',
                      })}
                    />
                    <FormErrorMessage>
                      {errors.confirmPassword?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="whatsapp"
                    width="100%"
                    isLoading={isSubmitting}
                  >
                    Register
                  </Button>
                </VStack>
              </form>

              <Text>
                Already have an account?{' '}
                <ChakraLink as={RouterLink} to="/login" color="whatsapp.500">
                  Login here
                </ChakraLink>
              </Text>
            </VStack>
          </Box>
        </Flex>
      </Container>
    </Flex>
  );
};

export default Register; 