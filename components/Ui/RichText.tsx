import React, { useMemo, useState } from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { editorHtml, safeLink } from '../../utils/ui/safeHtml';
import RenderHtml, { RenderHTMLProps } from 'react-native-render-html';
import { useTheme } from './theme';
import ContentPreview from './ContentPreview';
import {
  ignoredRichTextTags,
  richTextToPlainText,
} from '../../utils/ui/richText';

type Props = {
  value?: string | null;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  emptyText?: string;
  title?: string;
  expandable?: boolean;
};

const allowedStyles: RenderHTMLProps['allowedStyles'] = [
  'fontWeight',
  'fontStyle',
  'textDecorationLine',
  'textAlign',
  'fontFamily',
  'fontSize',
  'color',
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
  title = 'Full description',
  expandable = true,
}: Props) {
  const { colors } = useTheme();
  const themedTagsStyles = useMemo(
    () => ({ ...tagsStyles, a: { color: colors.brandDark } }),
    [colors.brandDark],
  );
  const [width, setWidth] = useState(0);
  const plainText = useMemo(
    () => richTextToPlainText(editorHtml(value || '')),
    [value],
  );
  const source = useMemo(
    () => ({
      // Editors often insert nonbreaking spaces between every word. Ordinary
      // spaces let the proposal wrap naturally on narrow mobile screens.
      html: editorHtml(value || '').replace(
        /&nbsp;|&#0*160;|&#x0*a0;|\u00a0/gi,
        ' ',
      ),
    }),
    [value],
  );
  const baseStyle = useMemo(() => ({ ...StyleSheet.flatten(style) }), [style]);

  if (expandable && plainText) {
    return <ContentPreview text={plainText} title={title} style={style} lines={numberOfLines || 4}>
      <RichText value={value} style={style} emptyText={emptyText} expandable={false} />
    </ContentPreview>;
  }
  if (!plainText || numberOfLines) {
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
          renderersProps={{
            a: {
              onPress: (_event, href) => {
                const url = safeLink(href);
                if (url) Linking.openURL(url).catch(() => {});
              },
            },
          }}
        />
      ) : null}
    </View>
  );
}
