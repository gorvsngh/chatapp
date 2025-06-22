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
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  FormErrorMessage,
  Box,
  Text,
  Avatar,
  Flex,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { User } from '../types';
import api from '../services/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; type: string; department?: string; year?: number; members: string[] }) => void;
}

interface FormData {
  name: string;
  description: string;
  type: string;
  department?: string;
  year?: number;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const groupType = watch('type');

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddMember = (user: User) => {
    if (!selectedMembers.find(member => member._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== userId));
  };

  const onSubmit = (data: FormData) => {
    const memberIds = selectedMembers.map(member => member._id).filter((id): id is string => id !== undefined);
    onCreate({
      ...data,
      members: memberIds,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Group Name</FormLabel>
                <Input
                  {...register('name', {
                    required: 'Group name is required',
                    minLength: {
                      value: 3,
                      message: 'Group name must be at least 3 characters',
                    },
                  })}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Input
                  {...register('description', {
                    required: 'Description is required',
                  })}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.type}>
                <FormLabel>Group Type</FormLabel>
                <Select
                  {...register('type', {
                    required: 'Group type is required',
                  })}
                >
                  <option value="">Select Type</option>
                  <option value="department">Department</option>
                  <option value="class">Class</option>
                  <option value="general">General</option>
                </Select>
                <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
              </FormControl>

              {groupType === 'department' && (
                <FormControl isInvalid={!!errors.department}>
                  <FormLabel>Department</FormLabel>
                  <Select
                    {...register('department', {
                      required: 'Department is required for department groups',
                    })}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                  </Select>
                  <FormErrorMessage>{errors.department?.message}</FormErrorMessage>
                </FormControl>
              )}

              {groupType === 'class' && (
                <FormControl isInvalid={!!errors.year}>
                  <FormLabel>Year</FormLabel>
                  <Select
                    {...register('year', {
                      required: 'Year is required for class groups',
                    })}
                  >
                    <option value="">Select Year</option>
                    <option value="1">First Year</option>
                    <option value="2">Second Year</option>
                    <option value="3">Third Year</option>
                    <option value="4">Fourth Year</option>
                  </Select>
                  <FormErrorMessage>{errors.year?.message}</FormErrorMessage>
                </FormControl>
              )}

              {/* Member Selection */}
              <FormControl>
                <FormLabel>Add Members</FormLabel>
                <VStack spacing={3} align="stretch">
                  {/* Search Input */}
                  <InputGroup>
                    <InputLeftElement>
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search users by name or registration number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <Box
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                    >
                      <List spacing={0}>
                        {searchResults.map((user) => (
                          <ListItem
                            key={user._id}
                            p={3}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() => handleAddMember(user)}
                          >
                            <Flex align="center">
                              <Avatar size="sm" name={user.name} mr={3} />
                              <Box flex="1">
                                <Text fontWeight="medium">{user.name}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {user.regNo} • {user.role}
                                </Text>
                              </Box>
                            </Flex>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Selected Members */}
                  {selectedMembers.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Selected Members ({selectedMembers.length})
                      </Text>
                      <VStack spacing={2} align="stretch">
                        {selectedMembers.map((member) => (
                          <Flex
                            key={member._id}
                            align="center"
                            p={2}
                            bg="gray.50"
                            borderRadius="md"
                            justify="space-between"
                          >
                            <Flex align="center">
                              <Avatar size="sm" name={member.name} mr={2} />
                              <Box>
                                <Text fontSize="sm" fontWeight="medium">
                                  {member.name}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  {member.regNo} • {member.role}
                                </Text>
                              </Box>
                            </Flex>
                            <IconButton
                              size="sm"
                              icon={<CloseIcon />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleRemoveMember(member._id!)}
                              aria-label="Remove member"
                            />
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="whatsapp"
              type="submit"
              isLoading={isSubmitting}
            >
              Create Group
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateGroupModal; 