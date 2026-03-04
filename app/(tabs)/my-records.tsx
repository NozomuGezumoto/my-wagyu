import { View, StyleSheet } from 'react-native';
import WagyuMyRecordsScreen from '../../src/components/WagyuMyRecordsScreen';

export default function MyRecordsPage() {
  return (
    <View style={styles.container}>
      <WagyuMyRecordsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
