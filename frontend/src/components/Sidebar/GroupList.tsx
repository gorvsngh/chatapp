import React from 'react';
import {
  VStack,
  Box,
  Avatar,
  Text,
  Flex,
  Badge,
  HStack,
  useColorModeValue,
  AvatarGroup
} from '@chakra-ui/react';
import { Group } from '../../types';

interface GroupListProps {
  groups: Group[];
  selectedGroup: Group | null;
  onGroupSelect: (group: Group) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedGroup,
  onGroupSelect,
}) => {
  const selectedBg = useColorModeValue('brand.50', 'brand.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Sort groups by most recent message timestamp
  const sortedGroups = React.useMemo(() => {
    return [...groups].sort((a, b) => {
      const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return bTime - aTime; // Most recent first
    });
  }, [groups]);

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
        return 'DEPT';
      case 'class':
        return 'CLASS';
      case 'general':
        return 'GEN';
      default:
        return 'GEN';
    }
  };

  const getLastMessagePreview = (group: Group) => {
    if (!group.lastMessage) {
      return group.description || 'No messages yet';
    }
    
    const senderName = group.lastMessage.senderId.name.split(' ')[0]; // First name only
    const messageText = group.lastMessage.text;
    
    if (messageText.length > 35) {
      return `${senderName}: ${messageText.substring(0, 35)}...`;
    }
    
    return `${senderName}: ${messageText}`;
  };

  return (
    <VStack spacing={0} align="stretch" w="100%">
      {sortedGroups.map((group) => {
        const isSelected = selectedGroup?._id === group._id;
        
        return (
          <Box
            key={group._id}
            p={3}
            cursor="pointer"
            bg={isSelected ? selectedBg : 'transparent'}
            borderLeft={isSelected ? '3px solid' : '3px solid transparent'}
            borderLeftColor={isSelected ? 'brand.500' : 'transparent'}
            _hover={{ 
              bg: isSelected ? selectedBg : hoverBg,
              transform: 'translateX(2px)',
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => onGroupSelect(group)}
            borderBottom="1px"
            borderColor="gray.100"
            transition="all 0.2s ease-in-out"
            position="relative"
          >
            <Flex>
              <Box position="relative">
                <Avatar
                  size="md"
                  name={group.name}
                  mr={3}
                  border={isSelected ? '2px solid' : '2px solid transparent'}
                  borderColor={isSelected ? 'brand.300' : 'transparent'}
                />
                {/* Online indicator for active groups (could be based on recent activity) */}
                {group.lastMessage && new Date(group.lastMessage.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                  <Box
                    position="absolute"
                    bottom="0"
                    right="3"
                    w="3"
                    h="3"
                    bg="green.400"
                    borderRadius="full"
                    border="2px solid white"
                  />
                )}
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
                  
                  {group.lastMessage && (
                    <Text 
                      fontSize="xs" 
                      color={isSelected ? "brand.600" : "gray.500"}
                      fontWeight="500"
                      ml={2}
                    >
                      {formatTime(group.lastMessage.timestamp)}
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
                    {getLastMessagePreview(group)}
                  </Text>
                  
                  <HStack spacing={2} ml={2}>
                    {/* Members count */}
                                         <HStack spacing={1}>
                       <AvatarGroup size="xs" max={3} fontSize="xs">
                         {group.members?.slice(0, 3).map((member) => (
                           <Avatar
                             key={member._id}
                             name={member.name}
                             src={member.profilePic}
                             size="xs"
                           />
                         )) || []}
                       </AvatarGroup>
                       <Text fontSize="xs" color="gray.400" fontWeight="500">
                         {group.members?.length || 0}
                       </Text>
                     </HStack>
                  </HStack>
                </Flex>
              </Box>
            </Flex>
          </Box>
        );
      })}
    </VStack>
  );
};

export default GroupList; 