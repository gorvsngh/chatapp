import React from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Code,
  Alert,
  AlertIcon,
  Flex,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiUser, FiCopy } from 'react-icons/fi';

interface TestUser {
  role: string;
  name: string;
  regNo: string;
  password: string;
  description: string;
}

const testUsers: TestUser[] = [
  {
    role: 'admin',
    name: 'Admin User',
    regNo: 'ADMIN001',
    password: 'admin123',
    description: 'Full admin access to dashboard and controls'
  },
  {
    role: 'faculty',
    name: 'Dr. Rajesh Kumar',
    regNo: 'TEACH001',
    password: 'faculty123',
    description: 'Faculty role with elevated permissions'
  },
  {
    role: 'hod',
    name: 'Dr. Amit Singh',
    regNo: 'HOD001',
    password: 'hod123',
    description: 'Head of Department with department-wide access'
  },
  {
    role: 'student',
    name: 'Rahul Verma',
    regNo: 'STU001',
    password: 'student123',
    description: 'Regular student account for testing'
  },
  {
    role: 'student',
    name: 'Anita Patel',
    regNo: 'STU002',
    password: 'student123',
    description: 'IT department student'
  }
];

const TestCredentials: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'hod': return 'purple';
      case 'faculty': return 'blue';
      case 'student': return 'green';
      default: return 'gray';
    }
  };

  const copyCredentials = (regNo: string, password: string) => {
    navigator.clipboard.writeText(`${regNo} / ${password}`);
    toast({
      title: 'Credentials Copied!',
      description: `${regNo} / ${password}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return (
    <>
      {/* Floating Test Button */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        zIndex={1000}
      >
        <Button
          onClick={onOpen}
          colorScheme="orange"
          size="sm"
          leftIcon={<FiUser />}
          shadow="lg"
          _hover={{ transform: 'scale(1.05)' }}
        >
          Test Users
        </Button>
      </Box>

      {/* Test Credentials Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            🧪 Test User Credentials
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <Alert status="info" mb={4} rounded="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Development Mode Only</Text>
                <Text fontSize="sm">
                  These are test accounts for development. Click to copy credentials.
                </Text>
              </Box>
            </Alert>

            <VStack spacing={3} align="stretch">
              {testUsers.map((user, index) => (
                <Box
                  key={index}
                  p={4}
                  border="1px"
                  borderColor="gray.200"
                  rounded="md"
                  _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                  onClick={() => copyCredentials(user.regNo, user.password)}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack>
                      <Badge colorScheme={getRoleBadgeColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                      <Text fontWeight="semibold">{user.name}</Text>
                    </HStack>
                    <Icon as={FiCopy} color="gray.400" />
                  </Flex>
                  
                  <HStack spacing={4} mb={2}>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Username</Text>
                      <Code fontSize="sm">{user.regNo}</Code>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Password</Text>
                      <Code fontSize="sm">{user.password}</Code>
                    </Box>
                  </HStack>
                  
                  <Text fontSize="xs" color="gray.600">
                    {user.description}
                  </Text>
                </Box>
              ))}
            </VStack>

            <Divider my={4} />

            <Box>
              <Text fontWeight="semibold" mb={2}>🔗 Quick Links:</Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm">
                  👤 <Code>http://localhost:5173/login</Code> - Regular Login
                </Text>
                <Text fontSize="sm">
                  🛡️ <Code>http://localhost:5173/admin-login</Code> - Admin Login
                </Text>
                <Text fontSize="sm">
                  📱 <Code>http://localhost:5173/groups</Code> - Main App
                </Text>
              </VStack>
            </Box>

            <Alert status="warning" mt={4} rounded="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" fontSize="sm">Generate Test Data</Text>
                <Text fontSize="xs">
                  Run <Code>npm run test-users</Code> in backend to create these users in database
                </Text>
              </Box>
            </Alert>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TestCredentials; 