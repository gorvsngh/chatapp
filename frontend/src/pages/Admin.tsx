import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  HStack,
  VStack,
  Text,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Icon,
  Spinner,
  Center,
  useColorModeValue,
  Divider,
  Progress,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiHash,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiBarChart,
  FiPlus,
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiUserPlus,
  FiUserMinus,
  FiMoreVertical,
} from 'react-icons/fi';
import { adminAPI, userAPI, groupAPI } from '../services/api';
import { User, Group, Message } from '../types';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalGroups: number;
    totalMessages: number;
  };
  usersByRole: Record<string, number>;
  groupsByType: Record<string, number>;
  messagesByDate: Array<{ _id: string; count: number }>;
  recentActivity: Message[];
}

const Admin: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Pagination states
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [groupPagination, setGroupPagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [messagePagination, setMessagePagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [userFilters, setUserFilters] = useState({ search: '', role: '', department: '' });
  const [groupFilters, setGroupFilters] = useState({ search: '', type: '', department: '' });
  const [messageFilters, setMessageFilters] = useState({ groupId: '', senderId: '' });

  // Modals
  const { isOpen: isEditUserOpen, onOpen: onEditUserOpen, onClose: onEditUserClose } = useDisclosure();
  const { isOpen: isEditGroupOpen, onOpen: onEditGroupOpen, onClose: onEditGroupClose } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const { isOpen: isCreateUserOpen, onOpen: onCreateUserOpen, onClose: onCreateUserClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isMemberModalOpen, onOpen: onMemberModalOpen, onClose: onMemberModalClose } = useDisclosure();

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Member management state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const stats = await adminAPI.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      toast({
        title: 'Error loading dashboard stats',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load users with pagination
  const loadUsers = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = { page, limit: 20 };
      if (userFilters.role) params.role = userFilters.role;
      if (userFilters.department) params.department = userFilters.department;
      if (userFilters.search) params.search = userFilters.search;
      
      const response = await adminAPI.getUsers(params);
      
      if (append) {
        setUsers(prev => [...prev, ...response.users]);
      } else {
        setUsers(response.users);
      }
      
      setUserPagination({
        page: response.page,
        totalPages: response.pages,
        total: response.total,
        hasMore: response.page < response.pages
      });
    } catch (error) {
      toast({
        title: 'Error loading users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load groups with pagination
  const loadGroups = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = { page, limit: 20 };
      if (groupFilters.type) params.type = groupFilters.type;
      if (groupFilters.department) params.department = groupFilters.department;
      if (groupFilters.search) params.search = groupFilters.search;
      
      const response = await adminAPI.getGroups(params);
      
      if (append) {
        setGroups(prev => [...prev, ...response.groups]);
      } else {
        setGroups(response.groups);
      }
      
      setGroupPagination({
        page: response.page,
        totalPages: response.pages,
        total: response.total,
        hasMore: response.page < response.pages
      });
    } catch (error) {
      toast({
        title: 'Error loading groups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load messages with pagination
  const loadMessages = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params: any = { page, limit: 20 };
      if (messageFilters.groupId) params.groupId = messageFilters.groupId;
      if (messageFilters.senderId) params.senderId = messageFilters.senderId;
      
      const response = await adminAPI.getMessages(params);
      
      if (append) {
        setMessages(prev => [...prev, ...response.messages]);
      } else {
        setMessages(response.messages);
      }
      
      setMessagePagination({
        page: response.page,
        totalPages: response.pages,
        total: response.total,
        hasMore: response.page < response.pages
      });
    } catch (error) {
      toast({
        title: 'Error loading messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle user update
  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return;

    try {
      await adminAPI.updateUser(selectedUser._id, userData);
      toast({
        title: 'User updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditUserClose();
      loadUsers(1, false);
    } catch (error) {
      toast({
        title: 'Error updating user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle group update
  const handleUpdateGroup = async (groupData: any) => {
    if (!selectedGroup) return;

    try {
      await adminAPI.updateGroup(selectedGroup._id, groupData);
      toast({
        title: 'Group updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditGroupClose();
      loadGroups(1, false);
    } catch (error) {
      toast({
        title: 'Error updating group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle user creation
  const handleCreateUser = async (userData: any) => {
    try {
      await adminAPI.createUser(userData);
      toast({
        title: 'User created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCreateUserClose();
      loadUsers(1, false);
    } catch (error) {
      toast({
        title: 'Error creating user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const results = await adminAPI.uploadUsers(uploadFile);
      setUploadResults(results);
      toast({
        title: 'File uploaded successfully',
        description: results.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      loadUsers(1, false);
    } catch (error: any) {
      toast({
        title: 'Error uploading file',
        description: error.response?.data?.msg || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResults(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget && !memberToRemove) return;

    try {
      if (memberToRemove && selectedGroup) {
        // Handle member removal
        await handleRemoveMember(memberToRemove);
        setMemberToRemove(null);
      } else if (deleteTarget) {
        // Handle other deletions
      if (deleteTarget.type === 'user') {
        await adminAPI.deleteUser(deleteTarget.id);
        loadUsers(1, false);
      } else if (deleteTarget.type === 'group') {
        await adminAPI.deleteGroup(deleteTarget.id);
        loadGroups(1, false);
      } else if (deleteTarget.type === 'message') {
        await adminAPI.deleteMessage(deleteTarget.id);
        loadMessages(1, false);
      }

      toast({
        title: `${deleteTarget.type} deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDeleteTarget(null);
      }

      handleDeleteClose();
    } catch (error) {
      toast({
        title: `Error deleting ${deleteTarget?.type || 'member'}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const getGroupTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'department': return 'blue';
      case 'class': return 'green';
      case 'general': return 'gray';
      default: return 'gray';
    }
  };

  // Member management functions
  const fetchAllUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({ limit: 1000 });
      setAllUsers(response.users);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddMember = async (user: User) => {
    if (!selectedGroup) return;
    
    try {
      await groupAPI.addMemberToGroup(selectedGroup._id, user._id || user.id || '');
      
      // Update the group in the groups list
      setGroups(prev => prev.map(g => 
        g._id === selectedGroup._id 
          ? { ...g, members: [...(g.members || []), user] }
          : g
      ));

      // Update selected group
      setSelectedGroup(prev => prev ? { ...prev, members: [...(prev.members || []), user] } : null);

      toast({
        title: 'Member added successfully',
        description: `${user.name} has been added to ${selectedGroup.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to add member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveMember = async (member: User) => {
    if (!selectedGroup) return;

    try {
      await groupAPI.removeMemberFromGroup(selectedGroup._id, member._id || member.id || '');
      
      // Update the group in the groups list
      setGroups(prev => prev.map(g => 
        g._id === selectedGroup._id 
          ? { ...g, members: g.members?.filter(m => m._id !== member._id && m._id !== member.id) || [] }
          : g
      ));

      // Update selected group
      setSelectedGroup(prev => prev ? { 
        ...prev, 
        members: prev.members?.filter(m => m._id !== member._id && m._id !== member.id) || [] 
      } : null);

      toast({
        title: 'Member removed successfully',
        description: `${member.name} has been removed from ${selectedGroup.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openMemberModal = (group: Group) => {
    setSelectedGroup(group);
    fetchAllUsers();
    onMemberModalOpen();
  };

  const handleDeleteClose = () => {
    setMemberToRemove(null);
    setDeleteTarget(null);
    onDeleteClose();
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      loadUsers(1, false);
    }
  }, [activeTab, userFilters]);

  useEffect(() => {
    if (activeTab === 2) {
      loadGroups(1, false);
    }
  }, [activeTab, groupFilters]);

  useEffect(() => {
    if (activeTab === 3) {
      loadMessages(1, false);
    }
  }, [activeTab, messageFilters]);

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="full" p={0}>
        <Box bg="white" px={6} py={4} borderBottom="1px" borderColor={borderColor}>
          <Heading size="lg" color="gray.800">
            Admin Panel
          </Heading>
        </Box>

        <Box p={6}>
          <Tabs index={activeTab} onChange={setActiveTab} colorScheme="blue">
            <TabList>
              <Tab>
                <Icon as={FiBarChart} mr={2} />
                Dashboard
              </Tab>
              <Tab>
                <Icon as={FiUsers} mr={2} />
                Users
              </Tab>
              <Tab>
                <Icon as={FiHash} mr={2} />
                Groups
              </Tab>
              <Tab>
                <Icon as={FiMessageSquare} mr={2} />
                Messages
              </Tab>
            </TabList>

            <TabPanels>
              {/* Dashboard Panel */}
              <TabPanel>
                {loading ? (
                  <Center py={10}>
                    <Spinner size="lg" />
                  </Center>
                ) : dashboardStats ? (
                  <VStack spacing={6} align="stretch">
                    {/* Overview Stats */}
                    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                      <Card bg={cardBg}>
                        <CardBody>
                          <Stat>
                            <StatLabel>Total Users</StatLabel>
                            <StatNumber>{dashboardStats.overview.totalUsers}</StatNumber>
                            <StatHelpText>Registered users</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                      <Card bg={cardBg}>
                        <CardBody>
                          <Stat>
                            <StatLabel>Total Groups</StatLabel>
                            <StatNumber>{dashboardStats.overview.totalGroups}</StatNumber>
                            <StatHelpText>Active groups</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                      <Card bg={cardBg}>
                        <CardBody>
                          <Stat>
                            <StatLabel>Total Messages</StatLabel>
                            <StatNumber>{dashboardStats.overview.totalMessages}</StatNumber>
                            <StatHelpText>All time messages</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                    </Grid>

                    {/* Users by Role */}
                    <Card bg={cardBg}>
                      <CardBody>
                        <Heading size="md" mb={4}>Users by Role</Heading>
                        <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                          {Object.entries(dashboardStats.usersByRole).map(([role, count]) => (
                            <Box key={role} textAlign="center">
                              <Badge colorScheme={getRoleBadgeColor(role)} size="lg" mb={2}>
                                {role}
                              </Badge>
                              <Text fontSize="2xl" fontWeight="bold">{count}</Text>
                            </Box>
                          ))}
                        </Grid>
                      </CardBody>
                    </Card>

                    {/* Recent Activity */}
                    <Card bg={cardBg}>
                      <CardBody>
                        <Heading size="md" mb={4}>Recent Activity</Heading>
                        <VStack spacing={3} align="stretch">
                          {dashboardStats.recentActivity.map((message) => (
                            <Box key={message._id} p={3} bg="gray.50" borderRadius="md">
                              <HStack>
                                <Avatar size="sm" name={message.senderId.name} />
                                <VStack align="start" spacing={0} flex={1}>
                                  <Text fontWeight="semibold" fontSize="sm">
                                    {message.senderId.name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                    {message.text}
                                  </Text>
                                </VStack>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </Text>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                ) : null}
              </TabPanel>

              {/* Users Panel */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Actions */}
                  <Card bg={cardBg}>
                    <CardBody>
                      <HStack spacing={4} justify="space-between">
                        <HStack spacing={4}>
                          <Button
                            leftIcon={<Icon as={FiPlus} />}
                            colorScheme="blue"
                            onClick={onCreateUserOpen}
                          >
                            Create User
                          </Button>
                          <Button
                            leftIcon={<Icon as={FiUpload} />}
                            colorScheme="green"
                            onClick={onUploadOpen}
                          >
                            Upload from Google Sheets
                          </Button>
                        </HStack>
                      </HStack>
                    </CardBody>
                  </Card>

                  {/* Filters */}
                  <Card bg={cardBg}>
                    <CardBody>
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <InputGroup>
                          <InputLeftElement>
                            <Icon as={FiSearch} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search users..."
                            value={userFilters.search}
                            onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
                          />
                        </InputGroup>
                        <Select
                          placeholder="Filter by role"
                          value={userFilters.role}
                          onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                        >
                          <option value="admin">Admin</option>
                          <option value="hod">HOD</option>
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                        </Select>
                        <Input
                          placeholder="Filter by department"
                          value={userFilters.department}
                          onChange={(e) => setUserFilters({...userFilters, department: e.target.value})}
                        />
                      </Grid>
                    </CardBody>
                  </Card>

                  {/* Users Table */}
                  <Card bg={cardBg}>
                    <CardBody>
                      {loading ? (
                        <Center py={10}>
                          <Spinner size="lg" />
                        </Center>
                      ) : (
                        <>
                          <Box maxH="600px" overflowY="auto">
                            <Table variant="simple">
                              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                                <Tr>
                                  <Th>User</Th>
                                  <Th>Reg No</Th>
                                  <Th>Role</Th>
                                  <Th>Department</Th>
                                  <Th>Year</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {users.map((user) => (
                                  <Tr key={user._id} _hover={{ bg: 'gray.50' }}>
                                    <Td>
                                      <HStack>
                                        <Avatar size="sm" name={user.name} />
                                        <VStack align="start" spacing={0}>
                                          <Text fontWeight="medium">{user.name}</Text>
                                          <Text fontSize="xs" color="gray.500">{user.email}</Text>
                                        </VStack>
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <Text fontFamily="mono" fontSize="sm">{user.regNo}</Text>
                                    </Td>
                                    <Td>
                                      <Badge 
                                        colorScheme={getRoleBadgeColor(user.role)}
                                        variant="subtle"
                                        px={2}
                                        py={1}
                                        borderRadius="md"
                                      >
                                        {user.role.toUpperCase()}
                                      </Badge>
                                    </Td>
                                    <Td>
                                      <Text fontSize="sm">{user.department || 'N/A'}</Text>
                                    </Td>
                                    <Td>
                                      <Text fontSize="sm">{user.year || 'N/A'}</Text>
                                    </Td>
                                    <Td>
                                      <HStack spacing={2}>
                                        <Button
                                          size="sm"
                                          leftIcon={<Icon as={FiEdit} />}
                                          colorScheme="blue"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedUser(user);
                                            onEditUserOpen();
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          colorScheme="red"
                                          variant="outline"
                                          leftIcon={<Icon as={FiTrash2} />}
                                          onClick={() => {
                                            setDeleteTarget({ type: 'user', id: user._id || '', name: user.name });
                                            onDeleteOpen();
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </HStack>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          
                          {/* Pagination Info and Load More */}
                          <Box mt={4} pt={4} borderTop="1px" borderColor="gray.200">
                            <HStack justify="space-between" align="center">
                              <Text fontSize="sm" color="gray.600">
                                Showing {users.length} of {userPagination.total} users
                              </Text>
                              {userPagination.hasMore && (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  isLoading={loadingMore}
                                  onClick={() => loadUsers(userPagination.page + 1, true)}
                                >
                                  Load More
                                </Button>
                              )}
                            </HStack>
                            {loadingMore && (
                              <Center mt={4}>
                                <Spinner size="sm" />
                              </Center>
                            )}
                          </Box>
                        </>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Groups Panel */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Card bg={cardBg}>
                    <CardBody>
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <InputGroup>
                          <InputLeftElement>
                            <Icon as={FiSearch} />
                          </InputLeftElement>
                          <Input
                            placeholder="Search groups..."
                            value={groupFilters.search}
                            onChange={(e) => setGroupFilters({...groupFilters, search: e.target.value})}
                          />
                        </InputGroup>
                        <Select
                          placeholder="Filter by type"
                          value={groupFilters.type}
                          onChange={(e) => setGroupFilters({...groupFilters, type: e.target.value})}
                        >
                          <option value="department">Department</option>
                          <option value="class">Class</option>
                          <option value="general">General</option>
                        </Select>
                      </Grid>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardBody>
                      {loading ? (
                        <Center py={10}>
                          <Spinner size="lg" />
                        </Center>
                      ) : (
                        <>
                          <Box maxH="600px" overflowY="auto">
                            <Table variant="simple">
                              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                                <Tr>
                                  <Th>Group Details</Th>
                                  <Th>Type</Th>
                                  <Th>Department</Th>
                                  <Th>Members</Th>
                                  <Th>Created By</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {groups.map((group) => (
                                  <Tr key={group._id} _hover={{ bg: 'gray.50' }}>
                                    <Td>
                                      <VStack align="start" spacing={1}>
                                        <Text fontWeight="semibold" fontSize="md">{group.name}</Text>
                                        <Text fontSize="sm" color="gray.600" noOfLines={2} maxW="300px">
                                          {group.description || 'No description'}
                                        </Text>
                                        <Text fontSize="xs" color="gray.400">
                                          Created: {new Date(group.createdAt).toLocaleDateString()}
                                        </Text>
                                      </VStack>
                                    </Td>
                                    <Td>
                                      <Badge 
                                        colorScheme={getGroupTypeBadgeColor(group.type)}
                                        variant="subtle"
                                        px={2}
                                        py={1}
                                        borderRadius="md"
                                      >
                                        {group.type.toUpperCase()}
                                      </Badge>
                                    </Td>
                                    <Td>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm">{group.department || 'N/A'}</Text>
                                        {group.year && (
                                          <Text fontSize="xs" color="gray.500">Year {group.year}</Text>
                                        )}
                                      </VStack>
                                    </Td>
                                    <Td>
                                      <HStack>
                                        <Badge colorScheme="green" variant="solid" borderRadius="full">
                                          {group.members?.length || 0}
                                        </Badge>
                                        <Text fontSize="sm" color="gray.600">members</Text>
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <HStack>
                                        <Avatar size="xs" name={group.createdBy?.name} />
                                        <VStack align="start" spacing={0}>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {group.createdBy?.name}
                                          </Text>
                                          <Badge size="xs" colorScheme={getRoleBadgeColor(group.createdBy?.role || '')}>
                                            {group.createdBy?.role}
                                          </Badge>
                                        </VStack>
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <VStack spacing={2} align="start">
                                        <HStack spacing={1}>
                                          <Button
                                            size="xs"
                                            leftIcon={<Icon as={FiUsers} />}
                                            colorScheme="blue"
                                            variant="outline"
                                            onClick={() => openMemberModal(group)}
                                          >
                                            Members
                                          </Button>
                                          <Button
                                            size="xs"
                                            leftIcon={<Icon as={FiEdit} />}
                                            colorScheme="green"
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedGroup(group);
                                              onEditGroupOpen();
                                            }}
                                          >
                                            Edit
                                          </Button>
                                        </HStack>
                                        <Button
                                          size="xs"
                                          colorScheme="red"
                                          variant="outline"
                                          leftIcon={<Icon as={FiTrash2} />}
                                          onClick={() => {
                                            setDeleteTarget({ type: 'group', id: group._id, name: group.name });
                                            onDeleteOpen();
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </VStack>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          
                          {/* Pagination Info and Load More */}
                          <Box mt={4} pt={4} borderTop="1px" borderColor="gray.200">
                            <HStack justify="space-between" align="center">
                              <Text fontSize="sm" color="gray.600">
                                Showing {groups.length} of {groupPagination.total} groups
                              </Text>
                              {groupPagination.hasMore && (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  isLoading={loadingMore}
                                  onClick={() => loadGroups(groupPagination.page + 1, true)}
                                >
                                  Load More
                                </Button>
                              )}
                            </HStack>
                            {loadingMore && (
                              <Center mt={4}>
                                <Spinner size="sm" />
                              </Center>
                            )}
                          </Box>
                        </>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Messages Panel */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Card bg={cardBg}>
                    <CardBody>
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <Input
                          placeholder="Filter by Group ID"
                          value={messageFilters.groupId}
                          onChange={(e) => setMessageFilters({...messageFilters, groupId: e.target.value})}
                        />
                        <Input
                          placeholder="Filter by Sender ID"
                          value={messageFilters.senderId}
                          onChange={(e) => setMessageFilters({...messageFilters, senderId: e.target.value})}
                        />
                      </Grid>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardBody>
                      {loading ? (
                        <Center py={10}>
                          <Spinner size="lg" />
                        </Center>
                      ) : (
                        <>
                          <Box maxH="600px" overflowY="auto">
                            <Table variant="simple">
                              <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
                                <Tr>
                                  <Th>Sender</Th>
                                  <Th>Group</Th>
                                  <Th>Message Content</Th>
                                  <Th>Timestamp</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {messages.map((message) => (
                                  <Tr key={message._id} _hover={{ bg: 'gray.50' }}>
                                    <Td>
                                      <HStack>
                                        <Avatar size="sm" name={message.senderId.name} />
                                        <VStack align="start" spacing={1}>
                                          <Text fontSize="sm" fontWeight="semibold">
                                            {message.senderId.name}
                                          </Text>
                                          <HStack spacing={1}>
                                            <Badge size="xs" colorScheme={getRoleBadgeColor(message.senderId.role)}>
                                              {message.senderId.role}
                                            </Badge>
                                            <Text fontSize="xs" color="gray.500">
                                              {message.senderId.regNo}
                                            </Text>
                                          </HStack>
                                        </VStack>
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <VStack align="start" spacing={1}>
                                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                          {(message as any).groupId?.name || 'Unknown Group'}
                                        </Text>
                                        <Badge size="xs" colorScheme="blue" variant="outline">
                                          {(message as any).groupId?.type || 'N/A'}
                                        </Badge>
                                      </VStack>
                                    </Td>
                                    <Td>
                                      <Box bg="gray.50" p={3} borderRadius="md" maxW="400px">
                                        <Text fontSize="sm" noOfLines={3} whiteSpace="pre-wrap">
                                          {message.text}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                          {message.text.length} characters
                                        </Text>
                                      </Box>
                                    </Td>
                                    <Td>
                                      <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium">
                                          {new Date(message.timestamp).toLocaleDateString()}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {new Date(message.timestamp).toLocaleTimeString()}
                                        </Text>
                                        <Text fontSize="xs" color="gray.400">
                                          {(() => {
                                            const now = new Date();
                                            const msgDate = new Date(message.timestamp);
                                            const diffTime = Math.abs(now.getTime() - msgDate.getTime());
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return `${diffDays} days ago`;
                                          })()}
                                        </Text>
                                      </VStack>
                                    </Td>
                                    <Td>
                                      <Button
                                        size="sm"
                                        colorScheme="red"
                                        variant="outline"
                                        leftIcon={<Icon as={FiTrash2} />}
                                        onClick={() => {
                                          setDeleteTarget({ 
                                            type: 'message', 
                                            id: message._id, 
                                            name: `Message from ${message.senderId.name}` 
                                          });
                                          onDeleteOpen();
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          
                          {/* Pagination Info and Load More */}
                          <Box mt={4} pt={4} borderTop="1px" borderColor="gray.200">
                            <HStack justify="space-between" align="center">
                              <Text fontSize="sm" color="gray.600">
                                Showing {messages.length} of {messagePagination.total} messages
                              </Text>
                              {messagePagination.hasMore && (
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  isLoading={loadingMore}
                                  onClick={() => loadMessages(messagePagination.page + 1, true)}
                                >
                                  Load More
                                </Button>
                              )}
                            </HStack>
                            {loadingMore && (
                              <Center mt={4}>
                                <Spinner size="sm" />
                              </Center>
                            )}
                          </Box>
                        </>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

      {/* Edit User Modal */}
      <Modal isOpen={isEditUserOpen} onClose={onEditUserClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <EditUserForm
                user={selectedUser}
                onSubmit={handleUpdateUser}
                onCancel={onEditUserClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Group Modal */}
      <Modal isOpen={isEditGroupOpen} onClose={onEditGroupClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedGroup && (
              <EditGroupForm
                group={selectedGroup}
                onSubmit={handleUpdateGroup}
                onCancel={onEditGroupClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {memberToRemove ? 'Remove Member' : `Delete ${deleteTarget?.type}`}
            </AlertDialogHeader>
            <AlertDialogBody>
              {memberToRemove ? (
                <>
                  Are you sure you want to remove <strong>{memberToRemove.name}</strong> from{' '}
                  <strong>{selectedGroup?.name}</strong>? This action cannot be undone.
                </>
              ) : (
                <>
              Are you sure you want to delete "{deleteTarget?.name}"? 
              This action cannot be undone.
                </>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                {memberToRemove ? 'Remove' : 'Delete'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Create User Modal */}
      <Modal isOpen={isCreateUserOpen} onClose={onCreateUserClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CreateUserForm
              onSubmit={handleCreateUser}
              onCancel={onCreateUserClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Upload Users Modal */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Users from Google Sheets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text mb={4}>
                  Upload an Excel (.xlsx) or CSV file with user data. Your file should have these columns:
                </Text>
                <List spacing={2}>
                  <ListItem>
                    <ListIcon as={FiCheck} color="green.500" />
                    <strong>Name</strong> - Full name of the user
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiCheck} color="green.500" />
                    <strong>RegNo</strong> - Registration number (unique)
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiCheck} color="green.500" />
                    <strong>Role</strong> - student, teacher, hod, or admin
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiCheck} color="green.500" />
                    <strong>Department</strong> - Department name
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiCheck} color="green.500" />
                    <strong>Year</strong> - Academic year (1-4)
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FiAlertCircle} color="orange.500" />
                    <strong>Password</strong> - Optional (will use RegNo if not provided)
                  </ListItem>
                </List>
              </Box>

              <Divider />

              <Box>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => fileInputRef.current?.click()}
                  colorScheme="blue"
                  variant="outline"
                  width="full"
                >
                  Choose File
                </Button>
                {uploadFile && (
                  <Text mt={2} fontSize="sm" color="gray.600">
                    Selected: {uploadFile.name}
                  </Text>
                )}
              </Box>

              {uploading && (
                <Box>
                  <Progress isIndeterminate colorScheme="blue" />
                  <Text mt={2} textAlign="center">Uploading and processing...</Text>
                </Box>
              )}

              {uploadResults && (
                <Box>
                  <Text fontWeight="semibold" mb={2}>Upload Results:</Text>
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <Icon as={FiCheck} color="green.500" />
                      <Text>Created: {uploadResults.results.created.length} users</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FiAlertCircle} color="orange.500" />
                      <Text>Skipped: {uploadResults.results.skipped.length} users</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FiX} color="red.500" />
                      <Text>Errors: {uploadResults.results.errors.length} users</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              mr={3}
              onClick={() => {
                onUploadClose();
                setUploadFile(null);
                setUploadResults(null);
              }}
            >
              Close
            </Button>
            <Button
              colorScheme="green"
              onClick={handleFileUpload}
              isLoading={uploading}
              isDisabled={!uploadFile}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Member Management Modal */}
      <Modal isOpen={isMemberModalOpen} onClose={onMemberModalClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            Manage Members - {selectedGroup?.name}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {selectedGroup && (
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
                  {/* Current Members */}
                  <Box flex="1">
                    <Text fontSize="lg" fontWeight="600" mb={4}>
                      Current Members ({selectedGroup.members?.length || 0})
                    </Text>
                    <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                      {selectedGroup.members?.map((member) => (
                        <HStack
                          key={member._id}
                          p={3}
                          bg={cardBg}
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
                                  {member.role}
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
                              icon={<Icon as={FiMoreVertical} />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem 
                                icon={<Icon as={FiUserMinus} />} 
                                onClick={() => {
                                  setMemberToRemove(member);
                                  onDeleteOpen();
                                }}
                                color="red.500"
                              >
                                Remove from Group
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      )) || []}
                      
                      {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                        <Center py={8}>
                          <Text color="gray.500">No members in this group</Text>
                        </Center>
                      )}
                    </VStack>
                  </Box>

                  <Divider orientation={{ base: 'horizontal', lg: 'vertical' }} />

                  {/* Add New Members */}
                  <Box flex="1">
                    <Text fontSize="lg" fontWeight="600" mb={4}>
                      Add New Members
                    </Text>
                    
                    <VStack spacing={3} mb={4}>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FiSearch} color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search by name, email, or reg no..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </InputGroup>
                    </VStack>

                    <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                      {allUsers
                        .filter(user => {
                          // Exclude current members
                          const isMember = selectedGroup.members?.some(member => 
                            member._id === user._id || member._id === user.id
                          );
                          if (isMember) return false;

                          // Apply search filter
                          if (searchQuery.trim()) {
                            const query = searchQuery.toLowerCase();
                            return (
                              user.name.toLowerCase().includes(query) ||
                              user.email.toLowerCase().includes(query) ||
                              (user.regNo && user.regNo.toLowerCase().includes(query))
                            );
                          }
                          return true;
                        })
                        .map((user) => (
                          <HStack
                            key={user._id}
                            p={3}
                            bg={cardBg}
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
                                    {user.role}
                                  </Badge>
                                  <Text fontSize="xs" color="gray.500">
                                    {user.regNo}
                                  </Text>
                                </HStack>
                              </VStack>
                            </HStack>
                            
                            <Button
                              leftIcon={<Icon as={FiUserPlus} />}
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => handleAddMember(user)}
                            >
                              Add
                            </Button>
                          </HStack>
                        ))
                      }
                    </VStack>
                  </Box>
                </Flex>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Create User Form Component
const CreateUserForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    regNo: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'hod' | 'admin',
    department: '',
    year: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter full name"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Registration Number</FormLabel>
          <Input
            value={formData.regNo}
            onChange={(e) => setFormData({...formData, regNo: e.target.value})}
            placeholder="Enter registration number"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Enter password"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Role</FormLabel>
          <Select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value as 'student' | 'teacher' | 'hod' | 'admin'})}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="hod">HOD</option>
            <option value="admin">Admin</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Department</FormLabel>
          <Input
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            placeholder="Enter department"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Year</FormLabel>
          <NumberInput
            value={formData.year}
            onChange={(value) => setFormData({...formData, year: parseInt(value) || 1})}
            min={1}
            max={4}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <HStack w="full" justify="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" colorScheme="blue">
            Create User
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

// Edit User Form Component
const EditUserForm: React.FC<{
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role as 'student' | 'teacher' | 'hod' | 'admin',
    department: user.department || '',
    year: user.year || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Role</FormLabel>
          <Select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value as 'student' | 'teacher' | 'hod' | 'admin'})}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="hod">HOD</option>
            <option value="admin">Admin</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Department</FormLabel>
          <Input
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Year</FormLabel>
          <NumberInput
            value={formData.year}
            onChange={(value) => setFormData({...formData, year: parseInt(value) || 1})}
            min={1}
            max={4}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <HStack w="full" justify="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" colorScheme="blue">
            Update User
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

// Edit Group Form Component
const EditGroupForm: React.FC<{
  group: Group;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ group, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    type: group.type as 'department' | 'class' | 'general',
    department: group.department || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Type</FormLabel>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as 'department' | 'class' | 'general'})}
          >
            <option value="general">General</option>
            <option value="department">Department</option>
            <option value="class">Class</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Department</FormLabel>
          <Input
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          />
        </FormControl>
        <HStack w="full" justify="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" colorScheme="blue">
            Update Group
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

export default Admin; 