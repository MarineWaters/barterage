import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/ionicons';
import { HOLDER } from '../conf';
import { YaMap, Marker } from 'react-native-yamap-plus';


const ListingScreen = ({ route, navigation }) => {
  const [list, setList] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const { uid } = route.params;
  const [isOwner, setIsOwner] = useState(false);
  const [selectedChain, setSelectedChain] = useState('');
  const [userChains, setUserChains] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChains = async () => {
    try {
      const query = await firestore()
        .collection('Chains')
        .where('user_id', '==', auth().currentUser.uid)
        .get();
      
      setUserChains(query.docs.map(doc => ({
        label: doc.data().name,
        value: doc.id
      })));
    } catch (error) {
      console.error('Ошибка получения цепочек:', error);
    }
  };

  const fetchCreatorData = async (userId) => {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists) {
        setCreatorData(userDoc.data());
      }
    } catch (error) {
      console.error('Ошибка получения создателя:', error);
    }
  };

  const getListing = async () => {
    try {
      setLoading(true);
      const doc = await firestore().collection('Listings').doc(uid).get();
      if (doc.exists) {
        const listingData = { id: doc.id, ...doc.data() };
        setList(listingData);

        const currentUser = auth().currentUser;
        setIsOwner(currentUser ? listingData.user_id === currentUser.uid : false);
        
        if (listingData.user_id && !isOwner) {
          await fetchCreatorData(listingData.user_id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getListing();
    fetchChains();
  }, [uid]);

  useFocusEffect(
    React.useCallback(() => {
      getListing();
      fetchChains();
    }, [uid])
  );

  const handleEditPress = () => {
    navigation.navigate('Edit', { listing: list });
  };

  const handleAddToChain = async () => {
    if (!selectedChain) {
      Alert.alert('Ошибка', 'Выберите цепочку');
      return;
    }

    try {
      await firestore()
        .collection('Chains')
        .doc(selectedChain)
        .update({
          listings: firestore.FieldValue.arrayUnion(uid)
        });
      
      Alert.alert('Успешно', 'Объявление добавлено в цепочку');
    } catch (error) {
      console.error('Ошибка добавления в цепочку:', error);
      Alert.alert('Ошибка', 'Не удалось добавить в цепочку');
    }
  };

  const formatRussianDate = (date) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  if (loading || !list) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D16002" />
        <Text>Загрузка данных...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.Contain}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <ScrollView horizontal style={styles.imageContainer}>
          {list.photo && list.photo.length > 0 ? (
            list.photo.map((uri, index) => (
              <Image key={index} style={styles.listImage} source={{ uri }} />
            ))
          ) : (
            <Image
              style={styles.listImage}
              source={{ uri: HOLDER }}
            />
          )}
        </ScrollView>

        <Text style={styles.nameText}>{list.title}</Text>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Категория</Text>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>Основная: {list.cat.main}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>Подкатегория: {list.cat.sub}</Text>
            </View>
          </View>
          
          {list.ex_cat?.main?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Интересующие категории:</Text>
              <View style={styles.categoryRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {list.ex_cat.subs.join(', \n')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.descriptionText}>{list.desc}</Text>
        </View>

{list.located && list.geolocation && (
  <View style={{ height: 300, marginVertical: 16, borderRadius: 16, overflow: 'hidden' }}>
    <Text style={styles.sectionTitle}>Удобная локация обмена</Text>
    <YaMap
      style={{ flex: 1 }}
      initialRegion={{
        lat: list.geolocation.latitude,
        lon: list.geolocation.longitude,
        zoom: 14,
        azimuth: 0,
        tilt: 0,
      }}
      zoomEnabled
      rotateEnabled
      scrollEnabled
      nightMode={false}
      showUserPosition={false}
    >
      <Marker
        point={{
          lat: list.geolocation.latitude,
          lon: list.geolocation.longitude,
        }}
        source={{ uri: 'https://www.pngall.com/wp-content/uploads/2017/05/Map-Marker-Free-Download-PNG.png' }}
        scale={0.3}
        anchor={{ x: 0.5, y: 1 }}
      />
    </YaMap>
  </View>
)}


        {list.r_price && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ценовая информация</Text>
            <Text style={styles.priceText}>
              Относительная цена товара согласно маркетплейсам: {list.r_price} ₽
            </Text>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Дата публикации</Text>
          <Text style={styles.dateText}>
            {list.timestamp ? formatRussianDate(list.timestamp.toDate()) : 'Нет данных'}
          </Text>
        </View>

        {!isOwner && creatorData && (
          <View style={styles.creatorContainer}>
            <View style={styles.creatorInfo}>
              <TouchableOpacity onPress={() => navigation.navigate('OtherProfile', { uid: creatorData.uid })}>
                              {creatorData.photo ? (
                <Image source={{ uri: creatorData.photo }} style={styles.creatorImage} />
              ) : (
                <Icon name="person-circle-outline" size={50} color="#D16002" />
              )}
                              </TouchableOpacity>
              
              <Text style={styles.usernameText}>{creatorData.name}</Text>
              <Text>{creatorData.aboutMe}</Text>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('Chats', { 
                  uid: list.user_id, 
                  docid: null,
                  name: creatorData.name || 'Пользователь'
                })}
              >
                <Text style={styles.chatButtonText}>Начать чат</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOwner && (
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Text style={styles.editButtonText}>Изменить объявление</Text>
          </TouchableOpacity>
        )}

        {userChains.length > 0 && (
          <View style={styles.chainSection}>
            <Picker
              selectedValue={selectedChain}
              onValueChange={setSelectedChain}
              style={styles.picker}
            >
              <Picker.Item label="Выберите цепочку" value="" color='#888' />
              {userChains.map(chain => (
                <Picker.Item key={chain.value} label={chain.label} value={chain.value} color='#017D7D' />
              ))}
            </Picker>
            <TouchableOpacity 
              style={styles.addChainButton} 
              onPress={handleAddToChain}
            >
              <Text style={styles.addChainText}>Добавить в цепочку</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Contain: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  listImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginRight: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  usernameText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#D16002',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  categoryBadge: {
    backgroundColor: '#e8e8e8',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#017D7D',
    marginTop: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  creatorContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  creatorInfo: {
    alignItems: 'center',
  },
  creatorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  chatButton: {
    backgroundColor: '#017D7D',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 10,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#D16002',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chainSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
  },
  addChainButton: {
    backgroundColor: '#D16002',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addChainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default ListingScreen;

