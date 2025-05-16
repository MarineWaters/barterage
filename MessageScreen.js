import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const MessageScreen = ({ user, navigation }) => {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true); 
  const getUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await firestore()
        .collection('users')
        .where('uid', '!=', user.uid)
        .get();
      const usersWithMessages = [];
      for (const otherUser of usersSnapshot.docs.map(doc => doc.data())) {
        const docid = [user.uid, otherUser.uid].sort().join('-');
        const chatRef = firestore().collection('Chats').doc(docid);
        const chatDoc = await chatRef.get();
        if (chatDoc.exists) {
          const messagesSnapshot = await chatRef.collection('messages').limit(1).get();
          if (!messagesSnapshot.empty) {
            const chatData = chatDoc.data();
            usersWithMessages.push({
              user: otherUser,
              lastMessage: chatData.lastMessage,
              timestamp: chatData.lastMessageCreatedAt.toDate(),
            });
          }
        }
      }

      setUsers(usersWithMessages);
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      setUsers([]); 
    } finally {
      setLoading(false); 
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUsers();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      <View style={[styles.Contain, { flex: 1 }]}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.user.uid}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Chats', {
                  name: item.user.name,
                  uid: item.user.uid,
                })
              }
            >
              <View style={styles.card}>
                <TouchableOpacity onPress={() => navigation.navigate('OtherProfile', { uid: item.user.uid })}>
                <Image style={styles.userImageST} source={{ uri: item.user.photo}} />
                </TouchableOpacity>
                <View style={styles.textArea}>
                  <Text style={styles.nameText}>{item.user.name}</Text>
                  <Text style={styles.msgPreview}>{item.lastMessage}</Text>
                  <Text style={styles.msgTime}>{item.timestamp.toLocaleTimeString('ru-RU')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
                Вы ещё ни с кем не общались
              </Text>
            </View>
          )}
          style={{ flex: 1 }}
          contentContainerStyle={users && users.length === 0 ? { flexGrow: 1 } : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    height: 'auto',
    marginHorizontal: 4,
    marginVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userImageST: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textArea: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 5,
    paddingLeft: 10,
    width: 300,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Verdana',
  },
  msgPreview: {
    fontSize: 12,
    color: '#666',
    width: '80%',
  },
  msgTime: {
    textAlign: 'right',
    fontSize: 11,
    marginTop: -20,
  },
});

export default MessageScreen;