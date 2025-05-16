import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const ChainScreen = ({ user, navigation }) => {
  const [chains, setChains] = useState([]);

  const fetchChains = async () => {
    const query = await firestore()
      .collection('Chains')
      .where('user_id', '==', user.uid)
      .get();
    
    const chainsData = query.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setChains(chainsData);
  };

  const deleteChain = async (chainId) => {
    Alert.alert(
      'Удалить цепочку',
      'Вы уверены, что хотите удалить эту цепочку?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          onPress: async () => {
            await firestore().collection('Chains').doc(chainId).delete();
            fetchChains();
          }
        }
      ]
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchChains();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chains}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chainItem}
            onPress={() => navigation.navigate('SingleChain', { chainId: item.id })}
          >
            <View style={styles.chainInfo}>
              <Text style={styles.chainName}>{item.name}</Text>
              <Text>Предложение: {item.main_offer.text}</Text>
              <Text>Запрос: {item.main_request.text}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteChain(item.id)}>
              <Icon name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
                          Нет активных цепочек
                        </Text>
           </View>
        )}
        style={{ flex: 1 }}
        contentContainerStyle={chains.length === 0 ? { flexGrow: 1 } : null}
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('ChainCreation', { uid: user.id })}
      >
        <Icon name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Создать новую цепочку</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  chainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  chainInfo: { flex: 1 },
  chainName: { fontSize: 16, fontWeight: 'bold' },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#D16002',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold'
  }
});

export default ChainScreen;
