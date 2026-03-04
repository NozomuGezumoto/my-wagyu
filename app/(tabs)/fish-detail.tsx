import { View, StyleSheet } from 'react-native';
import FishDetailScreen from '../../src/components/FishDetailScreen';

export default function FishDetailRoute() {
  return (
    <View style={styles.container}>
      <FishDetailScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
