import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Flex,
  Avatar,
  Text,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
  HStack,
  Badge,
  useColorModeValue,
  AvatarGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiInfo, FiUsers } from 'react-icons/fi';
import { Group, Message, User } from '../../types';
import MessageList from './MessageList';
import GroupInfoModal from '../GroupInfoModal';
import socketService from '../../services/socket';
import { groupAPI } from '../../services/api';

interface ChatProps {
  group: Group;
  currentUser: User;
  onNewMessage?: (groupId: string, message: Message) => void;
}

const Chat: React.FC<ChatProps> = ({ group, currentUser, onNewMessage }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { isOpen: isGroupInfoOpen, onOpen: onGroupInfoOpen, onClose: onGroupInfoClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const chatBg = useColorModeValue('white', 'gray.900');

  useEffect(() => {
    // Join the new group's socket room
    socketService.joinGroup(group._id);

    // Set up message listener
    const unsubscribe = socketService.onMessage((newMessage) => {
      console.log('Received message:', newMessage);
      console.log('Current group ID:', group._id);
      console.log('Message group ID:', newMessage.groupId);
      
      // Only add message if it belongs to the current group
      if (newMessage.groupId === group._id) {
        console.log('Adding message to current group');
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
        
        // Update parent groups state with new message
        if (onNewMessage) {
          console.log('Calling onNewMessage for group:', group._id);
          onNewMessage(group._id, newMessage);
        } else {
          console.log('onNewMessage is not available');
        }
      } else {
        console.log('Message belongs to different group, but still updating parent');
        // Update parent groups state even if message belongs to different group
        if (onNewMessage) {
          onNewMessage(newMessage.groupId, newMessage);
        }
      }
    });

    // Fetch initial messages for the selected group
    fetchMessages();

    // Cleanup on component unmount or group change
    return () => {
      unsubscribe();
      socketService.leaveGroup(group._id);
    };
  }, [group._id]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await groupAPI.getGroupMessages(group._id);
      setMessages(fetchedMessages);
      scrollToBottom();
    } catch (error) {
      toast({
        title: 'Error fetching messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Defensive check for sender ID
    if (!currentUser?._id) {
        console.error("Could not find sender ID on currentUser object", currentUser);
        toast({
            title: "Error sending message",
            description: "Could not identify the sender. Please try logging out and back in.",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
        return;
    }

    socketService.sendMessage(group._id, currentUser._id, message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const isUserAdmin = group.admins?.some(admin => admin._id === currentUser._id) || false;
  const isUserCreator = group.createdBy?._id === currentUser._id;

  return (
    <Box h="100%" w="100%" bg={chatBg} display="flex" flexDirection="column">
      {/* Chat Header */}
      <Box
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        shadow="sm"
        flexShrink={0}
        w="100%"
      >
        <Flex
          p={4}
          alignItems="center"
          cursor="pointer"
          onClick={onGroupInfoOpen}
          _hover={{ bg: 'gray.50' }}
          transition="background 0.2s"
        >
          <Avatar
            size="md"
            name={group.name}
            mr={4}
            border="2px solid"
            borderColor="gray.200"
          />
          
          <Box flex="1" minW="0">
            <HStack spacing={2} mb={1}>
              <Text fontWeight="700" fontSize="lg" color="gray.800" noOfLines={1}>
                {group.name}
              </Text>
              <Badge
                colorScheme={getGroupTypeColor(group.type)}
                fontSize="xs"  
                px={2}
                py={0.5}
                borderRadius="full"
                variant="subtle"
              >
                {formatGroupType(group.type)}
              </Badge>
            </HStack>
            
            <HStack spacing={3}>
              <HStack spacing={1}>
                <AvatarGroup size="xs" max={4}>
                  {group.members?.slice(0, 4).map((member) => (
                    <Avatar
                      key={member._id}
                      name={member.name}
                      src={member.profilePic}
                      size="xs"
                    />
                  )) || []}
                </AvatarGroup>
                <Text fontSize="sm" color="gray.500" fontWeight="500">
                  {group.members?.length || 0} members
                </Text>
              </HStack>
              
              {group.department && (
                <>
                  <Text fontSize="sm" color="gray.300">•</Text>
                  <Text fontSize="sm" color="gray.500">
                    {group.department}
                    {group.year && ` • Year ${group.year}`}
                  </Text>
                </>
              )}
            </HStack>
          </Box>

          <HStack spacing={2}>
            <IconButton
              aria-label="Group info"
              icon={<FiInfo />}
              variant="ghost"
              size="sm"
              color="gray.600"
              _hover={{ bg: 'gray.100', color: 'brand.600' }}
              onClick={(e) => {
                e.stopPropagation();
                onGroupInfoOpen();
              }}
            />
            
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="More options"
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                color="gray.600"
                _hover={{ bg: 'gray.100', color: 'brand.600' }}
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <MenuItem icon={<FiInfo />} onClick={onGroupInfoOpen}>
                  Group Info
                </MenuItem>
                <MenuItem icon={<FiUsers />}>
                  View Members
                </MenuItem>
                {(isUserAdmin || isUserCreator) && (
                  <>
                    <MenuItem>Group Settings</MenuItem>
                    <MenuItem>Manage Members</MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Messages Area */}
      <Box
        flex="1"
        overflowY="auto"
        p={2}
        w="100%"
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
        <MessageList
          messages={messages}
          currentUser={currentUser}
        />
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        p={4}
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        flexShrink={0}
        w="100%"
      >
        <InputGroup size="lg">
          <Input
            pr="4.5rem"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={inputBg}
            border="1px solid"
            borderColor="gray.300"
            borderRadius="full"
            _focus={{
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px rgba(107, 114, 128, 0.2)'
            }}
            _hover={{ borderColor: 'gray.400' }}
            fontSize="md"
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="2.5rem"
              w="2.5rem"
              borderRadius="full"
              aria-label="Send message"
              icon={<FiSend />}
              onClick={handleSendMessage}
              bg="brand.500"
              color="white"
              _hover={{
                bg: 'brand.600',
                transform: 'scale(1.05)'
              }}
              _active={{
                bg: 'brand.700',
                transform: 'scale(0.95)'
              }}
              isDisabled={!message.trim()}
              transition="all 0.2s"
            />
          </InputRightElement>
        </InputGroup>
      </Box>

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        onClose={onGroupInfoClose}
        group={group}
        currentUser={currentUser}
        canEdit={isUserAdmin || isUserCreator}
      />
    </Box>
  );
};

export default Chat; 