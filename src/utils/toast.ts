import { Alert } from 'react-native';

const toast = {
  success: (message: string) => Alert.alert('Sucesso', message),
  error: (message: string) => Alert.alert('Erro', message),
};

export default toast;
