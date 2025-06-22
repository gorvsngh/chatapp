import React from 'react';
import { 
  VStack, 
  Box, 
  Text, 
  Flex, 
  Avatar, 
  Badge,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';
import { Message, User } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const messageBg = useColorModeValue('gray.100', 'gray.700');
  const myMessageBg = useColorModeValue('gray.200', 'brand.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const myTextColor = useColorModeValue('gray.800', 'white');
  const timestampColor = useColorModeValue('gray.500', 'gray.300');
  const senderNameColor = useColorModeValue('brand.600', 'brand.300');

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '...';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    
    // Safety check for null senderIds
    if (!currentMessage.senderId?._id || !nextMessage.senderId?._id) {
      return true;
    }
    
    const currentSender = currentMessage.senderId._id;
    const nextSender = nextMessage.senderId._id;
    const currentUserId = currentUser._id || (currentUser as any)?.id;
    
    // Always show avatar for other users' messages if it's the last in a group
    if (currentSender !== currentUserId) {
      return currentSender !== nextSender;
    }
    
    return false;
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
    <VStack spacing={1} align="stretch">
      {messages
        .filter(message => message?.senderId?._id) // Filter out messages with null senderId
        .map((message, index, filteredMessages) => {
        // Basic validation
        if (!message?._id || !message.senderId?._id) {
          return null;
        }

        const currentUserId = currentUser._id || (currentUser as any)?.id;
        const isSender = message.senderId._id === currentUserId;
        const showDateSeparator = shouldShowDateSeparator(message, filteredMessages[index - 1]);
        const showAvatar = shouldShowAvatar(message, filteredMessages[index + 1]);
        const isConsecutive = index > 0 && 
          filteredMessages[index - 1]?.senderId?._id === message.senderId._id &&
          !shouldShowDateSeparator(message, filteredMessages[index - 1]);

        return (
          <Box key={message._id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <Flex justify="center" my={2}>
                <Box
                  bg="gray.200"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  border="1px solid"
                  borderColor="gray.300"
                >
                  <Text fontSize="xs" color="gray.600" fontWeight="500">
                    {formatDate(message.timestamp || '')}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Message */}
            <Flex
              w="100%"
              justify={isSender ? 'flex-end' : 'flex-start'}
              mb={isConsecutive ? 0.5 : 1}
            >
              <Flex 
                align="flex-end" 
                maxW="75%" 
                direction={isSender ? 'row-reverse' : 'row'}
              >
                {!isSender && (
                  <Box mr={1.5} alignSelf="flex-end">
                    {showAvatar ? (
                      <Avatar
                        size="xs"
                        name={message.senderId.name}
                        src={message.senderId.profilePic}
                      />
                    ) : (
                      <Box w="24px" h="24px" /> // Spacer to maintain alignment
                    )}
                  </Box>
                )}

                <Box
                  bg={isSender ? myMessageBg : messageBg}
                  color={isSender ? myTextColor : textColor}
                  px={2.5}
                  py={0.5}
                  borderRadius="12px"
                  boxShadow="sm"
                  border="1px solid"
                  borderColor={isSender ? 'gray.300' : 'gray.200'}
                  position="relative"
                  _before={!isSender && showAvatar ? {
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
                  _after={isSender && showAvatar ? {
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
                  {!isSender && !isConsecutive && (
                    <HStack spacing={1.5} mb={0}>
                      <Text fontSize="xs" fontWeight="600" color={senderNameColor}>
                        {message.senderId.name}
                      </Text>
                      <Badge
                        colorScheme={getRoleBadgeColor(message.senderId.role)}
                        size="xs"
                        variant="subtle"
                      >
                        {message.senderId.role}
                      </Badge>
                    </HStack>
                  )}
                  
                  <Box>
                    <Text 
                      fontSize="sm" 
                      lineHeight="1.2"
                      mb={0}
                      style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word' 
                      }}
                    >
                      {message.text}
                    </Text>
                    
                    {/* WhatsApp-like timestamp */}
                    <Flex justify="flex-end" align="center">
                      <Text
                        fontSize="xs"
                        color={isSender ? 'gray.600' : timestampColor}
                        fontWeight="400"
                        opacity={0.8}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </VStack>
  );
};

export default MessageList; 