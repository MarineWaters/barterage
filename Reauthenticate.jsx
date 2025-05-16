import React from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

const Reauthenticate = ({ visible, onClose, onReauthenticate, onChangePassword, password }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Необходима повторная аутентификация</Text>
                    <Text style={styles.modalText}>
                        Для смены пароля введите ваш текущий пароль.
                    </Text>
                    <TextInput
                        style={styles.modalInput}
                        secureTextEntry={true}
                        placeholder="Пароль"
                        placeholderTextColor="#999"
                        onChangeText={onChangePassword}
                        value={password}
                    />
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyle}>Отмена</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonReauthenticate]}
                            onPress={onReauthenticate}
                        >
                            <Text style={styles.textStyle}>Подвердить</Text>
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
    modalText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16
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
    buttonReauthenticate: {
        backgroundColor: '#017D7D',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    }
});

export default Reauthenticate;