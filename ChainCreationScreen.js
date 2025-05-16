import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Dropdown } from 'react-native-element-dropdown';

const ChainCreationScreen = ({ user, navigation }) => {
  const [name, setName] = useState('');
  const [mainOffer, setMainOffer] = useState('');
  const [mainRequest, setMainRequest] = useState('');

  const [categories, setCategories] = useState([]);
  const [offerCat, setOfferCat] = useState(null);
  const [offerSub, setOfferSub] = useState(null);
  const [requestCat, setRequestCat] = useState(null);
  const [requestSub, setRequestSub] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await firestore().collection('categories').get();
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!name || !mainOffer || !mainRequest || !offerCat || !offerSub || !requestCat || !requestSub) {
      Alert.alert('Ошибка', 'Заполните все поля и выберите категории');
      return;
    }
    try {
      await firestore().collection('Chains').add({
        name,
        main_offer: mainOffer,
        main_offer_cat: { main: offerCat, sub: offerSub },
        main_request: mainRequest,
        main_request_cat: { main: requestCat, sub: requestSub },
        user_id: user.uid,
        listings: [],
        created_at: new Date()
      });
      navigation.goBack();
    } catch (error) {
      console.log(error)
      Alert.alert('Ошибка', 'Не удалось создать цепочку');
    }
  };

  const getSubs = (mainCat) => {
    const found = categories.find(c => c.name === mainCat);
    return found ? found.subs.map(s => ({ label: s, value: s })) : [];
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Название цепочки"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Основное предложение"
        placeholderTextColor="#999"
        value={mainOffer}
        onChangeText={setMainOffer}
        style={styles.input}
      />
      <Dropdown
        data={categories.map(c => ({ label: c.name, value: c.name }))}
        labelField="label"
        valueField="value"
        placeholder="Категория предложения"
        value={offerCat}
        onChange={item => {
          setOfferCat(item.value);
          setOfferSub(null);
        }}
        style={styles.input}
      />
      <Dropdown
        data={getSubs(offerCat)}
        labelField="label"
        valueField="value"
        placeholder="Подкатегория предложения"
        value={offerSub}
        onChange={item => setOfferSub(item.value)}
        style={styles.input}
        disabled={!offerCat}
      />

      <TextInput
        placeholder="Основной запрос"
        placeholderTextColor="#999"
        value={mainRequest}
        onChangeText={setMainRequest}
        style={styles.input}
      />
      <Dropdown
        data={categories.map(c => ({ label: c.name, value: c.name }))}
        labelField="label"
        valueField="value"
        placeholder="Категория запроса"
        value={requestCat}
        onChange={item => {
          setRequestCat(item.value);
          setRequestSub(null);
        }}
        style={styles.input}
      />
      <Dropdown
        data={getSubs(requestCat)}
        labelField="label"
        valueField="value"
        placeholder="Подкатегория запроса"
        value={requestSub}
        onChange={item => setRequestSub(item.value)}
        style={styles.input}
        disabled={!requestCat}
      />

      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.buttonText}>Создать цепочку</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  createButton: {
    backgroundColor: '#D16002',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default ChainCreationScreen;
