import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  View,
} from 'react-native';

const HEADER_HEIGHT = 14;

interface Props {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const BodyContainer = ({ children, header, footer }: Props) => {
  return (
    <View style={styles.flex}>
      {header}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 24,
  paddingBottom: 24,
  flexGrow: 1,
  justifyContent: 'center',
  marginTop: -HEADER_HEIGHT / 2,
  },
  footer: {
  paddingTop: 36,
  paddingBottom: 36,
  paddingLeft: 24,
  paddingRight: 24,
  backgroundColor: '#000',
},
});

export default BodyContainer;
