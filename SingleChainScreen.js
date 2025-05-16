import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Modal, FlatList } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import firestore from '@react-native-firebase/firestore';
import Icon from '@react-native-vector-icons/ionicons';
import { HOLDER } from '../conf';
import { Dropdown } from 'react-native-element-dropdown'; 

const SingleChainScreen = ({ route, navigation }) => {
  const { chainId } = route.params;
  const [chainName, setChainName] = useState('');
  const [mainOffer, setMainOffer] = useState('');
  const [mainRequest, setMainRequest] = useState('');
const [uid, setUid] = useState('');
  const [offerCat, setOfferCat] = useState(null);
  const [offerSub, setOfferSub] = useState(null);
  const [requestCat, setRequestCat] = useState(null);
  const [requestSub, setRequestSub] = useState(null);
  const [listings, setListings] = useState([]);
  const [isEditing, setIsEditing] = useState(false);


  const itemRefs = useRef(new Map());
 const [categoriesData, setCategoriesData] = useState(null);
const [loadingCategories, setLoadingCategories] = useState(true);
const [modalVisible, setModalVisible] = useState(false);
const [foundChain, setFoundChain] = useState(null);

const handleFindOptimalChain = async () => {
  const allListingsSnap = await firestore().collection('Listings').get();
  const allListings = allListingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const startOffer = { main: offerCat, sub: offerSub };
  const targetRequest = { main: [requestCat], subs: requestSub ? [requestSub] : [] };
  const chain = await findOptimalChain(startOffer, targetRequest, allListings);

  if (chain && chain.length > 0) {
    setFoundChain(chain);
    setModalVisible(true);
  } else {
    Alert.alert('Не найдено', 'Не удалось найти подходящую цепочку.');
  }
};

async function findOptimalChain(startOffer, targetRequest, allListings) {
  let queue = [];
  let visited = new Set();
  let paths = {};
  for (let listing of allListings) {
    if (listing.ex_cat.subs.includes(startOffer.main + ' - '+startOffer.sub)) {
      queue.push(listing);
      paths[listing.id] = [listing];
      visited.add(listing.id);
    }
  }

  while (queue.length > 0) {
    let current = queue.shift();
    console.log('curr'+current)
    if (targetRequest.subs.includes(current.cat.sub)) {
      return paths[current.id];
    }
    for (let next of allListings) {
      if (!visited.has(next.id) && next.ex_cat.subs.includes(current.cat.sub)) {
        queue.push(next);
        paths[next.id] = [...paths[current.id], next];
        visited.add(next.id);
      }
    }
  }
  return null;
}
useEffect(() => {
    let unsubscribe;
    const loadData = async () => {
      try {
        unsubscribe = firestore()
          .collection('Chains')
          .doc(chainId)
          .onSnapshot(async doc => {
            const data = doc.data();
            if (data) {
              setChainName(data.name || '');
              setMainOffer(data.main_offer.text || '');
              setMainRequest(data.main_request.text || '');
              setUid(data.user_id || '')
              setOfferCat(data.main_offer?.category || null);
              setOfferSub(data.main_offer?.subcategory || null);
              setRequestCat(data.main_request?.category || null);
              setRequestSub(data.main_request?.subcategory || null);

              if (data.listings?.length) {
                await fetchListingsDetails(data.listings);
              } else {
                setListings([]);
              }
            }
          });
      } catch (error) {
        console.error(error);
        Alert.alert('Ошибка', 'Не удалось загрузить данные цепочки');
      }
    };
    loadData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chainId]);
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const doc = await firestore()
        .collection('Categories')
        .doc('YWdWBjQnaViSvDCudPpr') 
        .get();
      if (doc.exists) {
        setCategoriesData(doc.data()); 
      } else {
        Alert.alert('Ошибка', 'Категории не найдены');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };
  fetchCategories();
}, []);


  const fetchListingsDetails = async listingIds => {
    try {
      const listingsData = await Promise.all(
        listingIds.map(async id => {
          const doc = await firestore().collection('Listings').doc(id).get();
          if (doc.exists) return { id: doc.id, ...doc.data() };
          else {
            console.warn(`Объявление с ID ${id} не найдено`);
            return null;
          }
        }),
      );
      setListings(listingsData.filter(l => l !== null));
    } catch (error) {
      console.error('Ошибка поиска объявлений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные объявлений');
    }
  };
const mainCategoriesData = categoriesData
  ? Object.keys(categoriesData).map(cat => ({ label: cat, value: cat }))
  : [];

const offerSubcategoriesData =
  offerCat && categoriesData && categoriesData[offerCat]
    ? categoriesData[offerCat].map(sub => ({ label: sub, value: sub }))
    : [];

const requestSubcategoriesData =
  requestCat && categoriesData && categoriesData[requestCat]
    ? categoriesData[requestCat].map(sub => ({ label: sub, value: sub }))
    : [];
  const getSubs = mainCat => {
    const found = categories.find(c => c.name === mainCat);
    return found ? found.subs.map(s => ({ label: s, value: s })) : [];
  };

  const handleDeleteListing = async itemId => {
    try {
      const newListings = listings.filter(l => l.id !== itemId);
      setListings(newListings);

      await firestore()
        .collection('Chains')
        .doc(chainId)
        .update({
          listings: newListings.map(l => l.id),
        });
    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      Alert.alert('Ошибка', 'Не удалось удалить элемент. Попробуйте снова.');
      fetchListingsDetails(listings.map(l => l.id));
    }
  };

  const handleNavigateToListing = listingId => {
    navigation.navigate('Listing', { uid: listingId });
  };

  const renderItem = ({ item, drag, isActive }) => {
    if (!item || !item.id) return null;

    return (
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={200}
        style={[styles.itemContainer, isActive && { backgroundColor: '#e0e0e0' }]}
      >
        <Image source={{ uri: item.photo?.[0] || HOLDER }} style={styles.listingImage} />
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{item.title || 'Без названия'}</Text>
          <Text>{item.cat?.sub || 'Без категории'}</Text>
        </View>

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => handleNavigateToListing(item.id)}
        >
          <Text style={styles.navigateButtonText}>Перейти</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteListing(item.id)}
          style={styles.deleteIconButton}
        >
          <Icon name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const handleDragEnd = async ({ data }) => {
    try {
      setListings(data);
      await firestore()
        .collection('Chains')
        .doc(chainId)
        .update({
          listings: data.map(item => item.id),
        });
    } catch (error) {
      console.error('Ошибка обновления порядка:', error);
      Alert.alert('Ошибка', 'Не удалось обновить порядок объявлений. Попробуйте снова.');
      fetchListingsDetails(listings.map(item => item.id));
    }
  };

  const saveChanges = async () => {
  if (!offerCat || !offerSub || !requestCat || !requestSub) {
    Alert.alert('Ошибка', 'Пожалуйста, выберите все категории и подкатегории');
    return;
  }
  try {
    await firestore()
      .collection('Chains')
      .doc(chainId)
      .update({
        name: chainName,
          main_offer: {text: mainOffer, category: offerCat, subcategory: offerSub},
          main_request: {text: mainRequest, category: requestCat, subcategory: requestSub}
      });
    setIsEditing(false);
    Alert.alert('Успешно', 'Данные цепочки обновлены');
  } catch (error) {
    console.error(error);
    Alert.alert('Ошибка', 'Не удалось обновить данные цепочки');
  }
};


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={chainName}
              onChangeText={setChainName}
              placeholder="Название цепочки"
              placeholderTextColor="#999"
            />
          ) : (
            <Text style={styles.chainTitle}>{chainName}</Text>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={isEditing ? saveChanges : () => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>{isEditing ? 'Сохранить' : 'Изменить'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Основное предложение:</Text>
          {isEditing ? (
            <>
              <TextInput
                style={styles.textInput}
                value={mainOffer}
                onChangeText={setMainOffer}
                multiline
                placeholder="Введите основное предложение"
                placeholderTextColor="#999"
              />
              <Dropdown
                data={mainCategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Категория предложения"
                value={offerCat}
                onChange={item => {
                  setOfferCat(item.value);
                  setOfferSub(null);
                }}
                style={styles.dropdown}
              />
              <Dropdown
                data={offerSubcategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Подкатегория предложения"
                value={offerSub}
                onChange={item => setOfferSub(item.value)}
                style={styles.dropdown}
                disabled={!offerCat}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionText}>{mainOffer || 'Не указано'}</Text>
              <Text style={styles.categoryText}>
                Категория: {offerCat || '-'}, Подкатегория: {offerSub || '-'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Объявления:</Text>
          <DraggableFlatList
            data={listings}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            onDragEnd={handleDragEnd}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyList}>
                <Text>Нет объявлений в этой цепочке</Text>
              </View>
            )}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Основной запрос:</Text>
          {isEditing ? (
            <>
              <TextInput
                style={styles.textInput}
                value={mainRequest}
                onChangeText={setMainRequest}
                multiline
                placeholder="Введите основной запрос"
                placeholderTextColor="#999"
              />
              <Dropdown
                data={mainCategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Категория запроса"
                value={requestCat}
                onChange={item => {
                  setRequestCat(item.value);
                  setRequestSub(null);
                }}
                style={styles.dropdown}
              />
              <Dropdown
                data={requestSubcategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Подкатегория запроса"
                value={requestSub}
                onChange={item => setRequestSub(item.value)}
                style={styles.dropdown}
                disabled={!requestCat}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionText}>{mainRequest || 'Не указано'}</Text>
              <Text style={styles.categoryText}>
                Категория: {requestCat || '-'}, Подкатегория: {requestSub || '-'}
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity
  style={styles.createButton}
  onPress={handleFindOptimalChain}
>
  <Text style={styles.buttonText}>Найти оптимальный обмен</Text>
</TouchableOpacity>
<Modal visible={modalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Найденная оптимальная цепочка</Text>
      
      <FlatList
        data={foundChain}
        style={styles.chainList}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <View style={styles.chainItem}>
            <Text style={styles.chainStep}>Шаг {index + 1}</Text>
            <Text style={styles.chainTitle}>{item.title || 'Без названия'}</Text>
            <View style={styles.chainDetails}>
              <Text style={styles.detailText}>
                Предложение: {item.cat?.main} - {item.cat?.sub}
              </Text>
              <Text style={styles.detailText}>
                Запрос: {item.ex_cat?.subs?.join(', \n')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Цепочка не найдена</Text>
        }
      />

      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.replaceButton]}
          onPress={async () => {
            await firestore().collection('Chains').doc(chainId).update({
              listings: foundChain.map(l => l.id)
            });
            setModalVisible(false);
          }}>
          <Text style={styles.buttonText}>Заменить текущую</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modalButton, styles.copyButton]}
          onPress={async () => {
            await firestore().collection('Chains').add({
              name: chainName + '-копия',
              main_offer: { text: mainOffer, category: offerCat, subcategory: offerSub },
              main_request: { text: mainRequest, category: requestCat, subcategory: requestSub },
              user_id: uid,
              listings: foundChain.map(l => l.id),
              created_at: new Date()
            }).then(Alert.alert('Создание копии с обменом', 'Копия успешно создана'))
            setModalVisible(false);
          }}>
          <Text style={styles.buttonText}>Создать копию</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setModalVisible(false)}>
          <Text style={styles.cancelText}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


      </ScrollView>
    </KeyboardAvoidingView>
  );
};
  
  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 16,
    },
    headerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chainTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
    },
    nameInput: {
      flex: 1,
      fontSize: 18,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 4,
      padding: 8,
      marginRight: 8,
      backgroundColor: 'white',
    },
    editButton: {
      backgroundColor: '#017D7D',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 4,
    },
    editButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    sectionContainer: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    sectionText: {
      fontSize: 16,
      lineHeight: 22,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 4,
      padding: 8,
      backgroundColor: 'white',
      minHeight: 80,
      textAlignVertical: 'top',
    },
    listContainer: {
      marginBottom: 16,
    },
    emptyList: {
      padding: 16,
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
    },
    itemContainer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: 'white',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    listingImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 16,
    },
    listingInfo: {
      flex: 1,
    },
    listingTitle: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    deleteIconButton: {
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    underlayLeft: {
      flex: 1,
      backgroundColor: 'green',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    underlayText: {
      color: 'white',
      fontWeight: 'bold',
    },
    card: {
    width: '100%',
    height: 'auto',
    marginHorizontal: 4,
    marginVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  padding: 20,
},
modalContent: {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 20,
  maxHeight: '80%',
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 15,
  color: '#333',
  textAlign: 'center',
},
chainList: {
  marginBottom: 15,
},
chainItem: {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
},
chainStep: {
  fontSize: 12,
  color: '#6c757d',
  marginBottom: 4,
},
chainTitle: {
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 6,
},
chainDetails: {
  borderTopWidth: 1,
  borderTopColor: '#eee',
  paddingTop: 6,
  marginTop: 6,
},
detailText: {
  fontSize: 12,
  color: '#666',
  lineHeight: 16,
},
modalButtons: {
  marginTop: 10,
},
modalButton: {
  borderRadius: 8,
  paddingVertical: 12,
  marginBottom: 8,
  alignItems: 'center',
},
replaceButton: {
  backgroundColor: '#017D7D',
},
copyButton: {
  backgroundColor: '#4a90e2',
},
cancelButton: {
  padding: 8,
},
cancelText: {
  color: '#dc3545',
  textAlign: 'center',
  fontWeight: '500',
},
emptyText: {
  textAlign: 'center',
  color: '#6c757d',
  padding: 10,
},
  });
  
  export default SingleChainScreen;