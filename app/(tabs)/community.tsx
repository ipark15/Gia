import { SafeAreaView } from 'react-native-safe-area-context';
import { Community } from '../../components/Community';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Community userCondition="acne" />
    </SafeAreaView>
  );
}
