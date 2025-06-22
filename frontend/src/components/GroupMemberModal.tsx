import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  Button,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiUserPlus, FiUserMinus, FiMoreVertical } from 'react-icons/fi';
import { Group, User } from '../types';
import { userAPI, groupAPI } from '../services/api';

interface GroupMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onGroupUpdate?: (updatedGroup: Group) => void;
}

const GroupMemberModal: React.FC<GroupMemberModalProps> = ({
  isOpen,
  onClose,
  group,
  onGroupUpdate
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  
  const toast = useToast();
  const { isOpen: isRemoveAlertOpen, onOpen: onRemoveAlertOpen, onClose: onRemoveAlertClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
  }, [allUsers, searchQuery, selectedDepartment, selectedRole]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({ limit: 1000 });
      setAllUsers(response.users);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = allUsers.filter(user => {
      const isMember = group.members?.some(member => 
        member._id === user._id || member._id === user.id
      );
      return !isMember;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.regNo?.toLowerCase().includes(query)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleAddMember = async (user: User) => {
    try {
      await groupAPI.addMemberToGroup(group._id, user._id || user.id || '');
      
      const updatedGroup = {
        ...group,
        members: [...(group.members || []), user]
      };
      
      if (onGroupUpdate) {
        onGroupUpdate(updatedGroup);
      }

      toast({
        title: 'Member added successfully',
        description: `${user.name} has been added to ${group.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      filterUsers();
    } catch (error) {
      toast({
        title: 'Failed to add member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveMember = (member: User) => {
    setMemberToRemove(member);
    onRemoveAlertOpen();
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await groupAPI.removeMemberFromGroup(group._id, memberToRemove._id || memberToRemove.id || '');
      
      const updatedGroup = {
        ...group,
        members: group.members?.filter(member => 
          member._id !== memberToRemove._id && member._id !== memberToRemove.id
        ) || []
      };
      
      if (onGroupUpdate) {
        onGroupUpdate(updatedGroup);
      }

      toast({
        title: 'Member removed successfully',
        description: `${memberToRemove.name} has been removed from ${group.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      filterUsers();
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setMemberToRemove(null);
      onRemoveAlertClose();
    }
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
      case 'hod': return 'HOD';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            Manage Members - {group.name}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <Box
                p={3}
                bg="orange.50"
                border="1px solid"
                borderColor="orange.200"
                borderRadius="md"
              >
                <Text fontSize="sm" color="orange.700" fontWeight="500">
                  👨‍💼 Admin Panel: You can add/remove members for this group
                </Text>
              </Box>

              <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
                <Box flex="1">
                  <Text fontSize="lg" fontWeight="600" mb={4}>
                    Current Members ({group.members?.length || 0})
                  </Text>
                  <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                    {group.members?.map((member) => (
                      <HStack
                        key={member._id}
                        p={3}
                        bg={bgColor}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="md"
                        justify="space-between"
                      >
                        <HStack flex="1">
                          <Avatar size="sm" name={member.name} src={member.profilePic} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="600" fontSize="sm">
                              {member.name}
                            </Text>
                            <HStack spacing={2}>
                              <Badge
                                colorScheme={getRoleBadgeColor(member.role)}
                                size="sm"
                              >
                                {formatRole(member.role)}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                {member.regNo}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                        
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="Member options"
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem 
                              icon={<FiUserMinus />} 
                              onClick={() => handleRemoveMember(member)}
                              color="red.500"
                            >
                              Remove from Group
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    )) || []}
                  </VStack>
                </Box>

                <Divider orientation="vertical" />

                <Box flex="1">
                  <Text fontSize="lg" fontWeight="600" mb={4}>
                    Add New Members
                  </Text>
                  
                  <VStack spacing={3} mb={4}>
                    <InputGroup>
                      <InputLeftElement>
                        <SearchIcon color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search by name, email, or reg no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                    
                    <HStack w="full" spacing={3}>
                      <Select
                        placeholder="All Departments"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics</option>
                      </Select>
                      
                      <Select
                        placeholder="All Roles"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="hod">HOD</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </HStack>
                  </VStack>

                  {loading ? (
                    <Center py={8}>
                      <Spinner size="lg" />
                    </Center>
                  ) : (
                    <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                      {filteredUsers.map((user) => (
                        <HStack
                          key={user._id}
                          p={3}
                          bg={bgColor}
                          border="1px solid"
                          borderColor={borderColor}
                          borderRadius="md"
                          justify="space-between"
                        >
                          <HStack flex="1">
                            <Avatar size="sm" name={user.name} src={user.profilePic} />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="600" fontSize="sm">
                                {user.name}
                              </Text>
                              <HStack spacing={2}>
                                <Badge
                                  colorScheme={getRoleBadgeColor(user.role)}
                                  size="sm"
                                >
                                  {formatRole(user.role)}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {user.regNo}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                          
                          <Button
                            leftIcon={<FiUserPlus />}
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleAddMember(user)}
                          >
                            Add
                          </Button>
                        </HStack>
                      ))}
                      
                      {filteredUsers.length === 0 && !loading && (
                        <Center py={8}>
                          <Text color="gray.500">
                            {searchQuery || selectedDepartment || selectedRole 
                              ? 'No users found with current filters' 
                              : 'All users are already members of this group'
                            }
                          </Text>
                        </Center>
                      )}
                    </VStack>
                  )}
                </Box>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isRemoveAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Member
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from{' '}
              <strong>{group.name}</strong>? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRemoveAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmRemoveMember} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GroupMemberModal; 