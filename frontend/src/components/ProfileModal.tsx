import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Avatar,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  Button,
  Badge,
  Input,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  Box,
  useDisclosure,
} from '@chakra-ui/react';
import { FiEdit2, FiMail, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToView?: User; // For admin to view/edit other users
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userToView }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  // Use userToView if provided (for admin), otherwise current user
  const displayUser = userToView || user;
  const [editedUser, setEditedUser] = useState<User | null>(displayUser);

  // Update editedUser when displayUser changes
  React.useEffect(() => {
    setEditedUser(displayUser);
  }, [displayUser]);

  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin; // Only admin can edit profiles

  if (!user || !displayUser) return null;

  const handleSaveChanges = () => {
    // Here you would make API call to update user profile
    // For now, just show success message
    toast({
      title: 'Profile updated',
      description: `${displayUser.name}'s profile has been updated successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onEditClose();
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
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {userToView && isAdmin ? `${displayUser.name}'s Profile` : 'Profile'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              {/* Admin Notice */}
              {userToView && isAdmin && (
                <Box
                  p={3}
                  bg="orange.50"
                  border="1px solid"
                  borderColor="orange.200"
                  borderRadius="md"
                  w="full"
                >
                  <Text fontSize="sm" color="orange.700" fontWeight="500">
                    👨‍💼 Admin View: You are viewing {displayUser.name}'s profile
                  </Text>
                </Box>
              )}
              
              {/* Regular User Notice */}
              {!isAdmin && !userToView && (
                <Box
                  p={3}
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                  borderRadius="md"
                  w="full"
                >
                  <Text fontSize="sm" color="blue.700" fontWeight="500">
                    ℹ️ Profile changes can only be made by administrators
                  </Text>
                </Box>
              )}
              
              {/* Avatar and Basic Info */}
              <HStack spacing={4} w="full" align="start">
                <Avatar
                  size="lg"
                  name={displayUser.name}
                  src={displayUser.profilePic}
                  border="2px solid"
                  borderColor="brand.100"
                />
                <VStack align="start" spacing={1} flex={1}>
                  <Heading as="h1" size="md" color="gray.800">
                    {displayUser.name}
                  </Heading>
                  <Badge
                    colorScheme={getRoleBadgeColor(displayUser.role)}
                    px={2}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {formatRole(displayUser.role)}
                  </Badge>
                  <Text fontSize="sm" color={textColor}>
                    {displayUser.regNo}
                  </Text>
                </VStack>
                {canEdit && (
                  <Button
                    leftIcon={<FiEdit2 />}
                    variant="outline"
                    size="sm"
                    onClick={onEditOpen}
                  >
                    Edit
                  </Button>
                )}
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
                      {displayUser.email}
                    </Text>
                  </VStack>
                </HStack>

                {displayUser.department && (
                  <HStack spacing={3}>
                    <Box color="brand.500">
                      <FiUser size={16} />
                    </Box>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="xs" color={textColor} fontWeight="500">
                        Department {displayUser.year && `• Year ${displayUser.year}`}
                      </Text>
                      <Text fontSize="sm" color="gray.800">
                        {displayUser.department}
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {userToView && isAdmin ? `Edit ${displayUser.name}'s Profile` : 'Edit Profile'}
          </ModalHeader>
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
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button bg="brand.500" color="white" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal; 