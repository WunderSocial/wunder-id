import React, { useState, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { View, Text, StyleSheet } from 'react-native';

const CountrySelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  // Sync internal state when `value` prop changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const items = [
    { label: '🇬🇧 United Kingdom', value: 'UK' },
    { label: '🇺🇸 United States', value: 'US' },
    { label: '────────────', value: 'separator', disabled: true },
    { label: '🇦🇫 Afghanistan', value: 'AF' },
    { label: '🇦🇱 Albania', value: 'AL' },
    { label: '🇩🇿 Algeria', value: 'DZ' },
    { label: '🇦🇩 Andorra', value: 'AD' },
    { label: '🇦🇴 Angola', value: 'AO' },
    { label: '🇦🇮 Anguilla', value: 'AI' },
    { label: '🇦🇶 Antarctica', value: 'AQ' },
    { label: '🇦🇬 Antigua and Barbuda', value: 'AG' },
    { label: '🇦🇷 Argentina', value: 'AR' },
    { label: '🇦🇲 Armenia', value: 'AM' },
    { label: '🇦🇼 Aruba', value: 'AW' },
    { label: '🇦🇺 Australia', value: 'AU' },
    { label: '🇦🇹 Austria', value: 'AT' },
    { label: '🇦🇿 Azerbaijan', value: 'AZ' },
    { label: '🇧🇸 Bahamas', value: 'BS' },
    { label: '🇧🇭 Bahrain', value: 'BH' },
    { label: '🇧🇩 Bangladesh', value: 'BD' },
    { label: '🇧🇧 Barbados', value: 'BB' },
    { label: '🇧🇾 Belarus', value: 'BY' },
    { label: '🇧🇪 Belgium', value: 'BE' },
    { label: '🇧🇿 Belize', value: 'BZ' },
    { label: '🇧🇯 Benin', value: 'BJ' },
    { label: '🇧🇲 Bermuda', value: 'BM' },
    { label: '🇧🇹 Bhutan', value: 'BT' },
    { label: '🇧🇴 Bolivia', value: 'BO' },
    { label: '🇧🇦 Bosnia and Herzegovina', value: 'BA' },
    { label: '🇧🇼 Botswana', value: 'BW' },
    { label: '🇧🇷 Brazil', value: 'BR' },
    { label: '🇧🇳 Brunei', value: 'BN' },
    { label: '🇧🇬 Bulgaria', value: 'BG' },
    { label: '🇧🇫 Burkina Faso', value: 'BF' },
    { label: '🇧🇮 Burundi', value: 'BI' },
    { label: '🇰🇭 Cambodia', value: 'KH' },
    { label: '🇨🇲 Cameroon', value: 'CM' },
    { label: '🇨🇦 Canada', value: 'CA' },
    { label: '🇨🇻 Cape Verde', value: 'CV' },
    { label: '🇨🇫 Central African Republic', value: 'CF' },
    { label: '🇹🇩 Chad', value: 'TD' },
    { label: '🇨🇱 Chile', value: 'CL' },
    { label: '🇨🇳 China', value: 'CN' },
    { label: '🇨🇴 Colombia', value: 'CO' },
    { label: '🇰🇲 Comoros', value: 'KM' },
    { label: '🇨🇩 Congo (DRC)', value: 'CD' },
    { label: '🇨🇬 Congo (Republic)', value: 'CG' },
    { label: '🇨🇷 Costa Rica', value: 'CR' },
    { label: '🇭🇷 Croatia', value: 'HR' },
    { label: '🇨🇺 Cuba', value: 'CU' },
    { label: '🇨🇾 Cyprus', value: 'CY' },
    { label: '🇨🇿 Czech Republic', value: 'CZ' },
    { label: '🇩🇰 Denmark', value: 'DK' },
    { label: '🇩🇯 Djibouti', value: 'DJ' },
    { label: '🇩🇲 Dominica', value: 'DM' },
    { label: '🇩🇴 Dominican Republic', value: 'DO' },
    { label: '🇪🇨 Ecuador', value: 'EC' },
    { label: '🇪🇬 Egypt', value: 'EG' },
    { label: '🇸🇻 El Salvador', value: 'SV' },
    { label: '🇬🇶 Equatorial Guinea', value: 'GQ' },
    { label: '🇪🇷 Eritrea', value: 'ER' },
    { label: '🇪🇪 Estonia', value: 'EE' },
    { label: '🇸🇿 Eswatini', value: 'SZ' },
    { label: '🇪🇹 Ethiopia', value: 'ET' },
    { label: '🇫🇯 Fiji', value: 'FJ' },
    { label: '🇫🇮 Finland', value: 'FI' },
    { label: '🇫🇷 France', value: 'FR' },
    // ... you can continue the list if needed
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <DropDownPicker
        open={open}
        value={selectedValue}
        items={items}
        setOpen={setOpen}
        setValue={(cb) => {
          const newValue = cb(selectedValue);
          setSelectedValue(newValue);
          onChange(newValue);
        }}
        placeholder={placeholder || 'Select your country'}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        placeholderStyle={{ color: '#888' }}
        textStyle={{ color: '#fff' }}
        listItemLabelStyle={{ color: '#fff' }}
        selectedItemLabelStyle={{ color: '#0af' }}
        disabledItemLabelStyle={{ color: '#888' }}
        zIndex={1000}
        zIndexInverse={1000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dropdown: {
    backgroundColor: '#222',
    borderColor: '#444',
  },
  dropdownContainer: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
});

export default CountrySelect;