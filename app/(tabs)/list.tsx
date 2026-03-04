import { View, StyleSheet } from 'react-native';
import WagyuListScreen from '../../src/components/WagyuListScreen';

export default function ListScreen() {
  return (
    <View style={styles.container}>
      <WagyuListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
