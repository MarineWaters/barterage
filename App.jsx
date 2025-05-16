import React, { useState, useEffect} from 'react';
 import { NavigationContainer } from '@react-navigation/native';
 import { createNativeStackNavigator } from '@react-navigation/native-stack'
 import ProfileScreen from './screens/ProfileScreen';
 import ChatScreen from './screens/ChatScreen';
 import SignUpScreen from './screens/SignUpScreen';
 import MessageScreen from './screens/MessageScreen';
 import { StyleSheet} from 'react-native';
 import Icon from '@react-native-vector-icons/ionicons';
import auth from '@react-native-firebase/auth';
import SignInScreen from './screens/SignInScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-get-random-values'
import { KeyboardProvider } from 'react-native-keyboard-controller';
import OwnListingScreen from './screens/OwnListingsScreen';
import ListingScreen from './screens/ListingScreen';
import SearchScreen from './screens/SearchScreen';
import ListingCreationScreen from './screens/ListingCreationScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import EditListingScreen from './screens/EditListingScreen';
import ChainScreen from './screens/ChainScreen';
import SingleChainScreen from './screens/SingleChainScreen';
import ChainCreationScreen from './screens/ChainCreationScreen';
import OtherProfileScreen from './screens/OtherProfileScreen';
import YaMap from 'react-native-yamap-plus';
import { YAMAPI } from './conf';

YaMap.init(YAMAPI);

const Tab = createBottomTabNavigator();
 
const Stack = createNativeStackNavigator();
<Stack.Navigator screenOptions = {{ 
     headerStyle: {
       backgroundColor: '#D16002',
     },
     headerTintColor: '#fff',
     headerTitleStyle: {
       fontWeight: 'bold',
     },
    }}>
      <Stack.Screen name="Chats" component={ChatScreen}  />
      <Stack.Screen name="Listing" component={ListingScreen} options={{ title: 'Объявление' }}/>
      <Stack.Screen name="Edit" component={EditListingScreen} options={{ title: 'Изменение' }}/>
      <Stack.Screen name="Chains" component={ChainScreen} options={{ title: 'Цепочки' }}/>
      <Stack.Screen name="SingleChain" component={SingleChainScreen} options={{ title: 'Цепочка' }}/>
      <Stack.Screen name="ChainCreation" component={ChainCreationScreen} options={{ title: 'Создание цепочки' }}/>
      <Stack.Screen name="OtherProfile" component={OtherProfileScreen} options={{ title: 'Профиль пользователя' }} />
    </Stack.Navigator>
 const msgsName = 'Messages';
 const profileName = 'Profile';
 const searchName = 'Search';
 const mylistName = 'Own';
 const crName = 'Create';

 function TheTab({user}) {
  return (
    <Tab.Navigator
    initialRouteName={profileName}
    screenOptions = {({ route }) => ({ 
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        let rn = route.name;
        if (rn === msgsName ){
         iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
       } else if (rn === profileName){
         iconName = focused ? 'person' : 'person-outline';
       }
       else if (rn === searchName){
        iconName = focused ? 'compass' : 'compass-outline';
      }
      else if (rn === mylistName){
        iconName = focused ? 'list-circle' : 'list-circle-outline';
      } else if (rn === crName){
        iconName = focused ? 'add-circle' : 'add-circle-outline';
      }
       return <Icon name={iconName} size={size} color={color} />
      },
        headerStyle: {
         backgroundColor: '#D16002',
       },
       headerTintColor: '#fff',
       headerTitleStyle: {
         fontWeight: 'bold',
       },
       tabBarActiveTintColor: '#D16002',
       tabBarInactiveTintColor: 'grey',
       tabBarLabelStyle: {paddingBottom: 5, fontSize: 10, fontWeight: '900'},
      })}
     
    >
    
     <Tab.Screen
      name="Messages"
      options={{ tabBarLabel: 'Чаты', title: 'Чаты' }}
      >
     {props => <MessageScreen {...props} user={user}/>}
      </Tab.Screen>

      <Tab.Screen
      name="Search"
      options={{ tabBarLabel: 'Поиск', title: 'Поиск' }}
      >
     {props => <SearchScreen {...props} user={user}/>}
      </Tab.Screen>

      <Tab.Screen
      name="Create"
      options={{ tabBarLabel: 'Создание', title: 'Создание объявления' }}
      >
     {props => <ListingCreationScreen {...props} user={user}/>}
      </Tab.Screen>

      <Tab.Screen
      name="Own"
      options={{ tabBarLabel: 'Своё', title: 'Собственные объявления' }}
      >
     {props => <OwnListingScreen {...props} user={user}/>}
      </Tab.Screen>
      
    <Tab.Screen
      name="Profile"
      options={{ tabBarLabel: 'Профиль', title: 'Профиль' }}
    >
     {props => <ProfileScreen {...props} user={user}/>}
     </Tab.Screen>
   
  </Tab.Navigator>
  );
}

 const App = () => {
   const [user, setUser] = useState('');

   useEffect(()=> {
     const userCheck = auth().onAuthStateChanged(userExist=>{
       if(userExist)
         setUser(userExist)
       else setUser("")
     })
     return () => {
       userCheck()
       console.log(user);
     }
   },[])

  return(
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
  <NavigationContainer >
        <Stack.Navigator screenOptions = {{ 
          headerStyle: {
            backgroundColor: '#D16002',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {user?
        <>
         <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
        >
         {props => <TheTab {...props} user={user}/>}
        </Stack.Screen>
        <Stack.Screen name="Chats" options={({route}) => ({ title: route.params.name,
          headerBackTitleVisible: false })}>
        {props => <ChatScreen {...props} user={user}/>}
        </Stack.Screen>
        <Stack.Screen name="Listing" options={({route}) => ({ title: 'Просмотр объявления',
          headerBackTitleVisible: false })}>
        {props => <ListingScreen {...props} listing={null}/>}
        </Stack.Screen>
        <Stack.Screen name="Edit" options={({route}) => ({ title: 'Изменение объявления',
          headerBackTitleVisible: false })}>
        {props => <EditListingScreen {...props} listing={null}/>}
        </Stack.Screen>
        <Stack.Screen name="SingleChain" options={({route}) => ({ title: 'Просмотр цепочки',
          headerBackTitleVisible: false })}>
        {props => <SingleChainScreen {...props} user={user}/>}
        </Stack.Screen>
        <Stack.Screen name="ChainCreation" options={({route}) => ({ title: 'Создание цепочки',
          headerBackTitleVisible: false })}>
        {props => <ChainCreationScreen {...props} user={user}/>}
        </Stack.Screen>
        <Stack.Screen name="Chains" options={{
        title: 'Цепочки',
        headerBackTitleVisible: false,
        }}>
        {props => <ChainScreen {...props} user={user}/>}
        </Stack.Screen>
        <Stack.Screen name="OtherProfile" options={{
        title: 'Профиль пользователя',
        headerBackTitleVisible: false,
        }}>
        {props => <OtherProfileScreen {...props} user={user}/>}
        </Stack.Screen>
        </>
       
        :
        <>
         <Stack.Screen name="Signin" component={SignInScreen} options={() => ({
          headerBackVisible: false,
          headerShown: false,
        })}/>
        
        <Stack.Screen name="Signup" component={SignUpScreen} options={() => ({
          headerBackVisible: false,
          headerShown: false,
        })}/>
        </>
        }
        
      </Stack.Navigator>
</NavigationContainer>
</GestureHandlerRootView>
</KeyboardProvider>
 )};


 export default App;

 const styles = StyleSheet.create({
   image: {
    flex: 1,
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  iconColor: {
    color: 'D16002',
  }
 });