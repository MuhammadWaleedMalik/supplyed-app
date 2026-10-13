import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import RenderHtml, { RenderHTMLProps } from 'react-native-render-html';
import { useTheme } from './theme';
import {
  hasRichTextMarkup,
  ignoredRichTextTags,
  richTextToPlainText,
} from '../../utils/ui/richText';

type Props = {
  value?: string | null;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  emptyText?: string;
};

const allowedStyles: RenderHTMLProps['allowedStyles'] = [
  'fontWeight',
  'fontStyle',
  'textDecorationLine',
  'textAlign',
];
const tagsStyles = {
  p: { marginTop: 0, marginBottom: 8 },
  ul: { marginTop: 0, marginBottom: 8, paddingLeft: 22 },
  ol: { marginTop: 0, marginBottom: 8, paddingLeft: 22 },
  li: { marginBottom: 4 },
};

export default function RichText({
  value,
  style,
  numberOfLines,
  emptyText = 'No cover letter added.',
}: Props) {
  const { colors } = useTheme();
  const themedTagsStyles = useMemo(
    () => ({ ...tagsStyles, a: { color: colors.brandDark } }),
    [colors.brandDark],
  );
  const [width, setWidth] = useState(0);
  const plainText = useMemo(() => richTextToPlainText(value), [value]);
  const source = useMemo(
    () => ({
      // Editors often insert nonbreaking spaces between every word. Ordinary
      // spaces let the proposal wrap naturally on narrow mobile screens.
      html: (value || '').replace(/&nbsp;|&#0*160;|&#x0*a0;|\u00a0/gi, ' '),
    }),
    [value],
  );
  const baseStyle = useMemo(() => ({ ...StyleSheet.flatten(style) }), [style]);

  if (!plainText || numberOfLines || !hasRichTextMarkup(value || '')) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {plainText || emptyText}
      </Text>
    );
  }

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <RenderHtml
          contentWidth={width}
          source={source}
          baseStyle={baseStyle}
          tagsStyles={themedTagsStyles}
          allowedStyles={allowedStyles}
          ignoredDomTags={ignoredRichTextTags}
        />
      ) : null}
    </View>
  );
}
