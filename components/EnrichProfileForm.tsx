import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import WunderButton from './WunderButton';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface EnrichProfileFormProps {
  userId: string; // from SecureStore
  onComplete: () => void;
}

const EnrichProfileForm: React.FC<EnrichProfileFormProps> = ({ userId, onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const savePersonalData = useMutation(api.savePersonalData.savePersonalData);

  const handleSubmit = async () => {
    if (!fullName || !email || !telephone || !dateOfBirth || !country || !city) {
      Alert.alert('Missing Fields', 'Please complete all fields.');
      return;
    }

    try {
      await savePersonalData({
        userId: userId as Id<'users'>,
        fullName,
        email,
        telephone,
        profilePhoto: '',
        dateOfBirth,
        country,
        city,
      });

      Alert.alert('Success', 'Profile data saved successfully!');
      onComplete();
    } catch (error) {
      console.error('Failed to save personal data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder="Enter full name"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Enter email"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Telephone</Text>
      <TextInput
        value={telephone}
        onChangeText={setTelephone}
        style={styles.input}
        placeholder="Enter telephone"
        keyboardType="phone-pad"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Country</Text>
      <TextInput
        value={country}
        onChangeText={setCountry}
        style={styles.input}
        placeholder="Enter country"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={styles.input}
        placeholder="Enter city"
        placeholderTextColor="#999"
      />

      <WunderButton
        title="Save Profile"
        variant="primary"
        onPress={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  label: { color: 'white', fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 10,
    color: 'white',
    backgroundColor: '#1e1e1e',
  },
});

export default EnrichProfileForm;
