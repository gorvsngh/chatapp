import React, { useEffect, useState } from 'react';
import { Flex, useDisclosure, useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Group } from '../types';
import { groupAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import CreateGroupModal from '../components/CreateGroupModal';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchGroups();
  }, []);

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

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
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
      onClose();
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

  return (
    <Flex h="100vh">
      <Sidebar
        groups={groups}
        selectedGroup={selectedGroup}
        onGroupSelect={handleGroupSelect}
        onCreateGroup={onOpen}
      />
      {selectedGroup ? (
        <Chat
          group={selectedGroup}
          currentUser={user!}
        />
      ) : (
        <Flex
          flex="1"
          bg="chatBg"
          justify="center"
          align="center"
          fontSize="xl"
          color="gray.500"
        >
          Select a group to start chatting
        </Flex>
      )}
      <CreateGroupModal
        isOpen={isOpen}
        onClose={onClose}
        onCreate={handleCreateGroup}
      />
    </Flex>
  );
};

export default Groups; 