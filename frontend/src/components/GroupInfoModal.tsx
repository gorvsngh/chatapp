import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  Divider,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  IconButton,
  Flex,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  AvatarGroup,
  Button,
  Spacer
} from '@chakra-ui/react';
import { FiUsers, FiCalendar, FiBook, FiEdit3, FiUserPlus, FiMoreVertical } from 'react-icons/fi';
import { Group, User } from '../types';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUser: User;
  canEdit?: boolean;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  canEdit = false
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const isAdmin = group.admins?.some(admin => admin._id === currentUser._id) || false;
  const isCreator = group.createdBy?._id === currentUser._id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pb={2}>
          <Flex align="center">
            <Text>Group Info</Text>
            <Spacer />
            {(isAdmin || isCreator) && (
              <IconButton
                aria-label="More options"
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
              />
            )}
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Group Header */}
            <Card>
              <CardBody>
                <VStack spacing={4}>
                  <Avatar
                    size="2xl"
                    name={group.name}
                    border="3px solid"
                    borderColor="brand.100"
                  />
                  
                  <VStack spacing={2}>
                    <Heading as="h2" size="lg" textAlign="center" color="gray.800">
                      {group.name}
                    </Heading>
                    <Badge
                      colorScheme={getGroupTypeColor(group.type)}
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="sm"
                    >
                      {formatGroupType(group.type)}
                    </Badge>
                  </VStack>

                  {(isAdmin || isCreator) && (
                    <HStack spacing={2}>
                      <Button size="sm" leftIcon={<FiEdit3 />} variant="outline">
                        Edit Info
                      </Button>
                      <Button size="sm" leftIcon={<FiUserPlus />} variant="outline">
                        Add Member
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Group Stats */}
            <SimpleGrid columns={3} spacing={4}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor} fontSize="xs">
                      <FiUsers style={{ display: 'inline', marginRight: '4px' }} />
                      Members
                    </StatLabel>
                    <StatNumber fontSize="xl" color="gray.800">
                      {group.members?.length || 0}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel color={textColor} fontSize="xs">
                      <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                      Created
                    </StatLabel>
                    <StatNumber fontSize="sm" color="gray.800">
                      {formatDate(group.createdAt).split(',')[0]}
                    </StatNumber>
                    <StatHelpText fontSize="xs">
                      {formatDate(group.createdAt).split(',')[1]}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              {group.department && (
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel color={textColor} fontSize="xs">
                        <FiBook style={{ display: 'inline', marginRight: '4px' }} />
                        Department
                      </StatLabel>
                      <StatNumber fontSize="sm" color="gray.800">
                        {group.department}
                      </StatNumber>
                      {group.year && (
                        <StatHelpText fontSize="xs">
                          Year {group.year}
                        </StatHelpText>
                      )}
                    </Stat>
                  </CardBody>
                </Card>
              )}
            </SimpleGrid>

            {/* Description */}
            {group.description && (
              <Card>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Heading as="h3" size="sm" color="gray.800">
                      Description
                    </Heading>
                    <Text color={textColor} fontSize="sm" lineHeight="1.6">
                      {group.description}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Group Admins */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading as="h3" size="sm" color="gray.800">
                    Group Admins
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    {/* Creator */}
                    {group.createdBy && (
                      <HStack>
                        <Avatar
                          size="md"
                          name={group.createdBy.name}
                          src={group.createdBy.profilePic}
                        />
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontWeight="600" fontSize="sm" color="gray.800">
                            {group.createdBy.name}
                          </Text>
                          <HStack spacing={2}>
                            <Badge colorScheme="green" size="sm">
                              Creator
                            </Badge>
                            <Text fontSize="xs" color={textColor}>
                              {group.createdBy.email}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    )}

                    {/* Other Admins */}
                    {group.admins?.filter(admin => admin._id !== group.createdBy?._id).map((admin) => (
                      <HStack key={admin._id}>
                        <Avatar
                          size="md"
                          name={admin.name}
                          src={admin.profilePic}
                        />
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontWeight="600" fontSize="sm" color="gray.800">
                            {admin.name}
                          </Text>
                          <HStack spacing={2}>
                            <Badge colorScheme="blue" size="sm">
                              Admin
                            </Badge>
                            <Text fontSize="xs" color={textColor}>
                              {admin.email}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    )) || []}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Members List */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading as="h3" size="sm" color="gray.800">
                      Members ({group.members?.length || 0})
                    </Heading>
                    <AvatarGroup size="sm" max={5}>
                      {group.members?.slice(0, 5).map((member) => (
                        <Avatar
                          key={member._id}
                          name={member.name}
                          src={member.profilePic}
                        />
                      )) || []}
                    </AvatarGroup>
                  </Flex>
                  
                  <VStack spacing={3} align="stretch" maxH="300px" overflowY="auto">
                    {group.members?.map((member) => (
                      <HStack key={member._id}>
                        <Avatar
                          size="md"
                          name={member.name}
                          src={member.profilePic}
                        />
                        <VStack align="start" spacing={0} flex="1">
                          <HStack>
                            <Text fontWeight="600" fontSize="sm" color="gray.800">
                              {member.name}
                            </Text>
                            {member._id === currentUser._id && (
                              <Badge colorScheme="gray" size="sm">
                                You
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={2}>
                            <Badge
                              colorScheme={member.role === 'admin' ? 'red' : member.role === 'hod' ? 'purple' : member.role === 'teacher' ? 'blue' : 'green'}
                              size="sm"
                              variant="subtle"
                            >
                              {member.role}
                            </Badge>
                            <Text fontSize="xs" color={textColor}>
                              {member.email}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    )) || []}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GroupInfoModal; 