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
  TouchableOpacity,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {GiftedChat, Bubble, InputToolbar, Send} from 'react-native-gifted-chat'
import firestore from '@react-native-firebase/firestore'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ScrollView } from 'react-native-virtualized-view';

import dayru from 'dayjs/locale/ru';
locale={dayru}

const ChatScreen = ({ user, route }) => {
  const [messages, setMessages] = useState([]);
  const { uid } = route.params;
  const docid = uid > user.uid ? user.uid + "-" + uid : uid + "-" + user.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Chats')
      .doc(docid)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const allTheMsgs = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            _id: docSnap.id,
          };
        });
        setMessages(allTheMsgs);
      });

    return () => unsubscribe();
  }, [docid]);

  const onSend = async (msgArray = []) => {
    const msg = msgArray[0];
    const usermsg = {
      ...msg,
      sentBy: user.uid,
      sentTo: uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    setMessages(previousMessages => GiftedChat.append(previousMessages, { ...usermsg, createdAt: new Date() }));

    const chatRef = firestore().collection('Chats').doc(docid);
    const messagesRef = chatRef.collection('messages');

    try {
      const messageDocRef = await messagesRef.add(usermsg);
      await chatRef.set(
        {
          lastMessage: msg.text || '', 
          lastMessageCreatedAt: firestore.FieldValue.serverTimestamp(),
          users: firestore.FieldValue.arrayUnion(user.uid, uid),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Ошибка отправки сообщения: ", error);
    }
  };
  
  const renderChatEmpty = () => {
    return (
      <View style={styles.emptyChat}>
        <Text style={styles.emptyChatText}>
          Начните общение
        </Text>
      </View>
    );
  };
  
  const renderSend = (props) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButtonContainer}>
          <Icon name="paper-plane" size={24} color="#D16002" />
        </View>
      </Send>
    );
  };

  return (
    <GiftedChat
      style={{ flex: 1 }}
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{
        _id: user.uid,
      }}
      placeholder="Введите текст сообщения"
      timeFormat="HH:mm"
      dateFormat="ll"
      locale="ru"
      renderBubble={(props) => (
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: "#D16002",
            },
          }}
        />
      )}
      renderInputToolbar={(props) => (
        <InputToolbar
          {...props}
          containerStyle={{ borderTopWidth: 1.5, borderTopColor: '#D16002' }}
          textInputStyle={{ color: "black" }}
        />
      )}
      renderChatEmpty={renderChatEmpty}
      renderSend={renderSend}
      listViewProps={{
        ListEmptyComponent: renderChatEmpty
      }}
    />
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
  userText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Verdana'
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
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleX: -1},{scaleY:-1}],
    marginTop: 20
  },
  emptyChatText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500'
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginBottom: 5
  },
  sendButtonContainer: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ChatScreen;