import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const MultiSelectDropdown = ({ items, onSelectionChange }) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelection = (item) => {
    if (selectedItems.includes(item)) {
      const updatedSelection = selectedItems.filter((i) => i !== item);
      setSelectedItems(updatedSelection);
      onSelectionChange(updatedSelection);
    } else {
      const updatedSelection = [...selectedItems, item];
      setSelectedItems(updatedSelection);
      onSelectionChange(updatedSelection);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedItems.includes(item) && styles.selectedItem]}
      onPress={() => toggleSelection(item)}
    >
      <Text style={styles.itemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

MultiSelectDropdown.propTypes = {
  items: PropTypes.array.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
};

const MultiselectSample = () => {
  const languages = ['Tamil', 'Telungu', 'Malayalam', 'Kannada', 'Hindi'];
  const handleSelectionChange = (selectedItems) => {
    //console.log('Selected Languages:', selectedItems);
  };

  return (
    <View style={styles.appContainer}>
      <MultiSelectDropdown
        items={languages}
        onSelectionChange={handleSelectionChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedItem: {
    backgroundColor: '#cce5ff',
  },
  itemText: {
    fontSize: 16,
  },
});

export default MultiselectSample;
