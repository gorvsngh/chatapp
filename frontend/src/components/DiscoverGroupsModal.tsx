import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Avatar,
  Badge,
  Divider,
  useToast,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  Heading,
  Spinner,
  Center,
  AvatarGroup,
} from '@chakra-ui/react';
import { FiUsers, FiPlus, FiCalendar } from 'react-icons/fi';
import { Group } from '../types';
import { groupAPI } from '../services/api';

interface DiscoverGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: (group: Group) => void;
}

const DiscoverGroupsModal: React.FC<DiscoverGroupsModalProps> = ({
  isOpen,
  onClose,
  onGroupJoined,
}) => {
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableGroups();
    }
  }, [isOpen]);

  const fetchAvailableGroups = async () => {
    setLoading(true);
    try {
      const groups = await groupAPI.discoverGroups();
      setAvailableGroups(groups);
    } catch (error) {
      toast({
        title: 'Error fetching available groups',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroupId(groupId);
    try {
      const result = await groupAPI.joinGroup(groupId);
      toast({
        title: 'Successfully joined group!',
        description: result.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Remove the joined group from available groups
      setAvailableGroups(prev => prev.filter(group => group._id !== groupId));
      
      // Notify parent component about the new group
      onGroupJoined(result.group);
    } catch (error) {
      toast({
        title: 'Error joining group',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setJoiningGroupId(null);
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
        return 'Department Group';
      case 'class':
        return 'Class Group';
      case 'general':
        return 'General Group';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <Flex align="center">
            <Text>Discover Groups</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" color="brand.500" />
            </Center>
          ) : availableGroups.length === 0 ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No groups available to join
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  All available groups for your department have already been joined,
                  or there are no groups created yet.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.500">
                Found {availableGroups.length} group{availableGroups.length !== 1 ? 's' : ''} you can join
              </Text>
              
              {availableGroups.map((group) => (
                <Card key={group._id} borderColor={borderColor}>
                  <CardBody>
                    <Flex justify="space-between" align="start">
                      <Flex align="start" flex="1">
                        <Avatar
                          size="lg"
                          name={group.name}
                          mr={4}
                          border="2px solid"
                          borderColor="brand.100"
                        />
                        
                        <VStack align="start" spacing={2} flex="1">
                          <VStack align="start" spacing={1}>
                            <Heading as="h3" size="md" color="gray.800">
                              {group.name}
                            </Heading>
                            <Badge
                              colorScheme={getGroupTypeColor(group.type)}
                              px={2}
                              py={1}
                              borderRadius="full"
                              fontSize="xs"
                            >
                              {formatGroupType(group.type)}
                            </Badge>
                          </VStack>
                          
                          {group.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {group.description}
                            </Text>
                          )}
                          
                          <HStack spacing={4} fontSize="sm" color={textColor}>
                            <HStack spacing={1}>
                              <FiUsers />
                              <Text>{group.members?.length || 0} members</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <FiCalendar />
                              <Text>Created {formatDate(group.createdAt)}</Text>
                            </HStack>
                          </HStack>
                          
                          {group.department && (
                            <HStack spacing={2}>
                              <Badge variant="outline" fontSize="xs">
                                {group.department}
                                {group.year && ` • Year ${group.year}`}
                              </Badge>
                            </HStack>
                          )}
                          
                          {group.members && group.members.length > 0 && (
                            <HStack spacing={2}>
                              <Text fontSize="xs" color="gray.500">Members:</Text>
                              <AvatarGroup size="xs" max={5}>
                                {group.members.slice(0, 5).map((member) => (
                                  <Avatar
                                    key={member._id}
                                    name={member.name}
                                    src={member.profilePic}
                                    size="xs"
                                  />
                                ))}
                              </AvatarGroup>
                            </HStack>
                          )}
                        </VStack>
                      </Flex>
                      
                      <Button
                        leftIcon={<FiPlus />}
                        colorScheme="brand"
                        size="sm"
                        onClick={() => handleJoinGroup(group._id)}
                        isLoading={joiningGroupId === group._id}
                        loadingText="Joining..."
                        ml={4}
                      >
                        Join
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DiscoverGroupsModal; 