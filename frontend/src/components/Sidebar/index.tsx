import React, { useState } from 'react';
import {
  Box,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Text,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  useColorModeValue,
  Badge,
  HStack,
  Button,
  useDisclosure,
  AvatarGroup,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, SettingsIcon } from '@chakra-ui/icons';
import { FiMoreVertical, FiUser, FiLogOut, FiSearch, FiUsers, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useMobile } from '../../contexts/MobileContext';
import { Group, DirectMessageContact, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import DiscoverGroupsModal from '../DiscoverGroupsModal';
import ProfileModal from '../ProfileModal';

interface ChatItem {
  id: string;
  type: 'group' | 'direct';
  name: string;
  lastMessage?: {
    text: string;
    timestamp: string;
    senderName?: string;
  };
  avatar?: string;
  members?: number;
  role?: string;
  regNo?: string;
  department?: string;
  year?: number;
  groupType?: Group['type'];
  data: Group | User;
}

interface SidebarProps {
  groups: Group[];
  directContacts: DirectMessageContact[];
  selectedGroup: Group | null;
  selectedDirectUser: User | null;
  onGroupSelect: (group: Group) => void;
  onDirectUserSelect: (user: User) => void;
  onCreateGroup?: () => void;
  onGroupJoined?: (group: Group) => void;
  onUserSearch?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  groups,
  directContacts,
  selectedGroup,
  selectedDirectUser,
  onGroupSelect,
  onDirectUserSelect,
  onCreateGroup,
  onGroupJoined,
  onUserSearch,
}) => {
  const { user, logout } = useAuth();
  const { isMobile, isSidebarOpen, closeSidebar } = useMobile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen: isDiscoverOpen, onOpen: onDiscoverOpen, onClose: onDiscoverClose } = useDisclosure();
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.100', 'brand.600');
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Mobile-specific values
  const sidebarWidth = useBreakpointValue({ base: '100%', md: '380px' });
  const avatarSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const buttonSize = useBreakpointValue({ base: 'mobile', md: 'sm' });
  const inputSize = useBreakpointValue({ base: 'mobile', md: 'md' });

  // Convert groups and direct contacts to unified chat items
  const allChatItems: ChatItem[] = React.useMemo(() => {
    const groupItems: ChatItem[] = groups.map(group => ({
      id: group._id,
      type: 'group' as const,
      name: group.name,
      lastMessage: group.lastMessage ? {
        text: group.lastMessage.text,
        timestamp: group.lastMessage.timestamp,
        senderName: group.lastMessage.senderId.name.split(' ')[0]
      } : undefined,
      avatar: undefined,
      members: group.members?.length || 0,
      groupType: group.type,
      data: group
    }));

    const directItems: ChatItem[] = directContacts.map(contact => ({
      id: contact.user._id || contact.user.id || '',
      type: 'direct' as const,
      name: contact.user.name,
      lastMessage: contact.lastMessage ? {
        text: contact.lastMessage.text,
        timestamp: contact.lastMessage.timestamp,
        senderName: contact.lastMessage.senderId._id === user?._id ? 'You' : contact.lastMessage.senderId.name.split(' ')[0]
      } : undefined,
      avatar: contact.user.profilePic,
      role: contact.user.role,
      regNo: contact.user.regNo,
      department: contact.user.department,
      year: contact.user.year,
      data: contact.user
    }));

    return [...groupItems, ...directItems];
  }, [groups, directContacts, user?._id]);

  // Filter and sort chat items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = allChatItems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allChatItems.filter(item => {
        // Search in name
        if (item.name.toLowerCase().includes(query)) return true;
        
        // For direct messages, also search in regNo and department
        if (item.type === 'direct') {
          const user = item.data as User;
          if (user.regNo?.toLowerCase().includes(query)) return true;
          if (user.department?.toLowerCase().includes(query)) return true;
        }
        
        // Search in last message text
        if (item.lastMessage?.text.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    // Sort by most recent activity (items without messages get current time to appear at top)
    return filtered.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : Date.now();
      const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : Date.now();
      return bTime - aTime; // Most recent first
    });
  }, [allChatItems, searchQuery]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
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
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
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

  const getGroupTypeColor = (type: Group['type']) => {
    switch (type) {
      case 'department':
        return 'blue';
      case 'class':
        return 'green';
      case 'general':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatGroupType = (type: Group['type']) => {
    switch (type) {
      case 'department':
        return 'Department';
      case 'class':
        return 'Class';
      case 'general':
        return 'General';
      default:
        return type;
    }
  };

  const getLastMessagePreview = (item: ChatItem) => {
    if (!item.lastMessage) {
      return item.type === 'group' ? 'No messages yet' : 'Start a conversation';
    }
    
    const prefix = item.lastMessage.senderName ? `${item.lastMessage.senderName}: ` : '';
    const text = item.lastMessage.text;
    const maxLength = isMobile ? 30 : 50;
    
    if (text.length <= maxLength) {
      return prefix + text;
    }
    
    return prefix + text.substring(0, maxLength) + '...';
  };

  const handleItemClick = (item: ChatItem) => {
    if (item.type === 'group') {
      onGroupSelect(item.data as Group);
    } else {
      onDirectUserSelect(item.data as User);
    }
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      closeSidebar();
    }
  };

  const isItemSelected = (item: ChatItem) => {
    if (item.type === 'group') {
      return selectedGroup?._id === item.id;
    } else {
      return selectedDirectUser?._id === item.id || selectedDirectUser?.id === item.id;
    }
  };

  const SidebarContent = () => (
    <Box
      w={sidebarWidth}
      h="100%"
      bg={bgColor}
      borderRight={isMobile ? "none" : "1px"}
      borderColor={borderColor}
      shadow={isMobile ? "mobile-lg" : "sm"}
      display="flex"
      flexDirection="column"
      flexShrink={0}
      data-sidebar
    >
      {/* Header */}
      <Box
        p={isMobile ? 3 : 4}
        bg={headerBg}
        color="gray.800"
        flexShrink={0}
        borderBottom="1px"
        borderColor={borderColor}
      >
        <Flex alignItems="center" justifyContent="space-between" mb={3}>
          <HStack 
            spacing={3}
            cursor="pointer"
            onClick={() => {
              onProfileOpen();
              if (isMobile) closeSidebar();
            }}
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
          >
            <Avatar
              size={avatarSize}
              name={user?.name}
              src={user?.profilePic}
              border="2px solid"
              borderColor="gray.300"
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="600" fontSize="sm" color="gray.800">
                {user?.name}
              </Text>
              <Badge
                colorScheme={getRoleBadgeColor(user?.role || '')}
                size="xs"
                variant="solid"
              >
                {formatRole(user?.role || '')}
              </Badge>
            </VStack>
          </HStack>
          
          <HStack spacing={1}>
            <IconButton
              aria-label="Find people"
              icon={<FiSearch />}
              variant="ghost"
              size={buttonSize}
              color="gray.600"
              onClick={() => {
                onUserSearch?.();
                if (isMobile) closeSidebar();
              }}
              _hover={{ bg: 'gray.200' }}
            />
            <IconButton
              aria-label="Discover groups"
              icon={<FiUsers />}
              variant="ghost"
              size={buttonSize}
              color="gray.600"
              onClick={() => {
                onDiscoverOpen();
                if (isMobile) closeSidebar();
              }}
              _hover={{ bg: 'gray.200' }}
            />
            {(user?.role === 'hod' || user?.role === 'admin') && (
              <IconButton
                aria-label="Create group"
                icon={<AddIcon />}
                variant="ghost"
                size={buttonSize}
                color="gray.600"
                onClick={() => {
                  onCreateGroup?.();
                  if (isMobile) closeSidebar();
                }}
                _hover={{ bg: 'gray.200' }}
              />
            )}
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FiMoreVertical />}
                variant="ghost"
                size={buttonSize}
                color="gray.600"
                _hover={{ bg: 'gray.200' }}
              />
              <MenuList color="gray.800">
                <MenuItem icon={<FiUser />} onClick={() => {
                  onProfileOpen();
                  if (isMobile) closeSidebar();
                }}>
                  Profile
                </MenuItem>
                <MenuItem icon={<SettingsIcon />}>
                  Settings
                </MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem icon={<SettingsIcon />} onClick={() => {
                    navigate('/admin');
                    if (isMobile) closeSidebar();
                  }}>
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem icon={<FiLogOut />} onClick={logout} color="red.500">
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
        
        <Text fontSize="xs" color="gray.600">
          {groups.length} groups • {directContacts.length} direct chats
        </Text>
      </Box>

      {/* Search */}
      <Box p={isMobile ? 3 : 4} pb={2} flexShrink={0}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search groups and people..."
            bg="white"
            border="1px solid"
            borderColor="gray.300"
            _focus={{ 
              border: '1px solid',
              borderColor: 'brand.300',
              bg: 'white',
              boxShadow: '0 0 0 1px rgba(107, 114, 128, 0.1)'
            }}
            _hover={{ borderColor: 'gray.400' }}
            borderRadius="lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size={inputSize}
          />
        </InputGroup>
      </Box>

      {/* Filter/Status Bar */}
      <Box px={isMobile ? 3 : 4} pb={2} flexShrink={0}>
        <HStack spacing={2} justify="space-between">
          <Text fontSize="xs" color="gray.500" fontWeight="500">
            {filteredAndSortedItems.length} of {allChatItems.length} chats
          </Text>
          {searchQuery && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSearchQuery('')}
              color="gray.500"
            >
              Clear
            </Button>
          )}
        </HStack>
      </Box>

      <Box flexShrink={0}>
        <Divider />
      </Box>

      {/* Unified Chat List */}
      <VStack
        spacing={0}
        overflowY="auto"
        flex="1"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(156, 163, 175, 0.5)',
            borderRadius: '20px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(156, 163, 175, 0.7)',
          },
        }}
      >
        {filteredAndSortedItems.length > 0 ? (
          filteredAndSortedItems.map((item) => {
            const isSelected = isItemSelected(item);
            
            return (
              <Box
                key={item.id}
                p={isMobile ? 4 : 3}
                cursor="pointer"
                bg={isSelected ? selectedBg : 'transparent'}
                borderLeft={isSelected ? '3px solid' : '3px solid transparent'}
                borderLeftColor={isSelected ? 'brand.500' : 'transparent'}
                _hover={{ 
                  bg: isSelected ? selectedBg : hoverBg,
                  transform: isMobile ? 'none' : 'translateX(2px)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleItemClick(item)}
                borderBottom="1px"
                borderColor="gray.100"
                transition="all 0.2s ease-in-out"
                position="relative"
                w="100%"
                minH={isMobile ? "60px" : "auto"}
              >
                <Flex>
                  <Box position="relative">
                    {item.type === 'group' ? (
                      <Avatar
                        size={avatarSize}
                        name={item.name}
                        mr={3}
                        border={isSelected ? '2px solid' : '2px solid transparent'}
                        borderColor={isSelected ? 'brand.300' : 'transparent'}
                      />
                    ) : (
                      <Avatar
                        size={avatarSize}
                        name={item.name}
                        src={item.avatar}
                        mr={3}
                        border={isSelected ? '2px solid' : '2px solid transparent'}
                        borderColor={isSelected ? 'brand.300' : 'transparent'}
                      />
                    )}
                    
                    {/* Type indicator */}
                    <Box
                      position="absolute"
                      bottom="0"
                      right="3"
                      w="4"
                      h="4"
                      bg={item.type === 'group' ? 'blue.400' : 'green.400'}
                      borderRadius="full"
                      border="2px solid white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {item.type === 'group' ? (
                        <FiUsers size="8px" color="white" />
                      ) : (
                        <FiMessageCircle size="8px" color="white" />
                      )}
                    </Box>
                  </Box>
                  
                  <Box flex="1" minW="0">
                    <Flex justify="space-between" align="start" mb={1}>
                      <HStack spacing={2} flex="1" minW="0">
                        <Text 
                          fontWeight={isSelected ? "700" : "600"} 
                          fontSize="sm"
                          color={isSelected ? "brand.700" : "gray.800"}
                          noOfLines={1}
                          flex="1"
                        >
                          {item.name}
                        </Text>
                        
                        {item.type === 'group' ? (
                          <Badge
                            colorScheme={getGroupTypeColor(item.groupType!)}
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            variant="subtle"
                          >
                            {formatGroupType(item.groupType!)}
                          </Badge>
                        ) : (
                          <Badge
                            colorScheme={getRoleBadgeColor(item.role!)}
                            fontSize="xs"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            variant="subtle"
                          >
                            {formatRole(item.role!)}
                          </Badge>
                        )}
                      </HStack>
                      
                      {item.lastMessage && (
                        <Text 
                          fontSize="xs" 
                          color={isSelected ? "brand.600" : "gray.500"}
                          fontWeight="500"
                          ml={2}
                        >
                          {formatTime(item.lastMessage.timestamp)}
                        </Text>
                      )}
                    </Flex>
                    
                    <Flex justify="space-between" align="center">
                      <Text
                        fontSize="xs"
                        color={isSelected ? "brand.600" : "gray.500"}
                        noOfLines={1}
                        flex="1"
                        fontWeight="400"
                      >
                        {getLastMessagePreview(item)}
                      </Text>
                      
                      <HStack spacing={2} ml={2}>
                        {item.type === 'group' ? (
                          <HStack spacing={1}>
                            <AvatarGroup size="xs" max={3} fontSize="xs">
                              {(item.data as Group).members?.slice(0, 3).map((member) => (
                                <Avatar
                                  key={member._id}
                                  name={member.name}
                                  src={member.profilePic}
                                  size="xs"
                                />
                              )) || []}
                            </AvatarGroup>
                            <Text fontSize="xs" color="gray.400" fontWeight="500">
                              {item.members}
                            </Text>
                          </HStack>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontWeight="500">
                            {item.regNo}
                          </Text>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            );
          })
        ) : (
          <Box p={6} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              {searchQuery ? 'No chats match your search' : 'No chats available'}
            </Text>
            {!searchQuery && (
              <VStack spacing={2} mt={3}>
                <Button
                  size="sm"
                  leftIcon={<FiSearch />}
                  variant="outline"
                  onClick={() => {
                    onUserSearch?.();
                    if (isMobile) closeSidebar();
                  }}
                >
                  Find People
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FiUsers />}
                  variant="outline"
                  onClick={() => {
                    onDiscoverOpen();
                    if (isMobile) closeSidebar();
                  }}
                >
                  Discover Groups
                </Button>
                {(user?.role === 'hod' || user?.role === 'admin') && (
                  <Button
                    size="sm"
                    leftIcon={<AddIcon />}
                    variant="outline"
                    onClick={() => {
                      onCreateGroup?.();
                      if (isMobile) closeSidebar();
                    }}
                  >
                    Create Group
                  </Button>
                )}
              </VStack>
            )}
          </Box>
        )}
      </VStack>
      
      <DiscoverGroupsModal
        isOpen={isDiscoverOpen}
        onClose={onDiscoverClose}
        onGroupJoined={(group) => {
          onGroupJoined?.(group);
          onDiscoverClose();
        }}
      />
      
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={onProfileClose}
      />
    </Box>
  );

  // Render as Drawer on mobile, regular sidebar on desktop
  if (isMobile) {
    return (
      <Drawer
        isOpen={isSidebarOpen}
        placement="left"
        onClose={closeSidebar}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Text fontSize="lg" fontWeight="600">Chats</Text>
          </DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
        
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={onProfileClose}
        />
      </Drawer>
    );
  }

  return <SidebarContent />;
};

export default Sidebar; 