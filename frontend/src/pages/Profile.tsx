import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  Button,
  IconButton,
  Container,
  Card,
  CardBody,
  useColorModeValue,
  Badge,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit2, FiMail, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editedUser, setEditedUser] = useState(user);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  if (!user) {
    return (
      <Container maxH="100vh" centerContent>
        <Box p={6} textAlign="center">
          <Text fontSize="md" color="gray.500">
            You must be logged in to view your profile.
          </Text>
          <Button mt={3} size="sm" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }

  const handleSaveChanges = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'hod': return 'purple';
      case 'teacher': return 'blue';
      case 'student': return 'green';
      default: return 'gray';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'hod': return 'Head of Department';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  return (
    <Box h="100vh" bg="gray.50" overflow="auto">
      {/* Header */}
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={4} py={2}>
        <HStack>
          <IconButton
            aria-label="Go back"
            icon={<FiArrowLeft />}
            variant="ghost"
            size="sm"
            onClick={() => navigate('/groups')}
          />
          <Text fontSize="lg" fontWeight="600" color="gray.700">
            Profile
          </Text>
        </HStack>
      </Box>

      <Container maxW="lg" py={4}>
        <VStack spacing={4} align="stretch">
          {/* Main Profile Card */}
          <Card>
            <CardBody p={6}>
              <VStack spacing={4}>
                {/* Avatar and Basic Info */}
                <HStack spacing={4} w="full" align="start">
                  <Avatar
                    size="lg"
                    name={user.name}
                    src={user.profilePic}
                    border="2px solid"
                    borderColor="brand.100"
                  />
                  <VStack align="start" spacing={1} flex={1}>
                    <Heading as="h1" size="md" color="gray.800">
                      {user.name}
                    </Heading>
                    <Badge
                      colorScheme={getRoleBadgeColor(user.role)}
                      px={2}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      {formatRole(user.role)}
                    </Badge>
                    <Text fontSize="sm" color={textColor}>
                      {user.regNo}
                    </Text>
                  </VStack>
                  <Button
                    leftIcon={<FiEdit2 />}
                    variant="outline"
                    size="sm"
                    onClick={onOpen}
                  >
                    Edit
                  </Button>
                </HStack>

                <Divider />

                {/* Contact & Details */}
                <VStack spacing={3} align="stretch" w="full">
                  <HStack spacing={3}>
                    <Box color="brand.500">
                      <FiMail size={16} />
                    </Box>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" color={textColor} fontWeight="500">
                        Email
                      </Text>
                      <Text fontSize="sm" color="gray.800">
                        {user.email}
                      </Text>
                    </VStack>
                  </HStack>

                  {user.department && (
                    <HStack spacing={3}>
                      <Box color="brand.500">
                        <FiUser size={16} />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color={textColor} fontWeight="500">
                          Department {user.year && `• Year ${user.year}`}
                        </Text>
                        <Text fontSize="sm" color="gray.800">
                          {user.department}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Edit Profile Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={editedUser?.name || ''}
                  onChange={(e) => setEditedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  value={editedUser?.email || ''}
                  onChange={(e) => setEditedUser(prev => prev ? {...prev, email: e.target.value} : null)}
                />
              </FormControl>

              {editedUser?.department && (
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Input
                    value={editedUser.department}
                    onChange={(e) => setEditedUser(prev => prev ? {...prev, department: e.target.value} : null)}
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button bg="brand.500" color="white" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Profile; 