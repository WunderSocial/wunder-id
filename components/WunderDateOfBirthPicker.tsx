import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

type DateOfBirthPickerProps = {
  label?: string;
  value: string; // expects DD-MM-YYYY format
  onChange: (date: string) => void;
  placeholder?: string;
};

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  label = 'Date of Birth',
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
}) => {
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date('2000-01-01');
    const [day, month, year] = dateStr.split('-').map(Number);
    if (!day || !month || !year) return new Date('2000-01-01');
    return new Date(year, month - 1, day);
  };

  const date = parseDate(value);

  const [day, setDay] = useState(date.getDate().toString());
  const [month, setMonth] = useState((date.getMonth() + 1).toString());
  const [year, setYear] = useState(date.getFullYear().toString());

  const [openDay, setOpenDay] = useState(false);
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  useEffect(() => {
    const newDate = parseDate(value);
    const newDay = newDate.getDate().toString();
    const newMonth = (newDate.getMonth() + 1).toString();
    const newYear = newDate.getFullYear().toString();

    if (newDay !== day) setDay(newDay);
    if (newMonth !== month) setMonth(newMonth);
    if (newYear !== year) setYear(newYear);
  }, [value]);

  useEffect(() => {
    const formatted = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    onChange(formatted);
  }, [day, month, year]);

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));
  const months = [
    { label: 'Jan', value: '1' },
    { label: 'Feb', value: '2' },
    { label: 'Mar', value: '3' },
    { label: 'Apr', value: '4' },
    { label: 'May', value: '5' },
    { label: 'Jun', value: '6' },
    { label: 'Jul', value: '7' },
    { label: 'Aug', value: '8' },
    { label: 'Sep', value: '9' },
    { label: 'Oct', value: '10' },
    { label: 'Nov', value: '11' },
    { label: 'Dec', value: '12' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: `${currentYear - i}`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <View style={styles.column}>
          <DropDownPicker
            open={openDay}
            value={day}
            items={days}
            setOpen={setOpenDay}
            setValue={setDay}
            style={styles.picker}
            dropDownContainerStyle={styles.dropdown}
            listItemLabelStyle={{ color: '#fff' }}
            textStyle={{ color: '#fff' }}
            placeholder="Day"
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>
        <View style={styles.column}>
          <DropDownPicker
            open={openMonth}
            value={month}
            items={months}
            setOpen={setOpenMonth}
            setValue={setMonth}
            style={styles.picker}
            dropDownContainerStyle={styles.dropdown}
            listItemLabelStyle={{ color: '#fff' }}
            textStyle={{ color: '#fff' }}
            placeholder="Month"
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>
        <View style={styles.column}>
          <DropDownPicker
            open={openYear}
            value={year}
            items={years}
            setOpen={setOpenYear}
            setValue={setYear}
            style={styles.picker}
            dropDownContainerStyle={styles.dropdown}
            listItemLabelStyle={{ color: '#fff' }}
            textStyle={{ color: '#fff' }}
            placeholder="Year"
            zIndex={1000}
            zIndexInverse={3000}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1100,
    width: '100%',
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  column: {
    flex: 1,
    
  },
  picker: {
    backgroundColor: '#222',
    borderColor: '#444',
  },
  dropdown: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
});

export default DateOfBirthPicker;
