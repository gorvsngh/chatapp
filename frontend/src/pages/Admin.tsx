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
} from 'react-icons/fi';
import { adminAPI } from '../services/api';
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

  // Filters
  const [userFilters, setUserFilters] = useState({ search: '', role: '', department: '' });
  const [groupFilters, setGroupFilters] = useState({ search: '', type: '', department: '' });
  const [messageFilters, setMessageFilters] = useState({ groupId: '', senderId: '' });

  // Modals
  const { isOpen: isEditUserOpen, onOpen: onEditUserOpen, onClose: onEditUserClose } = useDisclosure();
  const { isOpen: isEditGroupOpen, onOpen: onEditGroupOpen, onClose: onEditGroupClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isCreateUserOpen, onOpen: onCreateUserOpen, onClose: onCreateUserClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(userFilters);
      setUsers(response.users);
    } catch (error) {
      toast({
        title: 'Error loading users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load groups
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGroups(groupFilters);
      setGroups(response.groups);
    } catch (error) {
      toast({
        title: 'Error loading groups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getMessages(messageFilters);
      setMessages(response.messages);
    } catch (error) {
      toast({
        title: 'Error loading messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
      loadUsers();
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
      loadGroups();
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
      loadUsers();
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
      loadUsers();
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
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'user') {
        await adminAPI.deleteUser(deleteTarget.id);
        loadUsers();
      } else if (deleteTarget.type === 'group') {
        await adminAPI.deleteGroup(deleteTarget.id);
        loadGroups();
      } else if (deleteTarget.type === 'message') {
        await adminAPI.deleteMessage(deleteTarget.id);
        loadMessages();
      }

      toast({
        title: `${deleteTarget.type} deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: `Error deleting ${deleteTarget.type}`,
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

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 1) loadUsers();
  }, [activeTab, userFilters]);

  useEffect(() => {
    if (activeTab === 2) loadGroups();
  }, [activeTab, groupFilters]);

  useEffect(() => {
    if (activeTab === 3) loadMessages();
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
                          <Spinner />
                        </Center>
                      ) : (
                        <Table variant="simple">
                          <Thead>
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
                              <Tr key={user._id}>
                                <Td>
                                  <HStack>
                                    <Avatar size="sm" name={user.name} />
                                    <Text>{user.name}</Text>
                                  </HStack>
                                </Td>
                                <Td>{user.regNo}</Td>
                                <Td>
                                  <Badge colorScheme={getRoleBadgeColor(user.role)}>
                                    {user.role}
                                  </Badge>
                                </Td>
                                <Td>{user.department}</Td>
                                <Td>{user.year}</Td>
                                <Td>
                                  <HStack>
                                    <Button
                                      size="sm"
                                      leftIcon={<Icon as={FiEdit} />}
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
                                      leftIcon={<Icon as={FiTrash2} />}
                                      onClick={() => {
                                        setDeleteTarget({ type: 'user', id: user._id, name: user.name });
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
                          <Spinner />
                        </Center>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Group Name</Th>
                              <Th>Type</Th>
                              <Th>Department</Th>
                              <Th>Members</Th>
                              <Th>Created By</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {groups.map((group) => (
                              <Tr key={group._id}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="semibold">{group.name}</Text>
                                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                      {group.description}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Badge colorScheme={getGroupTypeBadgeColor(group.type)}>
                                    {group.type}
                                  </Badge>
                                </Td>
                                <Td>{group.department}</Td>
                                <Td>{group.members?.length || 0}</Td>
                                <Td>{group.createdBy?.name}</Td>
                                <Td>
                                  <HStack>
                                    <Button
                                      size="sm"
                                      leftIcon={<Icon as={FiEdit} />}
                                      onClick={() => {
                                        setSelectedGroup(group);
                                        onEditGroupOpen();
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      leftIcon={<Icon as={FiTrash2} />}
                                      onClick={() => {
                                        setDeleteTarget({ type: 'group', id: group._id, name: group.name });
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
                          <Spinner />
                        </Center>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Sender</Th>
                              <Th>Group</Th>
                              <Th>Message</Th>
                              <Th>Timestamp</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {messages.map((message) => (
                              <Tr key={message._id}>
                                <Td>
                                  <HStack>
                                    <Avatar size="sm" name={message.senderId.name} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="semibold">
                                        {message.senderId.name}
                                      </Text>
                                      <Badge size="xs" colorScheme={getRoleBadgeColor(message.senderId.role)}>
                                        {message.senderId.role}
                                      </Badge>
                                    </VStack>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" noOfLines={1}>
                                    {(message as any).groupId?.name || 'Unknown Group'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" noOfLines={2} maxW="300px">
                                    {message.text}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="xs">
                                    {new Date(message.timestamp).toLocaleString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
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
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {deleteTarget?.type}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{deleteTarget?.name}"? 
              This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
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