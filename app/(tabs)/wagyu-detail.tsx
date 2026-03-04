import { View, StyleSheet } from 'react-native';
import WagyuDetailScreen from '../../src/components/WagyuDetailScreen';

export default function WagyuDetailRoute() {
  return (
    <View style={styles.container}>
      <WagyuDetailScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
