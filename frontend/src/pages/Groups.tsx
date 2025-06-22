import React, { useEffect, useState } from 'react';
import { 
  Flex, 
  useDisclosure, 
  useToast, 
  Box,
  IconButton,
  Text,
  useBreakpointValue,
  HStack,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { HamburgerIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useMobile } from '../contexts/MobileContext';
import { Group, Message, User, DirectMessageContact } from '../types';
import { groupAPI, userAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import DirectMessageChat from '../components/DirectMessageChat';
import CreateGroupModal from '../components/CreateGroupModal';
import UserSearchModal from '../components/UserSearchModal';
import socketService from '../services/socket';

type ActiveChat = 
  | { type: 'group'; data: Group }
  | { type: 'direct'; data: User }
  | null;

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [directContacts, setDirectContacts] = useState<DirectMessageContact[]>([]);
  const [activeChat, setActiveChat] = useState<ActiveChat>(null);
  
  const { user } = useAuth();
  const { isMobile, openSidebar, setShowChat } = useMobile();
  const toast = useToast();
  
  const { 
    isOpen: isCreateGroupOpen, 
    onOpen: onCreateGroupOpen, 
    onClose: onCreateGroupClose 
  } = useDisclosure();
  
  const { 
    isOpen: isUserSearchOpen, 
    onOpen: onUserSearchOpen, 
    onClose: onUserSearchClose 
  } = useDisclosure();

  // Mobile-specific values
  const headerHeight = useBreakpointValue({ base: '60px', md: 'auto' });
  const chatHeaderHeight = useBreakpointValue({ base: '50px', md: 'auto' });

  useEffect(() => {
    if (user) {
      console.log('User logged in, setting up socket connection:', user._id);
      
      fetchGroups();
      fetchDirectContacts();
      
      // Join user's personal room for direct messages
      if (user._id) {
        socketService.joinUser(user._id);
      }
      
      // Listen for socket errors
      const unsubscribeError = socketService.onMessageError((error) => {
        console.error('Socket error:', error);
        toast({
          title: 'Message Error',
          description: error.error,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });

      return () => {
        console.log('Cleaning up socket connection for user:', user._id);
        if (user._id) {
          socketService.leaveUser(user._id);
        }
        unsubscribeError();
      };
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const fetchedGroups = await groupAPI.getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      toast({
        title: 'Error fetching groups',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchDirectContacts = async () => {
    try {
      const contacts = await userAPI.getDirectMessageContacts();
      setDirectContacts(contacts);
    } catch (error) {
      console.error('Error fetching direct contacts:', error);
    }
  };

  const updateDirectMessageContacts = (message: Message) => {
    if (!user) return;
    
    // Determine the other user in the conversation
    const otherUser = message.senderId._id === user._id ? message.receiverId! : message.senderId;
    
    setDirectContacts(prev => {
      // Check if contact already exists
      const existingIndex = prev.findIndex(contact => contact.user._id === otherUser._id);
      
      if (existingIndex >= 0) {
        // Update existing contact
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: message,
        };
        // Move to top
        const contact = updated.splice(existingIndex, 1)[0];
        return [contact, ...updated];
      } else {
        // Add new contact
        return [{
          user: otherUser,
          lastMessage: message,
          unreadCount: message.senderId._id !== user._id ? 1 : 0,
        }, ...prev];
      }
    });
  };

  const handleGroupSelect = (group: Group) => {
    setActiveChat({ type: 'group', data: group });
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleDirectUserSelect = (selectedUser: User) => {
    setActiveChat({ type: 'direct', data: selectedUser });
    
    // Add user to directContacts if not already present (without fake message)
    setDirectContacts(prev => {
      const existingContact = prev.find(contact => 
        contact.user._id === selectedUser._id || contact.user.id === selectedUser.id
      );
      
      if (!existingContact) {
        // Add new contact at the top of the list
        const newContact: DirectMessageContact = {
          user: selectedUser,
          lastMessage: undefined as any,
          unreadCount: 0
        };
        return [newContact, ...prev];
      }
      
      return prev;
    });

    if (isMobile) {
      setShowChat(true);
    }
  };

  const updateGroupLastMessage = (groupId: string, message: Message) => {
    setGroups((prevGroups) => 
      prevGroups.map((group) => 
        group._id === groupId 
          ? { ...group, lastMessage: message }
          : group
      )
    );
    
    // Update active chat if it's the same group
    if (activeChat?.type === 'group' && activeChat.data._id === groupId) {
      setActiveChat(prev => {
        if (prev && prev.type === 'group') {
          return { ...prev, data: { ...prev.data, lastMessage: message } };
        }
        return prev;
      });
    }
  };

  const handleCreateGroup = async (data: { name: string; description: string; type: string; department?: string; year?: number; members: string[] }) => {
    try {
      const newGroup = await groupAPI.createGroup(data);
      setGroups((prev) => [...prev, newGroup]);
      toast({
        title: 'Group created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCreateGroupClose();
    } catch (error) {
      toast({
        title: 'Error creating group',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGroupJoined = (newGroup: Group) => {
    setGroups((prev) => [...prev, newGroup]);
    toast({
      title: 'Successfully joined group!',
      description: `You are now a member of ${newGroup.name}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleBackToSidebar = () => {
    setShowChat(false);
    setActiveChat(null);
  };

  const renderChatArea = () => {
    if (!activeChat) {
      return (
        <Flex
          h="100%"
          w="100%"
          bg="white"
          justify="center"
          align="center"
          fontSize="xl"
          color="gray.500"
          direction="column"
        >
          <Box textAlign="center">
            <Box fontSize="2xl" mb={2}>💬</Box>
            <Box>Select a chat to start messaging</Box>
            <Box fontSize="sm" color="gray.400" mt={2}>
              Groups and direct messages are all in one place
            </Box>
          </Box>
        </Flex>
      );
    }

    if (activeChat.type === 'group') {
      return (
        <Chat
          group={activeChat.data}
          currentUser={user!}
          onNewMessage={updateGroupLastMessage}
        />
      );
    } else {
      return (
        <DirectMessageChat
          currentUser={user!}
          otherUser={activeChat.data}
          onNewMessage={(message) => updateDirectMessageContacts(message)}
        />
      );
    }
  };

  // Mobile chat header component
  const MobileChatHeader = () => {
    if (!activeChat) return null;

    const getChatTitle = () => {
      if (activeChat.type === 'group') {
        return activeChat.data.name;
      } else {
        return activeChat.data.name;
      }
    };

    const getChatSubtitle = () => {
      if (activeChat.type === 'group') {
        const group = activeChat.data as Group;
        return `${group.members?.length || 0} members`;
      } else {
        const user = activeChat.data as User;
        return user.role || 'User';
      }
    };

    return (
      <Box
        h={chatHeaderHeight}
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexShrink={0}
      >
        <HStack spacing={3}>
          <IconButton
            aria-label="Back to chats"
            icon={<ArrowBackIcon />}
            variant="ghost"
            size="sm"
            onClick={handleBackToSidebar}
          />
          <Avatar
            size="sm"
            name={getChatTitle()}
            src={activeChat.type === 'direct' ? activeChat.data.profilePic : undefined}
          />
          <Box>
            <Text fontWeight="600" fontSize="sm" noOfLines={1}>
              {getChatTitle()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {getChatSubtitle()}
            </Text>
          </Box>
        </HStack>
      </Box>
    );
  };

  return (
    <Flex h="100vh" bg="white" direction={isMobile ? "column" : "row"}>
      {/* Mobile Header */}
      {isMobile && !activeChat && (
        <Box
          h={headerHeight}
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          px={4}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          <HStack spacing={3}>
            <IconButton
              aria-label="Open sidebar"
              icon={<HamburgerIcon />}
              variant="ghost"
              size="sm"
              onClick={openSidebar}
              data-sidebar-toggle
            />
            <Box>
              <Text fontWeight="600" fontSize="lg">
                Chats
              </Text>
              <Text fontSize="xs" color="gray.500">
                {groups.length} groups • {directContacts.length} direct chats
              </Text>
            </Box>
          </HStack>
        </Box>
      )}

      {/* Mobile Chat Header */}
      {isMobile && activeChat && <MobileChatHeader />}

      {/* Sidebar - hidden on mobile when chat is active */}
      {(!isMobile || !activeChat) && (
        <Sidebar
          groups={groups}
          directContacts={directContacts}
          selectedGroup={activeChat?.type === 'group' ? activeChat.data : null}
          selectedDirectUser={activeChat?.type === 'direct' ? activeChat.data : null}
          onGroupSelect={handleGroupSelect}
          onDirectUserSelect={handleDirectUserSelect}
          onCreateGroup={onCreateGroupOpen}
          onGroupJoined={handleGroupJoined}
          onUserSearch={onUserSearchOpen}
        />
      )}
      
      {/* Chat Area */}
      <Box 
        flex="1" 
        minW="0" 
        h={isMobile ? "calc(100vh - 60px)" : "100%"}
        display={isMobile && !activeChat ? "none" : "block"}
      >
        {renderChatArea()}
      </Box>
      
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={onCreateGroupClose}
        onCreate={handleCreateGroup}
      />
      
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={onUserSearchClose}
        onUserSelect={handleDirectUserSelect}
        currentUser={user!}
      />
    </Flex>
  );
};

export default Groups; 