import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { HOLDER } from '../conf'; 

const OtherProfileScreen = ({ route, navigation }) => {
  const { uid } = route.params;
  const [userData, setUserData] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndListings = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(uid).get();
        if (userDoc.exists) {
          setUserData(userDoc.data());
        }
        const listingsSnap = await firestore()
          .collection('Listings')
          .where('user_id', '==', uid)
          .get();
        setUserListings(
          listingsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null,
          }))
        );
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndListings();
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text>Пользователь не найден</Text>
      </View>
    );
  }

  const renderListingCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Listing', { uid: item.id })}
    >
      <View style={styles.card}>
        {item.photo && item.photo.length > 0 ? (
          <Image style={styles.listImage} source={{ uri: item.photo[0] }} />
        ) : (
          <Image style={styles.listImage} source={{ uri: HOLDER }} />
        )}
        <View style={styles.textArea}>
          <Text style={styles.nameText}>{item.title}</Text>
          <Text>
            {item.cat
              ? `Категория: ${item.cat.main} - ${item.cat.sub}`
              : ''}
          </Text>
          <Text>
            {item.ex_cat && item.ex_cat.subs && item.ex_cat.subs.length
              ? `Интересует: ${item.ex_cat.subs.join(', \n')}`
              : ''}
          </Text>
          <Text style={styles.userText}>{'\nОписание'}</Text>
          <Text style={styles.userText}>{item.desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={{ uri: userData.photo }} style={styles.photo} />
      <Text style={styles.name}>{userData.name}</Text>
      <Text style={styles.about}>{userData.aboutMe || 'Информация отсутствует'}</Text>

      <Button style={[styles.btn, styles.button]}
        title="Написать"
        onPress={() => navigation.navigate('Chats', { uid: uid })}
      />

      <Text style={styles.listingsTitle}>Объявления пользователя:</Text>
      {userListings.length === 0 ? (
        <Text>Объявления отсутствуют</Text>
      ) : (
        <FlatList
          data={userListings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingCard}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  photo: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, alignSelf: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  about: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#555' },
  listingsTitle: { fontSize: 20, marginTop: 20, marginBottom: 12, fontWeight: '600' },
  card: {
    width: '100%',
    marginVertical: 6,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  textArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        width: '40%'
  },
  btn: {
    backgroundColor: '#017D7D'
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userText: {
    fontSize: 14,
    color: '#555',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default OtherProfileScreen;
