import React, { useState, useEffect } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  useColorScheme,
  View,
  ActivityIndicator, 
  Alert,
  TextInput
} from 'react-native'
import { PermissionsAndroid } from 'react-native'
import Icon from '@react-native-vector-icons/ionicons'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import EditProfile from './EditProfile'
import Reauthenticate from './Reauthenticate'
import ChangePassword from './ChangePassword'
import { AUTO, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET1 } from '../conf'

const ProfileScreen = ({ user }) => {
  const [userData, setUserData] = useState(null)
  const [aboutMe, setAboutMe] = useState('')
  const [uploading, setUploading] = useState(false);
  const [userDocId, setUserDocId] = useState(null);
  const [editVisible, setEditVisible] = useState({
      name: false,
      email: false,
      password: false, 
  });
  const [tempValue, setTempValue] = useState('');
  const [isEmailChanging, setIsEmailChanging] = useState(false);
  const [reauthenticateVisible, setReauthenticateVisible] = useState(false);
  const [passwordForReauth, setPasswordForReauth] = useState('');
  const [fieldBeingEdited, setFieldBeingEdited] = useState(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const getUserData = async () => {
      try {
          const querySnapshot = await firestore()
              .collection('users')
              .where('uid', '==', user.uid)
              .limit(1) 
              .get();

          if (!querySnapshot.empty) {
              const docSnap = querySnapshot.docs[0];
              setUserData(docSnap.data());
              setAboutMe(docSnap.data().aboutMe || ''); 
              setUserDocId(docSnap.id);
          } else {
              console.log('Пользователь не существует:', user.uid);
          }
      } catch (error) {
          console.error('Ошибка получения данных пользователя:', error);
          Alert.alert('Ошибка', 'Ошибка загрузки даных.');
      }
  };

  useEffect(() => {
      getUserData();
  }, [user.uid]);

  const requestCameraPermission = async () => {
      try {
          const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                  title: "Запрос разрешения",
                  message: "Приложению необходим доступ к камере",
                  buttonNeutral: "Спросить позже",
                  buttonNegative: "Отмена",
                  buttonPositive: "ОК"
              }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              console.log("Даны разрешения на камеру");
          } else {
              console.log("Не даны разрешения на камеру");
          }
      } catch (err) {
          console.warn(err);
      }
  };

  const handleImagePicker = () => {
      Alert.alert(
          "Изменить фото профиля",
          "Выберите опцию",
          [
              {
                  text: "Отмена",
                  style: "cancel"
              },
              {
                  text: "Сделать фото",
                  onPress: () => launchCamera({ mediaType: 'photo', quality: 0.7 }),
              },
              {
                  text: "Выбрать из галереи",
                  onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.7 }),
              }
          ],
          { cancelable: true }
      );
  };

  useEffect(() => {
      const imagePickerResponseHandler = async (response) => {
          if (response.didCancel) {
              console.log('Отмена выбора изображения');
          } else if (response.errorCode) {
              console.log('Ошибка выбора изображения: ', response.errorCode, response.errorMessage);
              Alert.alert('Ошибка выбора изображения', 'При выборе изображения произошла ошибка.');
          } else if (response.assets && response.assets.length > 0) {
              const selectedImageUri = response.assets[0].uri;
              console.log('URI изображения:', selectedImageUri);
              await uploadAndSavePhoto(selectedImageUri);
          }
      };

  }, []);

  const pickAndUploadImage = async (pickerType) => {
      let response;
      const options = {
          mediaType: 'photo',
          quality: 0.7,
      };

      try {
          if (pickerType === 'camera') {
              response = await launchCamera(options);
          } else {
              response = await launchImageLibrary(options);
          }

          if (response.didCancel) {
              console.log('Отмена выбора изображения');
          } else if (response.errorCode) {
              console.log('Ошибка выбора изображения: ', response.errorCode, response.errorMessage);
              Alert.alert('Ошибка выбора изображения', response.errorMessage || 'При выборе изображения произошла ошибка.');
          } else if (response.assets && response.assets.length > 0) {
              const selectedImageUri = response.assets[0].uri;
              console.log('URI изображения:', selectedImageUri);
              await uploadAndSavePhoto(selectedImageUri);
          }
      } catch (error) {
          Alert.alert('Ошибка', 'При выборе фото произошла ошибка.');
      }
  };


  const uploadImageToCloudinary = async (imageUri) => {
      setUploading(true); 
      const formData = new FormData();
      formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile_picture.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET1);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      try {
          const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              const errorData = await response.json();
              console.error('Ошибка загрузки в Cloudinary:', response.status, response.statusText, errorData);
              throw new Error(errorData.error?.message || 'Не получилось загрузить изображение в Cloudinary');
          }

          const data = await response.json();
          console.log('Успешная загрузка в Cloudinary:', data);
          return data.secure_url; 

      } catch (error) {
          console.error('Ошибка загрузки:', error);
          throw new Error('Ошибка загрузки изображения: ' + error.message);
      } finally {
          setUploading(false); 
      }
  };

  const updateProfilePictureInFirestore = async (photoUrl) => {
      if (!userDocId) {
          console.error('Не найдено ID пользователя.');
          throw new Error('Не получается сохранить медиаконтент: пользователь не найден.');
      }
      try {
          await firestore()
              .collection('users')
              .doc(userDocId) 
              .update({ photo: photoUrl });

          console.log('Успешно добавили URL в Firestore:', photoUrl);
          setUserData(prevData => ({ ...prevData, photo: photoUrl }));
          Alert.alert('Успешно', 'Фотография профиля обновлена!');

      } catch (error) {
          console.error('Ошибка обновления Firestore:', error);
          throw new Error('Не получилось обновить фото профиля: ' + error.message);
      } finally {
          setUploading(false);
      }
  };

  const uploadAndSavePhoto = async (imageUri) => {
      setUploading(true); 
      try {
          const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
          await updateProfilePictureInFirestore(cloudinaryUrl);
      } catch (error) {
          console.error('Ошибка процесса:', error);
          Alert.alert('Ошибка', 'В процессе обработки произошла ошибка.');
          setUploading(false);
      }
  };
  const saveAboutMe = async () => {
      if (!userDocId) {
          console.error('Не найден ID пользователя.');
          Alert.alert('Ошибка', 'Данные пользователя не найдены.');
          return;
      }

      try {
          setUploading(true); 
          await firestore()
              .collection('users')
              .doc(userDocId)
              .update({ aboutMe: aboutMe });

          console.log('Успешное добавление "Обо мне" в Firestore:', aboutMe);
          setUserData(prevData => ({ ...prevData, aboutMe: aboutMe }));
          Alert.alert('Успешно', '"Обо мне" обновлено!');
      } catch (error) {
          console.error('Ошибка обновления Firestore:', error);
          Alert.alert('Ошибка', 'Не получилось сохранить "Обо мне"');
      } finally {
          setUploading(false);
      }
  };

  const handleEdit = (field) => {
      setTempValue(userData?.[field] || ''); 
      setFieldBeingEdited(field);
      if (field === 'email') {
          setReauthenticateVisible(true); 
      } else {
          setEditVisible(prevState => ({ ...prevState, [field]: true })); 
      }
  };


  const handleReauthenticate = async () => {
      setUploading(true); 
      setReauthenticateVisible(false); 

      try {
          const user = auth().currentUser;
          const credential = auth.EmailAuthProvider.credential(user.email, passwordForReauth);
          await user.reauthenticateWithCredential(credential);
          console.log('Успешная повторная аутентификация');
          setEditVisible(prevState => ({ ...prevState, [fieldBeingEdited]: true }));
      } catch (reauthError) {
          console.error('Ошибка аутентификации:', reauthError);
          Alert.alert('Ошибка', 'Аутентификация неуспешна. Перепроверьте введённый пароль.');
      } finally {
          setUploading(false); 
          setPasswordForReauth(''); 
      }
  };

  const saveEdit = async (field, newValue) => {
      setUploading(true);
      if (field === 'email') {
          setIsEmailChanging(true); 
      }

      try {
          if (field === 'email') {
              await auth().currentUser.updateEmail(newValue);
              console.log('В Firebase успешно обновилась почта.');
          }
      } catch (authError) {
          console.error('Не получилось обновить почту в Firebase:', authError);
          Alert.alert('Ошибка', 'Не получилось обновить почту');
          setUploading(false);
          setIsEmailChanging(false);
          return; 
      }
      if (!userDocId) {
          console.error('ID пользователя не найдено.');
          Alert.alert('Ошибка', 'Не получилось загрузить данные пользователя.');
          return;
      }
      try {
          await firestore()
              .collection('users')
              .doc(userDocId)
              .update({ [field]: newValue });

          console.log(`Firestore обновлён, новое значение поля ${field}:`, newValue);
          setUserData(prevData => ({ ...prevData, [field]: newValue }));
          Alert.alert('Успешно', `Поле обновлено!`);
      } catch (error) {
          console.error('Не удалось обновить Firestore:', error);
          Alert.alert('Ошибка', `Не получилось сохранить ${field}: `);
      } finally {
          setUploading(false); 
          setEditVisible(prevState => ({ ...prevState, [field]: false }));
          setIsEmailChanging(false);
          setFieldBeingEdited(null);
      }
  };

  const handleChangePassword = async () => {
      if (newPassword !== confirmNewPassword) {
          Alert.alert('Ошибка', 'Новый пароль и подтверждение не совпадают.');
          return;
      }

      setUploading(true);
      setChangePasswordVisible(false);

      try {
          const user = auth().currentUser;
          const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
          await user.reauthenticateWithCredential(credential);
          await user.updatePassword(newPassword);
          Alert.alert('Успешно', 'Пароль обновлён!');
      } catch (error) {
          Alert.alert('Ошибка', "Не получилось обновить пароль");
      } finally {
          setUploading(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
      }
  };

  if (!userData && !uploading) {
      return (
          <SafeAreaView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D16002" />
              <Text>Загрузка профиля...</Text>
          </SafeAreaView>
      );
  }

  if (uploading) {
      return (
          <SafeAreaView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D16002" />
              <Text>{isEmailChanging ? "Обновляем почту..." : "Загрузка..."}</Text>
          </SafeAreaView>
      );
  }


  return (
      <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }}>
              <View style={styles.Contain}>
                  <TouchableOpacity
                      onPress={() =>
                          Alert.alert(
                              "Изменить фото",
                              "Выберите",
                              [
                                  { text: "Отмена", style: "cancel" },
                                  {
                                      text: "Сделать фото", onPress: async () => {
                                          await requestCameraPermission();
                                          pickAndUploadImage('camera')
                                      }
                                  },
                                  { text: "Выбрать из библиотеки", onPress: () => pickAndUploadImage('library') }
                              ],
                              { cancelable: true }
                          )
                      }
                      style={styles.photoContainer}
                  >
                      <Image
                          style={styles.userImage}
                          source={{
                              uri: userData?.photo || AUTO,
                          }}
                      />
                      <View style={styles.cameraIconOverlay}>
                          <Icon name="camera" size={30} color="#fff" />
                      </View>
                  </TouchableOpacity>
                  <View style={styles.card}>
                      <View style={styles.textArea}>
                          <View style={styles.fieldContainer}>
                              <Text style={styles.nameText}>{userData?.name || 'Имя пользователя'}</Text>
                              <TouchableOpacity onPress={() => handleEdit('name')}>
                                  <Icon name="pencil" size={20} color="#017D7D" />
                              </TouchableOpacity>
                          </View>
                          <View style={styles.fieldContainer}>
                              <Text style={styles.msgContent}>{userData?.email || user.email}</Text>
                              <TouchableOpacity onPress={() => handleEdit('email')}>
                                  <Icon name="pencil" size={20} color="#017D7D" />
                              </TouchableOpacity>
                          </View>
                          <TouchableOpacity onPress={() => setChangePasswordVisible(true)}>
                              <Text style={styles.changePasswordText}>Поменять пароль</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
                  <View style={styles.card}>
                      <Text style={styles.aboutMeLabel}>

                          Обо мне

                      </Text>
                      <TextInput
                          style={styles.aboutMeInput}
                          placeholder="Расскажите о себе..."
                          placeholderTextColor="#999"
                          multiline={true}
                          numberOfLines={4}
                          value={aboutMe}
                          onChangeText={text => setAboutMe(text)}
                      />
                      <TouchableOpacity
                          style={styles.saveButton}
                          onPress={saveAboutMe}
                      >
                          <Text style={styles.saveButtonText}>Сохранить</Text>
                      </TouchableOpacity>
                      <Text style={styles.aboutMeLabel}>

                      </Text>
                  </View>

                  <TouchableOpacity
                      onPress={() => auth().signOut()}
                      style={[
                          styles.signIn,
                          {
                              borderColor: '#D16002',
                             borderWidth: 1,
                              marginTop: 15,
                              alignSelf: 'center',
                              width: '80%',
                          },
                      ]}
                  >
                      <Text
                          style={[
                              styles.textSign,
                              {
                                  color: '#D16002',
                                  textAlign: 'center',
                              },
                          ]}
                      >
                          Выйти
                      </Text>
                  </TouchableOpacity>
              </View>
          </ScrollView>

          <EditProfile
              visible={editVisible.name}
              onClose={() => {
                  setEditVisible(prevState => ({ ...prevState, name: false }));
                  setFieldBeingEdited(null); 
              }}
              onSave={(newValue) => saveEdit('name', newValue)}
              value={tempValue}
              onChangeText={text => setTempValue(text)}
              title="Изменить имя"
          />
          <EditProfile
              visible={editVisible.email}
              onClose={() => {
                  setEditVisible(prevState => ({ ...prevState, email: false }));
                  setFieldBeingEdited(null); 
              }}
              onSave={(newValue) => saveEdit('email', newValue)}
              value={tempValue}
              onChangeText={text => setTempValue(text)}
              title="Изменить почту"
              placeholder='Новый почтовый адрес'
              placeholderTextColor='#999'
              keyboardType="email-address"
          />

          <Reauthenticate
              visible={reauthenticateVisible}
              onClose={() => {
                  setReauthenticateVisible(false);
                  setFieldBeingEdited(null); 
              }}
              onReauthenticate={handleReauthenticate}
              onChangePassword={text => setPasswordForReauth(text)}
              password={passwordForReauth}
          />

          <ChangePassword
              visible={changePasswordVisible}
              onClose={() => setChangePasswordVisible(false)}
              onChangeCurrentPassword={text => setCurrentPassword(text)}
              onChangeNewPassword={text => setNewPassword(text)}
              onChangeConfirmNewPassword={text => setConfirmNewPassword(text)}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmNewPassword={confirmNewPassword}
              onChangePasswordSubmit={handleChangePassword}

          />

      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  Contain: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
  },
  photoContainer: {
      position: 'relative',
      marginBottom: 20,
  },
  userImage: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 3,
      borderColor: '#fff',
  },
  cameraIconOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 5,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 15,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
  },
  textArea: {
      marginBottom: 10,
  },
  nameText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
  },
  msgContent: {
      fontSize: 16,
      color: '#666',
  },
  aboutMeInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
      textAlignVertical: 'top',
  },
  saveButton: {
      backgroundColor: '#D16002',
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
      alignItems: 'center',
  },
  saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
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
  fieldContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
  },
  aboutMeLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 10, 
  },
  changePasswordText: {
      color: '#017D7D',
      textAlign: 'center',
      marginTop: 10,
      fontSize: 16,
  }
});


export default ProfileScreen;