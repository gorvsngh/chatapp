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
  Flex,
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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit2, FiMail, FiUser, FiBook, FiCalendar, FiCamera } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  if (!user) {
    return (
      <Container maxH="100vh" centerContent>
        <Box p={8} textAlign="center">
          <Text fontSize="lg" color="gray.500">
            You must be logged in to view your profile.
          </Text>
          <Button mt={4} onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }

  const handleSaveChanges = () => {
    // Here you would typically make an API call to update user profile
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setIsEditing(false);
    onClose();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'hod':
        return 'purple';
      case 'teacher':
        return 'blue';
      case 'student':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'hod':
        return 'Head of Department';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  return (
    <Box h="100vh" bg="gray.50" overflow="auto">
      {/* Header */}
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={4} py={3}>
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

      <Container maxW="2xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Profile Card */}
          <Card>
            <CardBody>
              <VStack spacing={6}>
                {/* Avatar Section */}
                <Box position="relative">
                  <Avatar
                    size="2xl"
                    name={user.name}
                    src={user.profilePic}
                    border="4px solid"
                    borderColor="brand.100"
                  />
                  <IconButton
                    aria-label="Change profile picture"
                    icon={<FiCamera />}
                    size="sm"
                    position="absolute"
                    bottom={0}
                    right={0}
                    borderRadius="full"
                    bg="brand.500"
                    color="white"
                    _hover={{ bg: 'brand.600' }}
                  />
                </Box>

                {/* Name and Role */}
                <VStack spacing={2}>
                  <Heading as="h1" size="xl" textAlign="center" color="gray.800">
                    {user.name}
                  </Heading>
                  <Badge
                    colorScheme={getRoleBadgeColor(user.role)}
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="600"
                  >
                    {formatRole(user.role)}
                  </Badge>
                </VStack>

                {/* Action Buttons */}
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FiEdit2 />}
                    variant="outline"
                    size="sm"
                    onClick={onOpen}
                  >
                    Edit Profile
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Registration Number</StatLabel>
                  <StatNumber fontSize="lg" color="gray.800">
                    {user.regNo}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>

            {user.department && (
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Department</StatLabel>
                    <StatNumber fontSize="lg" color="gray.800">
                      {user.department}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            )}

            {user.year && (
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor}>Year</StatLabel>
                    <StatNumber fontSize="lg" color="gray.800">
                      {user.year}
                    </StatNumber>
                    <StatHelpText>Academic Year</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            )}
          </SimpleGrid>

          {/* Contact Information */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading as="h2" size="md" color="gray.800">
                  Contact Information
                </Heading>
                <Divider />
                
                <HStack spacing={4}>
                  <Box
                    p={2}
                    bg="brand.50"
                    borderRadius="md"
                    color="brand.500"
                  >
                    <FiMail size={18} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color={textColor} fontWeight="500">
                      Email Address
                    </Text>
                    <Text fontSize="md" color="gray.800">
                      {user.email}
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={4}>
                  <Box
                    p={2}
                    bg="brand.50"
                    borderRadius="md"
                    color="brand.500"
                  >
                    <FiUser size={18} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color={textColor} fontWeight="500">
                      User ID
                    </Text>
                    <Text fontSize="md" color="gray.800" fontFamily="mono">
                      {user._id}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading as="h2" size="md" color="gray.800">
                  About
                </Heading>
                <Divider />
                <Text color={textColor} fontSize="sm" lineHeight="1.6">
                  This profile contains your basic information used for the chat application. 
                  You can update your profile information using the edit button above.
                </Text>
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