import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import EnrichProfileForm from './EnrichProfileForm';
import WunderButton from './WunderButton';

type CredentialType =
  | 'profile'
  | 'email_confirm'
  | 'phone_confirm'
  | 'liveness_check'
  | 'KYC_approved'
  | 'AML_approved';

interface Props {
  userId: string; // raw string from SecureStore
}

const orderedCredentials: CredentialType[] = [
  'profile',
  'email_confirm',
  'phone_confirm',
  'liveness_check',
  'KYC_approved',
  'AML_approved',
];

const CredentialTasks: React.FC<Props> = ({ userId }) => {
  const [activeCredential, setActiveCredential] = useState<CredentialType | null>(null);
  const [credentials, setCredentials] = useState<Record<CredentialType, boolean>>({
    profile: false,
    email_confirm: false,
    phone_confirm: false,
    liveness_check: false,
    KYC_approved: false,
    AML_approved: false,
  });

  // Fetch credential status for each one
  const fetchedCredentials = useQuery(api.credentials.getUserCredentials, {
    userId: userId as Id<'users'>,
  });

  useEffect(() => {
    if (fetchedCredentials) {
      const newState = { ...credentials };
      for (const c of fetchedCredentials) {
        newState[c.type as CredentialType] = true;
      }
      setCredentials(newState);
    }
  }, [fetchedCredentials]);

  const getNextIncomplete = () =>
    orderedCredentials.find((cred) => !credentials[cred]);

  const handleCompleted = () => {
    setActiveCredential(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Identity Verification Tasks</Text>

      {orderedCredentials.map((type) => {
        const completed = credentials[type];
        const enabled = !completed && getNextIncomplete() === type;

        return (
          <View key={type} style={styles.card}>
            <Text style={styles.cardTitle}>{type.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.status}>
              {completed ? '✅ Completed' : enabled ? 'Ready to complete' : '🔒 Locked'}
            </Text>
            {!completed && enabled && (
              <WunderButton title="Complete" onPress={() => setActiveCredential(type)} />
            )}
          </View>
        );
      })}

      {/* Inline forms: render only the one currently active */}
      {activeCredential === 'profile' && (
        <EnrichProfileForm userId={userId} onComplete={handleCompleted} />
      )}

      {/* Add other credential forms here like:
          {activeCredential === 'email_confirm' && <EmailVerifyForm ... />}
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  card: {
    borderColor: '#fff403',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#111',
  },
  cardTitle: { fontSize: 16, color: 'white', marginBottom: 4 },
  status: { fontSize: 14, color: '#ccc', marginBottom: 8 },
});

export default CredentialTasks;
