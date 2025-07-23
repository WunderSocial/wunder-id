import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

type IdentityTask = {
  title: string;
  completed: boolean;
  issuedDate?: string;
  renewalDate?: string;
};

const tasks: IdentityTask[] = [
  {
    title: 'Basic Profile',
    completed: true,
    issuedDate: '2024-05-01',
    renewalDate: '2029-05-01',
  },
  {
    title: 'Verified Email',
    completed: true,
    issuedDate: '2024-06-12',
    renewalDate: '2026-06-12',
  },
  {
    title: 'Verified Mobile Phone',
    completed: false,
  },
  {
    title: 'Liveness Check',
    completed: false,
  },
  {
    title: 'Proof of Identity',
    completed: true,
    issuedDate: '2023-10-01',
    renewalDate: '2033-10-01',
  },
  {
    title: 'Proof of Address',
    completed: false,
  },
];

const IdentityCards = () => {
  const handleComplete = (title: string) => {
    console.log(`Trigger completion for: ${title}`);
  };

  const handleReplace = (title: string) => {
    console.log(`Trigger NFT replacement for: ${title}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Identities</Text>
      {tasks.map((task, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{task.title}</Text>
            <Icon
              name={task.completed ? 'check-circle' : 'x-circle'}
              size={20}
              color={task.completed ? 'green' : 'red'}
            />
          </View>

          {task.completed && (
            <>
              <Text style={styles.cardText}>Issued: {task.issuedDate}</Text>
              <Text style={styles.cardText}>Renew by: {task.renewalDate}</Text>

              <Pressable style={styles.replaceButton} onPress={() => handleReplace(task.title)}>
                <Text style={styles.replaceButtonText}>Update</Text>
              </Pressable>
            </>
          )}

          {!task.completed && (
            <Pressable style={styles.iconButton} onPress={() => handleComplete(task.title)}>
              <Icon name="arrow-right-circle" size={18} color="black" />
              <Text style={styles.iconButtonText}>Complete</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cardText: {
    color: 'lightgray',
    fontSize: 14,
    marginTop: 2,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff403',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  iconButtonText: {
    color: 'black',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  replaceButton: {
    backgroundColor: '#444',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  replaceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default IdentityCards;
