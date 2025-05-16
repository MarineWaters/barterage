import React, { useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Image,
  FlatList,
  useColorScheme,
  View,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import firestore from '@react-native-firebase/firestore'
import { ScrollView } from 'react-native-virtualized-view';
import { HOLDER } from '../conf';

const OwnListingScreen = ({user, navigation}) => {
  const [listings, setListings] = useState([]);
  // const {uid} = route.params;
  // const mainuser = user[0]

  const getListings = async ()=> {
    const querySanp = await firestore().collection('Listings').where('user_id','==',user.uid).get()
    const allLists = querySanp.docs.map(docSnap => {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        timestamp:docSnap.data().timestamp.toDate()
      }
    })
    setListings(allLists)
  }

  useFocusEffect(
    React.useCallback(() => {
      getListings();
    }, [])
  );
  useEffect(()=>{
    getListings()
  },[])


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <View style={[styles.Contain, { flex: 1 }]}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
          onPress={() => navigation.navigate('Chains', { uid: user.id })}
        >
          <Icon name="file-tray-stacked" size={24} color="#D16002" />
          <Text style={{ color: '#D16002', marginLeft: 8, fontWeight: 'bold', marginTop: 10 }}>
            перейти к цепочкам обменов
          </Text>
        </TouchableOpacity>
  
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Listing', { uid: item.id })}>
              <View style={styles.card}>
                {item.photo && item.photo.length > 0 ? (
                  <Image style={styles.listImage} source={{ uri: item.photo[0] }} />
                ) : (
                  <Image
                    style={styles.listImage}
                    source={{ uri: HOLDER }}
                  />
                )}
                <View style={styles.textArea}>
                  <Text style={styles.nameText}>{item.title}</Text>
                  <Text>{item.cat ? `Категория: ${item.cat.main} - ${item.cat.sub}` : ''}</Text>
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
          )}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
                У вас сейчас нет объявлений
              </Text>
            </View>
          )}
          style={{ flex: 1 }}
          contentContainerStyle={listings && listings.length === 0 ? { flexGrow: 1 } : null}
        />
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
    Container: {
      marginTop: 32,
      paddingHorizontal: 24,
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
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    imageContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    userImage: {
      paddingTop: 15,
      paddingBottom: 15,
    },
    userImageST: {
      width: 50,
      height: 50,
      borderRadius: 25,
    }, 
    msgTime: {
      textAlign: 'right',
      fontSize: 11,
      marginTop: -20,
    },
    msgContent: {
      paddingTop: 5,
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
  });

export default OwnListingScreen;