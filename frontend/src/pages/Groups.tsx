import React, { useEffect, useState } from 'react';
import { 
  Flex, 
  useDisclosure, 
  useToast, 
  Box,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
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

  return (
    <Flex h="100vh" bg="white">
      {/* Unified Sidebar */}
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
      
      <Box flex="1" minW="0" h="100%">
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