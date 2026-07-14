import { Redirect } from 'expo-router';

// Navegação sem login é permitida — só pedimos login sob demanda
// (tabela de vendas, telefone da construtora), não como portão de entrada.
export default function Index() {
  return <Redirect href="/(tabs)/inicio" />;
}
