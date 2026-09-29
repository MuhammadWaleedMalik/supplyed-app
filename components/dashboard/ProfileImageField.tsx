import { Camera } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { colors } from '../Ui/theme';
import { settingsStyles } from './settingsStyles';

type Props = { imageUrl: string; loading: boolean; onChange: () => void };

export default function ProfileImageField({ imageUrl, loading, onChange }: Props) {
  return (
    <View style={settingsStyles.imageRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile image"
        disabled={loading} onPress={onChange} style={settingsStyles.imageEditor}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={settingsStyles.image} /> : (
          <View style={settingsStyles.imageEmpty}><Camera color={colors.blue} size={18} /></View>
        )}
        <View style={settingsStyles.imageAction}>
          {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Camera color="#ffffff" size={12} />}
        </View>
      </Pressable>
      <View style={settingsStyles.imageCopy}>
        <Text style={settingsStyles.imageTitle}>Profile photo</Text>
        <Text style={settingsStyles.imageNote}>Tap the photo to replace it. JPG, PNG, or WebP up to 5 MB.</Text>
      </View>
    </View>
  );
}