import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Image,
  PermissionsAndroid,
  Switch
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import Icon from '@react-native-vector-icons/ionicons';
import { MultiSelect, Dropdown } from 'react-native-element-dropdown';
import useAveragePrice from './Parser';
import { TextInput } from 'react-native-gesture-handler';
import { launchImageLibrary } from 'react-native-image-picker';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET2 } from '../conf'
import { YaMap} from 'react-native-yamap-plus';
import { useFocusEffect } from '@react-navigation/native';

const MOSCOW_COORDS = {
  latitude: 55.7558,
  longitude: 37.6173,
};


export default function ListingCreationScreen({ user, navigation }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [categoriesData, setCategoriesData] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);
  const [catMain, setCatMain] = useState(null);
  const [catSub, setCatSub] = useState(null);
  const [exCatMain, setExCatMain] = useState([]);
  const [exCatSubs, setExCatSubs] = useState([]);
  const searchQuery = catMain ? `${catMain} ${title}` : null;
  const averagePrice = useAveragePrice(searchQuery);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState({
  latitude: MOSCOW_COORDS.latitude,
  longitude: MOSCOW_COORDS.longitude,
});
const [showCenterMarker, setShowCenterMarker] = useState(false);
const [isLocated, setIsLocated] = useState(false);


  const mapRef = useRef(null);

  const moveMapTo = (point) => {
    if (mapRef.current) {
      mapRef.current.setCenter(point, 14, 0, 0, 1);
    }
  };

  const onMapPress = (e) => {
  const { lat, lon } = e.nativeEvent;
  const point = { lat: lat, lon: lon };
  setLocation({ latitude: lat, longitude: lon });
  setShowCenterMarker(true);
  setTimeout(() => setShowCenterMarker(false), 2000);
  moveMapTo(point);
};


const getLocation = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        error => {
          console.log(error);
          setLocation({ latitude: MOSCOW_COORDS.latitude, longitude: MOSCOW_COORDS.longitude });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Разрешение отклонено',
        'Вы отключили запрос разрешения на геолокацию. Пожалуйста, включите его в настройках приложения.',
        [
          { text: 'ОК' }
        ]
      );
      setLocation({ latitude: MOSCOW_COORDS.latitude, longitude: MOSCOW_COORDS.longitude });
    } else {
      setLocation({ latitude: MOSCOW_COORDS.latitude, longitude: MOSCOW_COORDS.longitude });
    }
  } catch (err) {
    console.warn(err);
    setLocation({ latitude: MOSCOW_COORDS.latitude, longitude: MOSCOW_COORDS.longitude });
  }
};



  const handleMediaUpload = async () => {
    const options = {
      mediaType: 'photo', 
      quality: 0.7,
      selectionLimit: 0,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('Отмена выбора изображения');
      } else if (response.errorCode) {
        console.log('Ошибка выбора изображения: ', response.errorCode, response.errorMessage);
        Alert.alert('Ошибка выбора изображения', 'Произршла ошибка.');
      } else if (response.assets && response.assets.length > 0) {
        setUploading(true);
        const uploadPromises = response.assets.map(async (asset) => {
          const fileUri = asset.uri;
          const fileName = fileUri.split('/').pop();
          const fileType = asset.type;

          const formData = new FormData();
          formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: fileType,
          });
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET2);
          formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

          try {
            const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
              method: 'POST',
              body: formData,
            });

            const data = await cloudinaryResponse.json();
            if (data.secure_url) {
              return data.secure_url;
            } else {
              console.error('Ошибка загрузки в Cloudinary:', data);
              Alert.alert('Ошибка загрузки', 'Не получилось загрузить выбранный медиаконтент.');
              return null;
            }
          } catch (error) {
            console.error('Ошибка загрузки в Cloudinary:', error);
            Alert.alert('Ошибка загрузки', 'Не получилось загрузить выбранный медиаконтент.');
            return null;
          }
        });

        const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
        setMediaUrls(uploadedUrls);
        setUploading(false);
      }
    });
  };

  const handleDeleteMedia = (indexToDelete) => {
    Alert.alert(
      'Удалить',
      'Вы уверены, что хотите удалить этот ресурс?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          onPress: () => {
            setMediaUrls(mediaUrls.filter((_, index) => index !== indexToDelete));
          },
        },
      ],
      { cancelable: false }
    );
  };
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
        } else {
          setErrorCategories('Категории не найдены');
        }
      } catch (err) {
        setErrorCategories('Ошибка при загрузке категорий');
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const mainCategoriesData = categoriesData
    ? Object.keys(categoriesData).map((key) => ({ label: key, value: key }))
    : [];

  const catSubcategoriesData =
    catMain && categoriesData && categoriesData[catMain]
      ? categoriesData[catMain].map((sub) => ({ label: sub, value: sub }))
      : [];

  const exCatSubcategoriesData = [];

  if (categoriesData && exCatMain.length > 0) {
    exCatMain.forEach((mainCat) => {
      const subs = categoriesData[mainCat] || [];
      subs.forEach((sub) => {
        exCatSubcategoriesData.push({
          label: `${mainCat} - ${sub}`,
          value: `${mainCat} - ${sub}`,
        });
      });
    });
  }
  
  useEffect(() => {
  if (isLocated) {
    getLocation();
  }
}, [isLocated]);


  const confirmation = async () => {
    if (
      !title ||
      !desc ||
      !catMain ||
      !catSub ||
      exCatMain.length === 0 ||
      exCatSubs.length === 0
    ) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      const newdata = {
        user_id: user.uid,
        timestamp: new Date(),
        status: true,
        r_price: averagePrice,
        title: title,
        cat: {
          main: catMain,
          sub: catSub,
        },
        ex_cat: {
          main: exCatMain,
          subs: exCatSubs,
        },
        desc: desc,
        photo: mediaUrls,
        geolocation: isLocated && location ? new firestore.GeoPoint(location.latitude, location.longitude) : null,
        located: isLocated,
      };
      console.log(JSON.stringify(newdata, null, 2));
      await firestore().collection('Listings').add(newdata);
      navigation.navigate('Own');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create listing.');
    }
  };

  if (loadingCategories) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (errorCategories) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: 'red' }}>{errorCategories}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Введите данные для создания объявления.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.text_footer, { marginTop: 25 }]}>Название</Text>
        <View style={styles.action}>
          <TextInput
            placeholder="Введите название"
            placeholderTextColor="#999"
            style={styles.textInput}
            autoCapitalize="none"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <Text style={[styles.text_footer, { marginTop: 25 }]}>Описание</Text>
        <View style={styles.action}>
          <TextInput
            placeholder="Введите описание"
            placeholderTextColor="#999"
            style={styles.textInput}
            autoCapitalize="none"
            value={desc}
            onChangeText={setDesc}
          />
        </View>

        <Text style={[styles.text_footer, { marginTop: 25 }]}>
          Предложение - Основная категория
        </Text>
        <Dropdown
          style={styles.dropdown}
          data={mainCategoriesData}
          labelField="label"
          valueField="value"
          placeholder="Выберите основную категорию"
          value={catMain}
          onChange={(item) => {
            setCatMain(item.value);
            setCatSub(null);
          }}
          maxHeight={200}
          showsVerticalScrollIndicator={false}
        />

        <Text style={[styles.text_footer, { marginTop: 15 }]}>Предложение - Подкатегория</Text>
        <Dropdown
          style={styles.dropdown}
          data={catSubcategoriesData}
          labelField="label"
          valueField="value"
          placeholder="Выберите подкатегорию"
          value={catSub}
          onChange={(item) => setCatSub(item.value)}
          maxHeight={200}
          showsVerticalScrollIndicator={false}
          disabled={!catMain}
        />

        <Text style={[styles.text_footer, { marginTop: 25 }]}>
          Запрос - Основные категории (можно выбрать несколько)
        </Text>
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
          value={exCatMain}
          search
          searchPlaceholder="Поиск..."
          onChange={item => {
            setExCatMain(item);
            const newExCatSubs = exCatSubs.filter(sub => {
              const mainCat = sub.split(' - ')[0];
              return item.includes(mainCat);
            });
            setExCatSubs(newExCatSubs);
          }}
          selectedStyle={styles.selectedStyle}
        />

        <Text style={[styles.text_footer, { marginTop: 15 }]}>
          Запрос - Подкатегории (можно выбрать несколько)
        </Text>
        <MultiSelect
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={exCatSubcategoriesData}
          labelField="label"
          valueField="value"
          placeholder={
            exCatMain.length === 0
              ? 'Сначала выберите основные категории'
              : 'Выберите подкатегории'
          }
          value={exCatSubs}
          search
          searchPlaceholder="Поиск..."
          onChange={item => {
            setExCatSubs(item);
          }}
          selectedStyle={styles.selectedStyle}
          disabled={exCatMain.length === 0}
        />

        <Text style={[styles.text_footer, { marginTop: 25 }]}>Загрузка медиаконтента (Необязательно)</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handleMediaUpload} disabled={uploading}>
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Загружаем...' : 'Загрузить'}
        </Text>
      </TouchableOpacity>

      <View style={styles.imagePreviewContainer}>
        {mediaUrls.map((url, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: url }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteMedia(index)}
            >
              <Icon name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      

      <Text style={[styles.text_footer, { marginTop: 25 }]}>Указать геолокацию</Text>
<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
  <Switch
    value={isLocated}
    onValueChange={setIsLocated}
    thumbColor={isLocated ? '#D16002' : '#ccc'}
    trackColor={{ false: '#ccc', true: '#FFDAB9' }}
  />
  <Text style={{ marginLeft: 10 }}>{isLocated ? 'Включено' : 'Выключено'}</Text>
</View>

{isLocated && (
    <View>
    <Text style={{ color: '#D16002', fontWeight: 'bold' }}>
          'Широта: ' {location.latitude}
          ' Долгота: ' {location.longitude}
        </Text></View>
)}

{isLocated && (
  <View style={styles.container}>
    <YaMap
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        lat: location.latitude,
        lon: location.longitude,
        zoom: 10,
        azimuth: 0,
        tilt: 0,
      }}
      onMapPress={onMapPress}
    />
    {showCenterMarker && (
      <View pointerEvents="none" style={styles.centerMarkerContainer}>
        <Image
          source={{ uri: 'https://www.pngall.com/wp-content/uploads/2017/05/Map-Marker-Free-Download-PNG.png' }}
          style={styles.centerMarkerImage}
          resizeMode="contain"
        />
      </View>
    )}
  </View>
)}
        <TouchableOpacity
          onPress={confirmation}
          style={[styles.signIn, { borderColor: '#D16002', borderWidth: 1, marginTop: 30 }]}
        >
          <Text style={[styles.textSign, { color: '#D16002' }]}>Создать</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D16002',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  map: {
  width: '100%',
  height: 300,
  marginTop: 15,
},
  footer: {
    flex: 3,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  text_header: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 30,
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
  },
  headerTitle: {
    paddingTop: 5,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: -12,
    paddingLeft: 10,
    color: '#05375a',
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
  signIn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#D16002',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageWrapper: {
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 2,
    borderRadius: 5,
  },
  centerMarkerContainer: {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: 300, 
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none', 
},
centerMarkerImage: {
  width: 48,
  height: 48,
},

});
