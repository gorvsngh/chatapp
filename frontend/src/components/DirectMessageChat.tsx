import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Input,
  IconButton,
  Flex,
  useColorModeValue,
  Badge,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiSend, FiBook } from 'react-icons/fi';
import { User, Message } from '../types';
import { userAPI } from '../services/api';
import socketService from '../services/socket';

interface DirectMessageChatProps {
  currentUser: User;
  otherUser: User;
  onNewMessage?: (message: Message) => void;
}

const DirectMessageChat: React.FC<DirectMessageChatProps> = ({
  currentUser,
  otherUser,
  onNewMessage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Match group message colors exactly
  const messageBg = useColorModeValue('gray.100', 'gray.700');
  const myMessageBg = useColorModeValue('gray.200', 'brand.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const myTextColor = useColorModeValue('gray.800', 'white');
  const timestampColor = useColorModeValue('gray.500', 'gray.300');

  useEffect(() => {
    // Handle both _id and id properties for user objects
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = otherUser._id || otherUser.id;
    
    if (!currentUserId || !otherUserId) {
      console.error('Missing user IDs:', { currentUserId, otherUserId });
      return;
    }
    
    loadMessages();
    
    // Listen for new direct messages
    const unsubscribe = socketService.onDirectMessage((message: Message) => {
      // Only add message if it's between current user and the other user
      const msgSenderId = message.senderId._id || message.senderId.id;
      const msgReceiverId = message.receiverId?._id || message.receiverId?.id;
      
      if (
        (msgSenderId === currentUserId && msgReceiverId === otherUserId) ||
        (msgSenderId === otherUserId && msgReceiverId === currentUserId)
      ) {
        // Prevent duplicate messages by checking if message already exists
        setMessages(prev => {
          const exists = prev.some(existingMsg => existingMsg._id === message._id);
          if (exists) {
            console.log('Duplicate message detected, skipping:', message._id);
            return prev;
          }
          console.log('Adding new direct message:', message._id);
          onNewMessage?.(message); // Update contacts list
          return [...prev, message];
        });
      }
    });

    return unsubscribe;
  }, [currentUser._id || currentUser.id, otherUser._id || otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const otherUserId = otherUser._id || otherUser.id;
    if (!otherUserId) {
      console.error('Cannot load messages: missing other user ID');
      return;
    }
    
    setLoading(true);
    try {
      const fetchedMessages = await userAPI.getDirectMessages(otherUserId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // Handle both _id and id properties for user objects
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = otherUser._id || otherUser.id;

    if (!currentUserId || !otherUserId) {
      console.error('Cannot send message: missing user IDs', { currentUserId, otherUserId });
      return;
    }

    console.log('=== FIXED: Direct Message Send Details ===');
    console.log('Current User ID:', currentUserId);
    console.log('Other User ID:', otherUserId);
    console.log('Message Text:', newMessage.trim());
    console.log('=============================================');

    setSending(true);
    try {
      // Ensure user is connected to their room before sending
      socketService.joinUser(currentUserId);
      
      // Send via socket for real-time delivery
      socketService.sendDirectMessage(currentUserId, otherUserId, newMessage.trim());
      
      // Clear message immediately for better UX
      setNewMessage('');
      
      console.log('Direct message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Try fallback API method if socket fails
      try {
        console.log('Trying fallback API method...');
        const sentMessage = await userAPI.sendDirectMessage(otherUser._id!, newMessage.trim());
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        onNewMessage?.(sentMessage);
        console.log('Message sent via API fallback');
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
        // Restore message text if both methods fail
        setNewMessage(newMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

  return (
    <Flex direction="column" h="100%" bg={bgColor}>
      {/* Header */}
      <Box
        p={4}
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        flexShrink={0}
      >
        <HStack spacing={3}>
          <Avatar
            size="md"
            name={otherUser.name}
            src={otherUser.profilePic}
            border="2px solid"
            borderColor="brand.100"
          />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="600" fontSize="lg" color="gray.800">
              {otherUser.name}
            </Text>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                {otherUser.regNo}
              </Text>
              <Badge
                colorScheme={getRoleBadgeColor(otherUser.role)}
                size="sm"
                variant="subtle"
              >
                {formatRole(otherUser.role)}
              </Badge>
              {otherUser.department && (
                <>
                  <Text fontSize="sm" color="gray.400">•</Text>
                  <HStack spacing={1} color="gray.500" fontSize="sm">
                    <FiBook />
                    <Text>
                      {otherUser.department}
                      {otherUser.year && ` • Year ${otherUser.year}`}
                    </Text>
                  </HStack>
                </>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Messages */}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
      >
        {loading ? (
          <Center h="100%">
            <Spinner size="lg" color="brand.500" />
          </Center>
        ) : messages.length === 0 ? (
          <Center h="100%">
            <VStack spacing={3}>
              <Avatar
                size="xl"
                name={otherUser.name}
                src={otherUser.profilePic}
                border="3px solid"
                borderColor="brand.100"
              />
              <VStack spacing={1}>
                <Text fontSize="lg" fontWeight="600" color="gray.600">
                  Start your conversation with {otherUser.name}
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  This is the beginning of your direct message history.
                </Text>
              </VStack>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={2} align="stretch">
            {messages.map((message, index) => {
              // Handle both _id and id properties for comparison
              const currentUserId = currentUser._id || currentUser.id;
              const messageSenderId = message.senderId._id || message.senderId.id;
              const isSender = messageSenderId === currentUserId;
              
                             // Check if this is a consecutive message from the same sender  
               const isConsecutive = index > 0 && 
                 (messages[index - 1]?.senderId?._id || messages[index - 1]?.senderId?.id) === messageSenderId;
               
               // Show avatar logic - same as group messages (only for other users' last message in group)
               const showAvatar = index === messages.length - 1 || 
                 (index < messages.length - 1 && 
                   (messages[index + 1]?.senderId?._id || messages[index + 1]?.senderId?.id) !== messageSenderId);
               
               // For sender messages, never show avatar (same as group messages)
               const shouldShowAvatar = !isSender && showAvatar;

              return (
                <Box key={message._id}>
                  <Flex
                    w="100%"
                    justify={isSender ? 'flex-end' : 'flex-start'}
                    mb={isConsecutive ? 1 : 2}
                  >
                                         <Flex 
                       align="flex-end" 
                       maxW="75%" 
                       direction={isSender ? 'row-reverse' : 'row'}
                     >
                       {!isSender && (
                         <Box mr={2} alignSelf="flex-end">
                           {shouldShowAvatar ? (
                             <Avatar
                               size="sm"
                               name={message.senderId.name}
                               src={message.senderId.profilePic}
                             />
                           ) : (
                             <Box w="32px" h="32px" /> // Spacer to maintain alignment
                           )}
                         </Box>
                       )}

                       <Box
                         bg={isSender ? myMessageBg : messageBg}
                         color={isSender ? myTextColor : textColor}
                         px={4}
                         py={2}
                         borderRadius="18px"
                         boxShadow="sm"
                         border="1px solid"
                         borderColor={isSender ? 'gray.300' : 'gray.200'}
                         position="relative"
                         _before={!isSender && shouldShowAvatar ? {
                           content: '""',
                           position: 'absolute',
                           left: '-7px',
                           bottom: '8px',
                           width: 0,
                           height: 0,
                           borderLeft: '7px solid transparent',
                           borderRight: '7px solid',
                           borderRightColor: messageBg,
                           borderBottom: '7px solid transparent',
                         } : {}}
                         _after={isSender && shouldShowAvatar ? {
                           content: '""',
                           position: 'absolute',
                           right: '-7px',
                           bottom: '8px',
                           width: 0,
                           height: 0,
                           borderLeft: '7px solid',
                           borderLeftColor: myMessageBg,
                           borderRight: '7px solid transparent',
                           borderBottom: '7px solid transparent',
                         } : {}}
                       >
                         <Box>
                           <Text 
                             fontSize="sm" 
                             lineHeight="1.4"
                             mb={1}
                             style={{ 
                               whiteSpace: 'pre-wrap', 
                               wordBreak: 'break-word' 
                             }}
                           >
                             {message.text}
                           </Text>
                           
                           {/* WhatsApp-like timestamp - exact same as group messages */}
                           <Flex justify="flex-end" align="center">
                             <Text
                               fontSize="xs"
                               color={isSender ? 'gray.600' : timestampColor}
                               fontWeight="400"
                               opacity={0.8}
                             >
                               {formatTime(message.createdAt)}
                             </Text>
                           </Flex>
                         </Box>
                       </Box>
                     </Flex>
                  </Flex>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      {/* Message Input */}
      <Box
        p={4}
        borderTop="1px"
        borderColor={borderColor}
        bg={headerBg}
        flexShrink={0}
      >
        <HStack spacing={2}>
          <Input
            placeholder={`Message ${otherUser.name}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            bg="white"
            border="1px"
            borderColor="gray.300"
            _focus={{
              border: '1px solid',
              borderColor: 'brand.300',
              boxShadow: '0 0 0 1px rgba(107, 114, 128, 0.1)',
            }}
            _hover={{ borderColor: 'gray.400' }}
          />
          <IconButton
            aria-label="Send message"
            icon={<FiSend />}
            colorScheme="brand"
            onClick={handleSendMessage}
            isLoading={sending}
            isDisabled={!newMessage.trim()}
          />
        </HStack>
      </Box>
    </Flex>
  );
};

export default DirectMessageChat; 