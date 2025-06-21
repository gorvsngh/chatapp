import React from 'react';
import { 
  VStack, 
  Box, 
  Text, 
  Flex, 
  Avatar, 
  Badge,
  HStack,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { Message, User } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const messageBg = useColorModeValue('messageBg', 'gray.700');
  const myMessageBg = useColorModeValue('myMessageBg', 'brand.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const myTextColor = useColorModeValue('white', 'white');
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
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    
    const currentSender = currentMessage.senderId._id;
    const nextSender = nextMessage.senderId._id;
    const currentUserId = currentUser._id || currentUser.id;
    
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
    <VStack spacing={2} align="stretch">
      {messages.map((message, index) => {
        // Basic validation
        if (!message?._id || !message.senderId?._id) {
          return null;
        }

        const currentUserId = currentUser._id || currentUser.id;
        const isSender = message.senderId._id === currentUserId;
        const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
        const showAvatar = shouldShowAvatar(message, messages[index + 1]);
        const isConsecutive = index > 0 && 
          messages[index - 1]?.senderId?._id === message.senderId._id &&
          !shouldShowDateSeparator(message, messages[index - 1]);

        return (
          <Box key={message._id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <Flex justify="center" my={4}>
                <Box
                  bg="gray.100"
                  px={3}
                  py={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="xs" color="gray.600" fontWeight="500">
                    {formatDate(message.createdAt)}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* Message */}
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
                    {showAvatar ? (
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
                  borderColor={isSender ? 'transparent' : 'gray.100'}
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
                    <HStack spacing={2} mb={1}>
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
                      lineHeight="1.4"
                      style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word' 
                      }}
                    >
                      {message.text}
                    </Text>
                    
                    <Text
                      fontSize="xs"
                      color={isSender ? 'rgba(255,255,255,0.7)' : timestampColor}
                      mt={1}
                      textAlign="right"
                    >
                      {formatTimestamp(message.createdAt)}
                    </Text>
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