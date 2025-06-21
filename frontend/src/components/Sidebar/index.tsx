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
  Button
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, SettingsIcon } from '@chakra-ui/icons';
import { FiMoreVertical, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Group } from '../../types';
import GroupList from './GroupList';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  groups: Group[];
  selectedGroup: Group | null;
  onGroupSelect: (group: Group) => void;
  onCreateGroup?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  groups,
  selectedGroup,
  onGroupSelect,
  onCreateGroup,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('brand.500', 'brand.600');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <Box
      w="380px"
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      {/* Header */}
      <Box
        p={4}
        bg={headerBg}
        color="white"
      >
        <Flex alignItems="center" justifyContent="space-between" mb={3}>
          <HStack 
            spacing={3}
            cursor="pointer"
            onClick={() => navigate('/profile')}
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
          >
            <Avatar
              size="sm"
              name={user?.name}
              src={user?.profilePic}
              border="2px solid rgba(255,255,255,0.3)"
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="600" fontSize="sm">
                {user?.name}
              </Text>
              <Badge
                colorScheme={getRoleBadgeColor(user?.role || '')}
                size="xs"
                variant="solid"
                bg="rgba(255,255,255,0.2)"
                color="white"
              >
                {formatRole(user?.role || '')}
              </Badge>
            </VStack>
          </HStack>
          
          <HStack spacing={1}>
            {(user?.role === 'hod' || user?.role === 'admin') && (
              <IconButton
                aria-label="Create group"
                icon={<AddIcon />}
                variant="ghost"
                size="sm"
                colorScheme="whiteAlpha"
                onClick={onCreateGroup}
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
              />
            )}
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                colorScheme="whiteAlpha"
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
              />
              <MenuList color="gray.800">
                <MenuItem icon={<FiUser />} onClick={() => navigate('/profile')}>
                  Profile
                </MenuItem>
                <MenuItem icon={<SettingsIcon />}>
                  Settings
                </MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem as="a" href="/admin">
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
        
        <Text fontSize="xs" opacity={0.8}>
          Welcome back! You have {groups.length} groups
        </Text>
      </Box>

      {/* Search */}
      <Box p={4} pb={2}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search groups..."
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            _focus={{ 
              border: '1px solid',
              borderColor: 'brand.300',
              bg: 'white',
              boxShadow: '0 0 0 1px rgba(45, 55, 72, 0.1)'
            }}
            _hover={{ borderColor: 'gray.300' }}
            borderRadius="lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      {/* Filter/Status Bar */}
      <Box px={4} pb={2}>
        <HStack spacing={2} justify="space-between">
          <Text fontSize="xs" color="gray.500" fontWeight="500">
            {filteredGroups.length} of {groups.length} groups
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

      <Divider />

      {/* Groups List */}
      <VStack
        spacing={0}
        overflowY="auto"
        h="calc(100vh - 200px)"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(155, 155, 155, 0.5)',
            borderRadius: '20px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(155, 155, 155, 0.7)',
          },
        }}
      >
        {filteredGroups.length > 0 ? (
          <GroupList
            groups={filteredGroups}
            selectedGroup={selectedGroup}
            onGroupSelect={onGroupSelect}
          />
        ) : (
          <Box p={6} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              {searchQuery ? 'No groups match your search' : 'No groups available'}
            </Text>
            {!searchQuery && (user?.role === 'hod' || user?.role === 'admin') && (
              <Button
                size="sm"
                mt={2}
                variant="outline"
                onClick={onCreateGroup}
              >
                Create First Group
              </Button>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar; 