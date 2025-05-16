import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Image,
  FlatList,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Switch,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import firestore from '@react-native-firebase/firestore';
import { MultiSelect, Dropdown } from 'react-native-element-dropdown';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { HOLDER } from '../conf';
import Geolocation from '@react-native-community/geolocation';


const SearchScreen = ({ user, navigation }) => {
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterCatMain, setFilterCatMain] = useState([]);
  const [filterCatSub, setFilterCatSub] = useState([]);
  const [filterExCatMain, setFilterExCatMain] = useState([]);
  const [filterExCatSubs, setFilterExCatSubs] = useState([]);
  const [filterHasPhotos, setFilterHasPhotos] = useState(false);
  const [filterRPrice, setFilterRPrice] = useState([0, 100000]);
  const [filterTime, setFilterTime] = useState('all');
  const [categoriesData, setCategoriesData] = useState(null);
  const [filterLocated, setFilterLocated] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
const [filterDistance, setFilterDistance] = useState([0, 100]);
const [minDistance, setMinDistance] = useState(0);
const [maxDistance, setMaxDistance] = useState(100);
const [locationPermission, setLocationPermission] = useState(false);


  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const screenWidth = Dimensions.get('window').width;
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const doc = await firestore()
          .collection('Categories')
          .doc('YWdWBjQnaViSvDCudPpr')
          .get();

        if (doc.exists) {
          const data = doc.data();
          setCategoriesData(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, []);

  const mainCategoriesData = categoriesData
    ? Object.keys(categoriesData).map((key) => ({ label: key, value: key }))
    : [];

  const catSubcategoriesData =
    filterCatMain.length > 0 && categoriesData
      ? filterCatMain.reduce((acc, mainCat) => {
          const subs = categoriesData[mainCat] || [];
          subs.forEach((sub) => {
            if (!acc.find(item => item.value === `${mainCat} - ${sub}`)) {
              acc.push({ label: `${mainCat} - ${sub}`, value: `${mainCat} - ${sub}` });
            }
          });
          return acc;
        }, [])
      : [];

  const exCatSubcategoriesData = [];

  if (categoriesData && filterExCatMain.length > 0) {
    filterExCatMain.forEach((mainCat) => {
      const subs = categoriesData[mainCat] || [];
      subs.forEach((sub) => {
        exCatSubcategoriesData.push({
          label: `${mainCat} - ${sub}`,
          value: `${mainCat} - ${sub}`,
        });
      });
    });
  }


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

const getLocation = async () => {
  try {
    console.log('permission')
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('granted')
      Geolocation.getCurrentPosition(
        position => {
                    console.log('position')
          const { latitude, longitude } = position.coords;
          console.log('position2')
          setUserLocation({ latitude, longitude });
          setLocationPermission(true)
        },
        error => {
                    console.log('error')
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      console.log('set')
                console.log('setlocp')
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Разрешение отклонено',
        'Вы отключили запрос разрешения на геолокацию. Пожалуйста, включите его в настройках приложения.',
        [
          { text: 'ОК' }
        ]
      );
    }
  } catch (err) {
    console.warn(err);
  }
};

  const getListings = async () => {
    try {
      const querySnap = await firestore().collection('Listings').get();
      const allLists = querySnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp.toDate(),
      }));

      setListings(allLists);

      if (allLists.length > 0) {
        const prices = allLists.map(item => item.r_price);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        setMinPrice(minP);
        setMaxPrice(maxP);
        setFilterRPrice([minP, maxP]); 
      } else {
        setMinPrice(0);
        setMaxPrice(100000);
        setFilterRPrice([0, 100000]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getListings();
    }, [])
  );

  useEffect(() => {
  if (userLocation && listings.length > 0) {
    const distances = listings
      .filter(item => item.located && item.geolocation)
      .map(item => {
        const lat1 = item.geolocation.latitude;
        const lon1 = item.geolocation.longitude ;
        return getDistanceFromLatLonInKm(
          lat1,
          lon1,
          userLocation.latitude,
          userLocation.longitude
        );
      });
    if (distances.length > 0) {
      const minD = Math.floor(Math.min(...distances));
      const maxD = Math.ceil(Math.max(...distances));
      setMinDistance(minD);
      setMaxDistance(maxD);
      setFilterDistance([minD, maxD]);
    }
  }
}, [userLocation, listings]); 


  useEffect(() => {
    getListings();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...listings];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCatMain.length > 0) {
      filtered = filtered.filter(item => filterCatMain.includes(item.cat.main));
    }

    if (filterCatSub.length > 0) {
      filtered = filtered.filter(item =>
        filterCatSub.includes(`${item.cat.main} - ${item.cat.sub}`)
      );
    }

    if (filterExCatMain.length > 0) {
      filtered = filtered.filter(item => {
        return filterExCatMain.some(mainCat => item.ex_cat.main && item.ex_cat.main.includes(mainCat));
      });
    }

    if (filterExCatSubs.length > 0) {
      filtered = filtered.filter(item => {
        return filterExCatSubs.some(subCat => item.ex_cat.subs && item.ex_cat.subs.includes(subCat));
      });
    }

    if (filterHasPhotos) {
      filtered = filtered.filter(item => item.photo && item.photo.length > 0);
    }

    if (filterLocated) {
  filtered = filtered.filter(item => Boolean(item.located) === true);

  if (locationPermission && userLocation.latitude && userLocation.longitude) {
    filtered = filtered.filter(item => {
      if (!item.geolocation) return false;
      const lat1 = item.geolocation.latitude;
      const lon1 = item.geolocation.longitude;
      const d = getDistanceFromLatLonInKm(
        lat1,
        lon1,
        userLocation.latitude,
        userLocation.longitude
      );
      return d >= filterDistance[0] && d <= filterDistance[1];
    });
  }
}



    filtered = filtered.filter(item => item.r_price >= filterRPrice[0] && item.r_price <= filterRPrice[1]);

    const now = new Date();

    if (filterTime === 'lastDay') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      filtered = filtered.filter(item => item.timestamp >= yesterday);
    } else if (filterTime === 'lastWeek') {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      filtered = filtered.filter(item => item.timestamp >= lastWeek);
    } else if (filterTime === 'lastMonth') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(item => item.timestamp >= lastMonth);
    } else if (filterTime === 'lastYear') {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      filtered = filtered.filter(item => item.timestamp >= lastYear);
    }

    return filtered;
  }, [
    listings,
    searchQuery,
    filterCatMain,
    filterCatSub,
    filterExCatMain,
    filterExCatSubs,
    filterHasPhotos,
    filterRPrice,
    filterTime
  ]);

  const filteredListings = applyFilters();

  const clearFilters = () => {
    setFilterCatMain([]);
    setFilterCatSub([]);
    setFilterExCatMain([]);
    setFilterExCatSubs([]);
    setFilterHasPhotos(false);
    setFilterRPrice([minPrice, maxPrice]);
    setFilterTime('all');
    setFilterLocated(false)
    setFilterDistance([0, 100])
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <View style={styles.Contain}>
        <View style={{ padding: 10, width: '100%' }}>
          <TextInput
            placeholder="Поиск по объявлениям..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Icon name="options-outline" size={24} color="#fff" />
          <Text style={styles.filterButtonText}>Расширенная фильтрация</Text>
        </TouchableOpacity>
        {filteredListings.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#888' }}>Ничего не найдено</Text>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
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
                      {item.cat ? `Категория: ${item.cat.main} - ${item.cat.sub}` : ''}
                    </Text>
                    <Text>
                      {item.ex_cat && item.ex_cat.subs && item.ex_cat.subs.length
                        ? `Интересует: ${item.ex_cat.subs.join(', \n')}`
                        : ''}
                    </Text>
                    <Text style={styles.userText}>{'\nОписание'}</Text>
                    <Text style={styles.userText}>{item.desc}</Text>
                     {item.located && item.geolocation && userLocation && (
                    <Text>
                      {'\n'}Находится от вас в {
                        getDistanceFromLatLonInKm(
                          item.geolocation.latitude,
                          item.geolocation.longitude,
                          userLocation.latitude,
                          userLocation.longitude
                        ).toFixed(1)
                      } км
                    </Text>
                  )} 

                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Modal
          animationType="slide"
          transparent={false}
          visible={isFilterModalVisible}
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Расширенная фильтрация</Text>
              <Text style={styles.filterLabel}>Предложение - Основная категория</Text>
              <MultiSelect
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={mainCategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Выберите основные категории"
                value={filterCatMain}
                search
                searchPlaceholder="Поиск..."
                onChange={item => {
                  setFilterCatMain(item);
                  setFilterCatSub([]);
                }}
                selectedStyle={styles.selectedStyle}
              />

              <Text style={styles.filterLabel}>Предложение - Подкатегория</Text>
              <MultiSelect
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={catSubcategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Выберите подкатегории"
                value={filterCatSub}
                search
                searchPlaceholder="Search..."
                onChange={item => {
                  setFilterCatSub(item);
                }}
                selectedStyle={styles.selectedStyle}
              />

              <Text style={styles.filterLabel}>Запрос - Основная категория</Text>
              <MultiSelect
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={mainCategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Выберите основные категории"
                value={filterExCatMain}
                search
                searchPlaceholder="Поиск..."
                onChange={item => {
                  setFilterExCatMain(item);
                  setFilterExCatSubs([]);
                }}
                selectedStyle={styles.selectedStyle}
              />

              <Text style={styles.filterLabel}>Запрос - Подкатегория</Text>
              <MultiSelect
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={exCatSubcategoriesData}
                labelField="label"
                valueField="value"
                placeholder="Выберите подкатегории"
                value={filterExCatSubs}
                search
                searchPlaceholder="Поиск..."
                onChange={item => {
                  setFilterExCatSubs(item);
                }}
                selectedStyle={styles.selectedStyle}
              />

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>С медиаконтентом:</Text>
                <Switch
                  trackColor={{ false: '#017D7D', true: '#D16002' }}
                  value={filterHasPhotos}
                  onValueChange={setFilterHasPhotos}
                />
              </View>

<View style={styles.filterRow}>
  <Text style={styles.filterLabel}>С указанной локацией:</Text>
  <Switch
    trackColor={{ false: '#017D7D', true: '#D16002' }}
    value={filterLocated}
    onValueChange={setFilterLocated}
  />
</View>

{filterLocated && !locationPermission && (
  <TouchableOpacity
    style={styles.applyButton}
    onPress={getLocation}
  >
    <Text style={styles.applyButtonText}>Включить доступ к геолокации</Text>
  </TouchableOpacity>
)}

 {filterLocated && locationPermission && userLocation && (
  <>
    <Text style={styles.filterLabel}>
      Расстояние до вас: {filterDistance[0]} - {filterDistance[1]} км
    </Text>
    <MultiSlider
      values={[filterDistance[0], filterDistance[1]]}
      sliderLength={screenWidth - 40}
      onValuesChangeFinish={setFilterDistance}
      min={minDistance}
      max={maxDistance}
      step={1}
      allowOverlap={false}
      snapped
      enabled={true}
      containerStyle={styles.multiSliderContainer}
      trackStyle={styles.multiSliderTrack}
      selectedStyle={styles.multiSliderSelected}
      markerStyle={styles.multiSliderMarker}
      pressedMarkerStyle={styles.multiSliderPressedMarker}
    />
  </>
)} 




              <Text style={styles.filterLabel}>
                Ценовой диапазон: {filterRPrice[0]} - {filterRPrice[1]}
              </Text>
              <MultiSlider
                values={[filterRPrice[0], filterRPrice[1]]}
                sliderLength={screenWidth-40}
                onValuesChangeFinish={setFilterRPrice}
                min={minPrice}
                max={maxPrice}
                step={100}
                allowOverlap={false}
                snapped
                containerStyle={styles.multiSliderContainer}
                trackStyle={styles.multiSliderTrack}
                selectedStyle={styles.multiSliderSelected}
                markerStyle={styles.multiSliderMarker}
                pressedMarkerStyle={styles.multiSliderPressedMarker}
              />

              <Text style={styles.filterLabel}>Время создания:</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={[
                  { label: 'За всё время', value: 'all' },
                  { label: 'За день', value: 'lastDay' },
                  { label: 'За неделю', value: 'lastWeek' },
                  { label: 'За месяц', value: 'lastMonth' },
                  { label: 'За год', value: 'lastYear' },
                ]}
                labelField="label"
                valueField="value"
                placeholder="Выберите временной промежуток"
                value={filterTime}
                onChange={item => {
                  setFilterTime(item.value);
                }}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setIsFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Применить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Очистить</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Contain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  listImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  textArea: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 5,
    paddingLeft: 10,
    width: '70%',
    backgroundColor: 'transparent',
  },
  userText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Verdana',
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 40,
  },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#D16002',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  applyButton: {
    backgroundColor: '#D16002',
    padding: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#017D7D',
    padding: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dropdown: {
    height: 50,
    borderColor: '#D16002',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  selectedStyle: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderColor: '#D16002',
    borderWidth: 2,
    color: '#D16002',
    marginRight: 8,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  multiSliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  multiSliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
  },
  multiSliderSelected: {
    backgroundColor: '#D16002',
  },
  multiSliderMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D16002',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  multiSliderPressedMarker: {
    backgroundColor: '#D16002',
  },
});

export default SearchScreen;