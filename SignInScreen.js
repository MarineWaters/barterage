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

const SignInScreen = ({navigation}) => {

    const [user, setUser] = useState([]);
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
    
    const userSignin = async () => {
      if(!email || !password) {
        Alert.alert("","Заполните все поля")
      }
      try{
        const newReg = await auth().signInWithEmailAndPassword(email,password)
        
        console.log('Успешная авторизация')
        return newReg
        
      }catch(err){
        Alert.alert("",'Введённые данные некорректны');
      }
    }

   

    return (
        <View style={[styles.container, {
            paddingTop: 35
        }]}>
            <View style={styles.header}>
                <Text style={styles.text_header}>Авторизация</Text>
                <Text style={styles.headerTitle}>Введите почту и пароль в этой форме чтобы авторизоваться.</Text>
            </View>
            <View style={styles.footer}>
                
                <Text style={[styles.text_footer, {
                    marginTop: 25
                }]}>Почта</Text>
                <View style={styles.action}>
                    <TextInput
                        placeholder="Введите почту"
                        placeholderTextColor='#999'
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
                      placeholderTextColor='#999'
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
                        onPress={()=>userSignin()}
                        style={[styles.signIn, {
                            borderColor: '#D16002',
                            borderWidth: 1,
                            marginTop: 15,
                        }]}
                    >

                        <Text style={[styles.textSign, {
                            color: '#D16002'
                        }]}>Войти</Text>

                    </TouchableOpacity>
                    <View style={{marginTop: 10, alignItems: 'center'}}>
                    <TouchableOpacity onPress={()=>navigation.push('Signup')}><Text style={styles.text_footer}>Ещё не зарегистрированы? Нажмите тут чтобы зарегистрироваться.</Text></TouchableOpacity>
                    </View> 
                </View>

            </View>
    );
};

export default SignInScreen;


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