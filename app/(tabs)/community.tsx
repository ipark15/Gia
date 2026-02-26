import { Community } from '../../components/Community';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Community userCondition="acne" />
    </SafeAreaView>
  );
}
