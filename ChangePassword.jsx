import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

const ChangePassword = ({
                                 visible,
                                 onClose,
                                 onChangePasswordSubmit,
                                 onChangeCurrentPassword,
                                 onChangeNewPassword,
                                 onChangeConfirmNewPassword,
                                 currentPassword,
                                 newPassword,
                                 confirmNewPassword
                             }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Изменить пароль</Text>

                    <TextInput
                        style={styles.modalInput}
                        secureTextEntry={true}
                        placeholder="Текущий пароль"
                        placeholderTextColor='#999'
                        onChangeText={onChangeCurrentPassword}
                        value={currentPassword}
                    />
                    <TextInput
                        style={styles.modalInput}
                        secureTextEntry={true}
                        placeholder="Новый пароль"
                        placeholderTextColor='#999'
                        onChangeText={onChangeNewPassword}
                        value={newPassword}
                    />
                    <TextInput
                        style={styles.modalInput}
                        secureTextEntry={true}
                        placeholder="Подтвердите новый пароль"
                        placeholderTextColor='#999'
                        onChangeText={onChangeConfirmNewPassword}
                        value={confirmNewPassword}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyle}>Отмена</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonChangePassword]}
                            onPress={onChangePasswordSubmit}
                            >
                                <Text style={styles.textStyle}>Изменить пароль</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };
    
    const styles = StyleSheet.create({
        centeredView: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalView: {
            margin: 20,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 35,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
        },
        modalTitle: {
            marginBottom: 15,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold'
        },
        modalInput: {
            height: 40,
            width: '100%',
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 20,
            paddingHorizontal: 10,
            borderRadius: 5,
            color: 'black',
            textAlign: 'center',
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%'
        },
        button: {
            borderRadius: 10,
            padding: 10,
            elevation: 2,
            width: '40%'
        },
        buttonCancel: {
            backgroundColor: '#D16002',
        },
        buttonChangePassword: {
            backgroundColor: '#017D7D',
        },
        textStyle: {
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center'
        }
    });
    
    export default ChangePassword;