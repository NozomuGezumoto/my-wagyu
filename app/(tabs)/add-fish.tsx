import { View, StyleSheet } from 'react-native';
import AddFishScreen from '../../src/components/AddFishScreen';

export default function AddFishRoute() {
  return (
    <View style={styles.container}>
      <AddFishScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
