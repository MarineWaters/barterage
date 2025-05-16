import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    Button,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    Platform,
    TextInput,
    ScrollView,
    Alert
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AUTO} from '../conf'

export default SignUpScreen = ({navigation}) => {

    const [user, setUser] = useState({});
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [data, setData] = React.useState({
        email: '',
        password: '',
        check_textInputChange: false,
        secureTextEntry: true
    });

    const updateSecureText = () => {
        setData({
           secureTextEntry: !data.secureTextEntry 
        });
    }

    const userRegistration = async () => {
      if(!email || !password || !name) {
        Alert.alert("","Пожалуйста, заполните все поля.")
      }
      try{
        const newReg = await auth().createUserWithEmailAndPassword(email,password)
        firestore().collection('users').doc(newReg.user.uid).set({
          name: name,
          email: newReg.user.email,
          uid: newReg.user.uid,
          photo: AUTO, 
          aboutMe: ''
        })
         }catch(err){
            console.log(err)
            Alert.alert("",'Введённые данные не подходят. Убедитесь, что пароль имеет не менее 8 символов.');

      }
    }

    return (
        <View style={[styles.container, {
            paddingTop: 35
        }]}>
            <View style={styles.header}>
                <Text style={styles.text_header}>Регистрация</Text>
                <Text style={styles.headerTitle}>Введите никнейм, почту и пароль в этой форме чтобы зарегистрироваться.</Text>
            </View>
            <View style={styles.footer}>
                
                <Text style={[styles.text_footer, {
                    marginTop: 25
                }]}>Никнейм</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="Введите своё имя или никнейм"
                        style={styles.textInput}
                        autoCapitalize="none"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                <Text style={[styles.text_footer, {
                    marginTop: 25
                }]}>Email</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="Введите почту"
                        style={styles.textInput}
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <Text style={[styles.text_footer, {
                  marginTop: 25
                }]}>Пароль</Text>
                <View style={styles.action}>
                  <TextInput
                      placeholder="Введите пароль"
                      secureTextEntry={data.secureTextEntry ? true : false}
                      style={styles.textInput}
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                  />
                  <TouchableOpacity
                      onPress={updateSecureText}
                  >
                      {data.secureTextEntry ? 
                      <Text>Показать</Text>
                      :
                      <Text>Скрыть</Text>
                      } 
                  </TouchableOpacity>
                </View>

               
                    <TouchableOpacity
                        onPress={()=>userRegistration()}
                        style={[styles.signIn, {
                            borderColor: '#D16002',
                            borderWidth: 1,
                            marginTop: 15,
                        }]}
                    >

                        <Text style={[styles.textSign, {
                            color: '#D16002'
                        }]}> Подтвердить регистрацию </Text>

                    </TouchableOpacity>
                    <View style={{marginTop: 10, alignItems: 'center'}}>
                    <TouchableOpacity onPress={()=>navigation.navigate('Signin')}><Text style={styles.text_footer}>Уже зарегистрированы? Нажмите тут чтобы войти.</Text></TouchableOpacity>
                    </View> 
                </View>

            </View>
    );
};



 const {height} = Dimensions.get("screen");
 const height_logo = height * 0.28;

 const styles = StyleSheet.create({ 
container: {
     flex: 1,
     backgroundColor: '#D16002'
   },
   header: {
     flex: 1,
     justifyContent: 'flex-end',
     paddingHorizontal: 20,
     paddingBottom: 50
     },
   footer: {
     flex: 3,
     backgroundColor: '#fff',
     borderTopLeftRadius: 30,
     borderTopRightRadius: 30,
     paddingVertical: 20,
     paddingHorizontal: 30
   },
   text_header: {
     color: '#fff',
     fontWeight: 'bold',
     fontSize: 30
   },
   text_footer: {
     color: '#05375a',
     fontSize: 18
   },
   title: {
     color: '#05375a',
     fontSize: 14,
     fontWeight: 'bold'
   },
   headerTitle: {
     paddingTop: 5,
     color: '#fff',
     fontSize: 14,
     fontWeight: 'bold'
   },
   action: {
     flexDirection: 'row',
     marginTop: 10,
     borderBottomWidth: 1,
     borderBottomColor: '#f2f2f2',
     paddingBottom: 5
   },
   textInput: { 
     flex: 1,
     marginTop: Platform.OS === 'ios' ? 0 : -12,
     paddingLeft: 10,
     color: '#05375a',
   },
   button: {
     alignItems: 'center',
     marginTop: 50
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
     fontWeight: 'bold'
   }

 })