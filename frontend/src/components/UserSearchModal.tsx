import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  useToast,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiMessageCircle, FiUser, FiBook } from 'react-icons/fi';
import { User } from '../types';
import { userAPI } from '../services/api';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: User) => void;
  currentUser: User;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    role: '',
  });

  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers({
        page: 1,
        limit: 50,
        department: filters.department || undefined,
        year: filters.year ? parseInt(filters.year) : undefined,
        role: filters.role || undefined,
      });
      setAllUsers(response.users);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const users = await userAPI.searchUsers(searchQuery);
      setSearchResults(users);
    } catch (error) {
      toast({
        title: 'Error searching users',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    onClose();
    toast({
      title: 'Starting conversation',
      description: `Opening chat with ${user.name}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
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
        return 'HOD';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      default:
        return role;
    }
  };

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card borderColor={borderColor} _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
      <CardBody>
        <Flex justify="space-between" align="center">
          <HStack spacing={3} flex="1">
            <Avatar
              size="md"
              name={user.name}
              src={user.profilePic}
              border="2px solid"
              borderColor="brand.100"
            />
            
            <VStack align="start" spacing={1} flex="1">
              <Text fontWeight="600" fontSize="md" color="gray.800">
                {user.name}
              </Text>
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">
                  {user.regNo}
                </Text>
                <Badge
                  colorScheme={getRoleBadgeColor(user.role)}
                  size="sm"
                  variant="subtle"
                >
                  {formatRole(user.role)}
                </Badge>
              </HStack>
              {user.department && (
                <HStack spacing={1} color="gray.500" fontSize="sm">
                  <FiBook />
                  <Text>
                    {user.department}
                    {user.year && ` • Year ${user.year}`}
                  </Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          
          <Button
            leftIcon={<FiMessageCircle />}
            colorScheme="brand"
            size="sm"
            onClick={() => handleUserSelect(user)}
          >
            Message
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <Flex align="center">
            <FiUser style={{ marginRight: '8px' }} />
            <Text>Find People</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <Tabs>
            <TabList>
              <Tab>Search</Tab>
              <Tab>Browse All</Tab>
            </TabList>

            <TabPanels>
              {/* Search Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <InputGroup>
                    <InputLeftElement>
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by name or registration number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>

                  {loading ? (
                    <Center py={8}>
                      <Spinner size="lg" color="brand.500" />
                    </Center>
                  ) : searchResults.length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.500">
                        Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                      </Text>
                      {searchResults.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))}
                    </VStack>
                  ) : searchQuery.trim().length >= 2 ? (
                    <Center py={8}>
                      <VStack spacing={2}>
                        <Text color="gray.500">No users found</Text>
                        <Text fontSize="sm" color="gray.400">
                          Try searching with a different name or registration number
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Center py={8}>
                      <Text color="gray.500" fontSize="sm">
                        Type at least 2 characters to search
                      </Text>
                    </Center>
                  )}
                </VStack>
              </TabPanel>

              {/* Browse All Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {/* Filters */}
                  <HStack spacing={3}>
                    <Select
                      placeholder="Department"
                      size="sm"
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Electrical">Electrical</option>
                    </Select>
                    <Select
                      placeholder="Year"
                      size="sm"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </Select>
                    <Select
                      placeholder="Role"
                      size="sm"
                      value={filters.role}
                      onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="hod">HOD</option>
                    </Select>
                  </HStack>

                  <Button size="sm" onClick={fetchAllUsers} isLoading={loading}>
                    Apply Filters
                  </Button>

                  {loading ? (
                    <Center py={8}>
                      <Spinner size="lg" color="brand.500" />
                    </Center>
                  ) : allUsers.length > 0 ? (
                    <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                      <Text fontSize="sm" color="gray.500">
                        Showing {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
                      </Text>
                      {allUsers.map((user) => (
                        <UserCard key={user._id} user={user} />
                      ))}
                    </VStack>
                  ) : (
                    <Center py={8}>
                      <Text color="gray.500">No users found with current filters</Text>
                    </Center>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserSearchModal; 