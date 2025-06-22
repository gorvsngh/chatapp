import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  useDisclosure,
  useBreakpointValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiSend, FiMoreVertical, FiInfo, FiUsers } from 'react-icons/fi';
import { Group, Message, User } from '../../types';
import MessageList from './MessageList';
import GroupInfoModal from '../GroupInfoModal';
import UserSearchModal from '../UserSearchModal';
import socketService from '../../services/socket';
import { groupAPI } from '../../services/api';

interface ChatProps {
  group: Group;
  currentUser: User;
  onNewMessage?: (groupId: string, message: Message) => void;
  onGroupUpdate?: (updatedGroup: Group) => void;
}

const Chat: React.FC<ChatProps> = ({ group, currentUser, onNewMessage, onGroupUpdate }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    hasMore: false
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { isOpen: isGroupInfoOpen, onOpen: onGroupInfoOpen, onClose: onGroupInfoClose } = useDisclosure();
  const { isOpen: isUserSearchOpen, onOpen: onUserSearchOpen, onClose: onUserSearchClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const chatBg = useColorModeValue('white', 'gray.900');

  // Mobile-specific values
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const headerPadding = useBreakpointValue({ base: 3, md: 4 });
  const inputPadding = useBreakpointValue({ base: 3, md: 4 });
  const avatarSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const buttonSize = useBreakpointValue({ base: 'mobile', md: 'sm' });
  const inputSize = useBreakpointValue({ base: 'mobile', md: 'lg' });

  // Fetch messages with pagination
  const fetchMessages = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (!group._id) {
        console.error('Group ID is undefined');
        return;
      }

      if (page > 1) {
        setIsLoadingMore(true);
      }

      const response = await groupAPI.getGroupMessages(group._id, page, 20);
      
      if (reset) {
        setMessages(response.messages);
      } else {
        // When loading older messages, prepend to existing messages
        setMessages(prevMessages => [...response.messages, ...prevMessages]);
      }
      
      setPagination(response.pagination);
      
      if (reset && response.messages.length > 0) {
        // Scroll to bottom for initial load
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      toast({
        title: 'Error fetching messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoad(false);
    }
  }, [group._id, toast]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !pagination.hasMore) return;

    // Check if scrolled to top (with some threshold)
    if (container.scrollTop <= 100) {
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      fetchMessages(pagination.currentPage + 1, false).then(() => {
        // Maintain scroll position after loading older messages
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        }, 50);
      });
    }
  }, [fetchMessages, isLoadingMore, pagination.hasMore, pagination.currentPage]);

  useEffect(() => {
    // Join the new group's socket room
    if (group._id) {
      socketService.joinGroup(group._id);
    }

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
        if (onNewMessage && newMessage.groupId) {
          onNewMessage(newMessage.groupId, newMessage);
        }
      }
    });

    // Fetch initial messages for the selected group
    setIsInitialLoad(true);
    fetchMessages(1, true);

    // Cleanup on component unmount or group change
    return () => {
      unsubscribe();
      if (group._id) {
        socketService.leaveGroup(group._id);
      }
    };
  }, [group._id, fetchMessages, onNewMessage]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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

    if (group._id && currentUser._id) {
    socketService.sendMessage(group._id, currentUser._id, message);
    }
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

  // Member management functions
  const handleMemberAdd = (groupId: string) => {
    onUserSearchOpen();
  };

  const handleMemberRemove = async (groupId: string, memberId: string) => {
    try {
      await groupAPI.removeMemberFromGroup(groupId, memberId);
      
      // Update the group state locally
      const updatedGroup = {
        ...group,
        members: group.members?.filter(member => member._id !== memberId) || []
      };
      
      if (onGroupUpdate) {
        onGroupUpdate(updatedGroup);
      }
      
      toast({
        title: 'Member removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: 'Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUserSelect = async (selectedUser: User) => {
    try {
      if (!group._id) return;
      
      // Check if user is already a member
      const isAlreadyMember = group.members?.some(
        member => member._id === selectedUser._id || member._id === selectedUser.id
      );
      
      if (isAlreadyMember) {
        toast({
          title: 'User already a member',
          description: `${selectedUser.name} is already in this group.`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        onUserSearchClose();
        return;
      }
      
      await groupAPI.addMemberToGroup(group._id, selectedUser._id || selectedUser.id || '');
      
      // Update the group state locally
      const updatedGroup = {
        ...group,
        members: [...(group.members || []), selectedUser]
      };
      
      if (onGroupUpdate) {
        onGroupUpdate(updatedGroup);
      }
      
      onUserSearchClose();
      
      toast({
        title: 'Member added successfully',
        description: `${selectedUser.name} has been added to the group.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: 'Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box h="100%" w="100%" bg={chatBg} display="flex" flexDirection="column">
      {/* Chat Header - Only show on desktop since mobile has its own header */}
      {!isMobile && (
        <Box
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          shadow="sm"
          flexShrink={0}
          w="100%"
        >
          <Flex
            p={headerPadding}
            alignItems="center"
            cursor="pointer"
            onClick={onGroupInfoOpen}
            _hover={{ bg: 'gray.50' }}
            transition="background 0.2s"
          >
            <Avatar
              size={avatarSize}
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
                size={buttonSize}
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
                  size={buttonSize}
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
      )}

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        flex="1"
        overflowY="auto"
        p={isMobile ? 2 : 2}
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
        {/* Loading indicator for fetching older messages */}
        {isLoadingMore && (
          <Center py={4}>
            <Spinner size="sm" color="brand.500" />
          </Center>
        )}
        
        {/* Initial loading indicator */}
        {isInitialLoad && messages.length === 0 ? (
          <Center h="100%" w="100%">
            <Spinner size="lg" color="brand.500" />
          </Center>
        ) : (
          <>
            <MessageList
              messages={messages}
              currentUser={currentUser}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box
        p={inputPadding}
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        flexShrink={0}
        w="100%"
      >
        <InputGroup size={inputSize}>
          <Input
            pr="4.5rem"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg={inputBg}
            border="1px solid"
            borderColor="gray.300"
            borderRadius={isMobile ? "full" : "full"}
            _focus={{
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px rgba(107, 114, 128, 0.2)'
            }}
            _hover={{ borderColor: 'gray.400' }}
            fontSize={isMobile ? "16px" : "md"}
            variant={isMobile ? "mobile" : "outline"}
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h={isMobile ? "2.5rem" : "2.5rem"}
              w={isMobile ? "2.5rem" : "2.5rem"}
              borderRadius="full"
              aria-label="Send message"
              icon={<FiSend />}
              onClick={handleSendMessage}
              bg="brand.500"
              color="white"
              _hover={{
                bg: 'brand.600',
                transform: isMobile ? 'scale(1.05)' : 'scale(1.05)'
              }}
              _active={{
                bg: 'brand.700',
                transform: isMobile ? 'scale(0.95)' : 'scale(0.95)'
              }}
              isDisabled={!message.trim()}
              transition="all 0.2s"
              size={isMobile ? "mobile" : "md"}
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
        onMemberRemove={handleMemberRemove}
        onMemberAdd={handleMemberAdd}
      />

      {/* User Search Modal for Adding Members */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={onUserSearchClose}
        onUserSelect={handleUserSelect}
        currentUser={currentUser}
      />
    </Box>
  );
};

export default Chat; 