import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useChatStyles } from './chatStyles';

export default function ConversationAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const chatStyles = useChatStyles();

  const [failedUrl, setFailedUrl] = useState('');
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <Image
        accessibilityLabel={name}
        source={{ uri: imageUrl }}
        style={chatStyles.avatar}
        onError={() => setFailedUrl(imageUrl)}
      />
    );
  }
  return (
    <View style={chatStyles.avatar}>
      <Text style={chatStyles.initials}>{initials}</Text>
    </View>
  );
}
