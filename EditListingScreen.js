import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  TextInput,
  Switch,
  PermissionsAndroid
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import { MultiSelect } from 'react-native-element-dropdown';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET2 } from '../conf';
import YaMap from 'react-native-yamap-plus';
import Geolocation from '@react-native-community/geolocation';

const MOSCOW_COORDS = { latitude: 55.751244, longitude: 37.618423 };

const EditListingScreen = ({ route, navigation }) => {
  const { listing } = route.params;

  const [desc, setDesc] = useState(listing.desc || '');
  const [mediaUrls, setMediaUrls] = useState(listing.photo || []);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(listing.status);
  const [categoriesData, setCategoriesData] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);
  const [exCatMain, setExCatMain] = useState(listing.ex_cat.main || []);
  const [exCatSubs, setExCatSubs] = useState(listing.ex_cat.subs || []);
  const [isLocated, setIsLocated] = useState(listing.located || false);
  const [location, setLocation] = useState(
    listing.geolocation
      ? { latitude: listing.geolocation.latitude, longitude: listing.geolocation.longitude }
      : MOSCOW_COORDS
  );
  const [showCenterMarker, setShowCenterMarker] = useState(false);

  const mapRef = useRef(null);

  const handleMapPress = (e) => {
    const { lat, lon } = e.nativeEvent;
    const newLoc = { latitude: lat, longitude: lon };
    setLocation(newLoc);
    setShowCenterMarker(true);
    setTimeout(() => setShowCenterMarker(false), 2000);
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lon }, 14, 0, 0, 1);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
        setErrorCategories('Categories not found');
      }
    } catch (err) {
      setErrorCategories('Error loading categories');
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };
    const mainCategoriesData = categoriesData
    ? Object.keys(categoriesData).map((key) => ({ label: key, value: key }))
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
        Alert.alert('Ошибка выбора изображения', 'Произошла ошибка.');
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
              console.error('Ошибка загрузки в Cloudinary', data);
              Alert.alert('Ошибка загрузки', 'Не удалось загрузить медиаконтент.');
              return null;
            }
          } catch (error) {
            console.error('Ошибка загрузки в Cloudinary:', error);
            Alert.alert('Ошибка загрузки', 'Не удалось загрузить медиаконтент.');
            return null;
          }
        });

        const uploadedUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
        setMediaUrls([...mediaUrls, ...uploadedUrls]);
        setUploading(false);
      }
    });
  };

  const handleRemoveMedia = (indexToRemove) => {
    Alert.alert(
      'Удаление',
      'Вы уверены, что хотите удалить этот медиаресурс?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: () => {
            setMediaUrls(mediaUrls.filter((_, index) => index !== indexToRemove));
          },
        },
      ],
      { cancelable: false }
    );
  };


  const handleSaveChanges = async () => {
    try {
      await firestore().collection('Listings').doc(listing.id).update({
        desc,
        photo: mediaUrls,
        ex_cat: { main: exCatMain, subs: exCatSubs },
        status,
        located: isLocated,
        geolocation: isLocated ? new firestore.GeoPoint(location.latitude, location.longitude) : null,
      });
      Alert.alert('Успешно', 'Объявление обновлено.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения.');
    }
  };

  const handleDeactivate = async () => {
    try {
      setStatus(false)
      await firestore().collection('Listings').doc(listing.id).delete();
      Alert.alert('Объявление удалено', 'Ваше объявление было успешно удалено.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home', { screen: 'Own' }),
        },
      ]);
    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      Alert.alert('Ошибка', 'Не удалось удалить объявление.');
    }
  };

  const handleActivate = async () => {
    setStatus(true); 
    Alert.alert('Восстановление объявления', 'Объявление было возвращено.');
  };

  if (loadingCategories) {
    return (
      <View style={[styles.Contain, styles.center]}>
        <Text>Загрузка...</Text>
      </View>
    );
  }
 if (errorCategories) {
    return (
      <View style={[styles.Contain, styles.center]}>
        <Text style={{ color: 'red' }}>{errorCategories}</Text>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.Contain}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.headerText}>
            В этом окне можно изменить параметры вашего объявления
          </Text>

          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={styles.input}
            placeholder='Введите описание'
            placeholderTextColor="#999"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.text_footer}>Запрос - Основные категории</Text>
          <View style={styles.centeredDropdown}>
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
          </View>

          <Text style={styles.text_footer}>Запрос - Подкатегории</Text>
          <View style={styles.centeredDropdown}>
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
              onChange={item => setExCatSubs(item)}
              selectedStyle={styles.selectedStyle}
              disabled={exCatMain.length === 0}
            />
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleMediaUpload}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Загрузка...' : 'Загрузить медиаконтент'}
            </Text>
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {mediaUrls.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image style={styles.userImage} source={{ uri: uri }} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMedia(index)}
                >
                  <Text style={styles.removeButtonText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Геолокация</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Switch value={isLocated} onValueChange={setIsLocated} />
          <Text style={{ marginLeft: 10 }}>{isLocated ? 'Включено' : 'Выключено'}</Text>
        </View>

        {isLocated && (
          <>
            <YaMap
              ref={mapRef}
              style={{ width: '100%', height: 200 }}
              initialRegion={{
                lat: location.latitude,
                lon: location.longitude,
                zoom: 10,
                azimuth: 0,
                tilt: 0,
              }}
              onMapPress={handleMapPress}
            />
            {showCenterMarker && (
              <View pointerEvents="none" style={{ position: 'absolute', bottom: 260, left: '50%', marginLeft: -12 }}>
                <Image
                  source={{ uri: 'https://www.pngall.com/wp-content/uploads/2017/05/Map-Marker-Free-Download-PNG.png' }}
                  style={{ width: 70, height: 70 }}
                />
              </View>
            )}
            <Text style={{ marginTop: 10, color: '#D16002', fontWeight: 'bold' }}>
              Широта: {location.latitude} | Долгота: {location.longitude}
            </Text>
          </>
        )}

        <TouchableOpacity
          style={{ marginTop: 30, padding: 14, backgroundColor: '#D16002', borderRadius: 8 }}
          onPress={handleSaveChanges}
        >
          <Text style={{ textAlign: 'center', color: 'white' }}>Сохранить</Text>
        </TouchableOpacity>

        {status ? (
          <TouchableOpacity style={{ marginTop: 15 }} onPress={handleDeactivate}>
            <Text style={{ textAlign: 'center', color: 'red' }}>Удалить объявление</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={{ marginTop: 15 }} onPress={handleActivate}>
            <Text style={{ textAlign: 'center', color: 'green' }}>Активировать</Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
    alignSelf: 'center',
  },
  centeredDropdown: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdown: {
    width: '100%',
    height: 50,
    borderColor: '#D16002',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginTop: 5,
    backgroundColor: '#fff',
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
  uploadButton: {
    backgroundColor: '#017D7D',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
    width: '100%',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    width: '100%',
  },
  imageWrapper: {
    alignItems: 'center',
    margin: 10,
  },
  userImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
    backgroundColor: '#eee',
  },
  removeButton: {
    backgroundColor: '#D16002',
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#017D7D',
    padding: 12,
    borderRadius: 5,
    marginTop: 24,
    width: '100%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  deactivateButton: {
    backgroundColor: '#D16002',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
  },
  deactivateButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  activateButton: {
    backgroundColor: '#D16002',
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default EditListingScreen;