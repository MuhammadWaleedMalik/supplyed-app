import {
  observeEditorSelection,
  restoreEditorSelection,
} from '../../utils/ui/editorSelection';
import React, { useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import {
  actions,
  RichEditor,
  RichToolbar,
} from 'react-native-pell-rich-editor';
import {
  editorHtml,
  escapeHtml,
  safeLink,
  sanitizeHtml,
} from '../../utils/ui/safeHtml';
import { richTextToPlainText } from '../../utils/ui/richText';
import { observeEditorContent, requestCurrentEditorContent } from '../../utils/ui/editorContent';
import Button from './Button';
import Input from './Input';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  role?: boolean;
};

// Screens only pass value/onChange. The editor library owns the cursor.
export default function ProposalEditor({ value, onChange, role }: Props) {
  const { fontScale } = useWindowDimensions();
  const editorStyle = {
    backgroundColor: '#ffffff',
    color: '#17211c',
    contentCSSText: `font-size:${16 * fontScale}px;line-height:1.7;padding:12px;overflow-wrap:anywhere;word-break:break-word;max-width:100%;box-sizing:border-box;`,
    cssText: 'html,body{max-width:100%;overflow-x:hidden;} pre{white-space:pre-wrap;} img,table{max-width:100%;}',
  };
  const [editor, setEditor] = useState<RichEditor | null>(null);
  const [initial] = useState(() => editorHtml(value));
  const lastContent = useRef(initial);
  const [selectedText, setSelectedText] = useState('');
  const [selectedLink, setSelectedLink] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { colors } = useTheme();
  const styles = useStyles();
  const count = richTextToPlainText(value) ? sanitizeHtml(value).length : 0;
  const limit = role ? 10000 : 2000;
  // The WebView owns the live document. Parent echoes must never set innerHTML:
  // an older React commit can otherwise replace newer text and its selection.
  // A different record gets a new editor instance at the form boundary.
  function publish(html: string) {
    const clean = sanitizeHtml(html);
    if (clean === lastContent.current) return;
    lastContent.current = clean;
    onChange(clean);
  }

  function format(command: string, option: string) {
    editor?.command(
      restoreEditorSelection +
        'document.execCommand(' +
        JSON.stringify(command) +
        ', false, ' +
        JSON.stringify(option) +
        ')',
    );
    editor?.focusContentEditor();
  }
  function addLink() {
    const link = safeLink(url);
    if (!link) {
      setError('Enter a valid website or email link.');
      return;
    }
    if (selectedText || selectedLink) format('createLink', link);
    else {
      editor?.command(restoreEditorSelection);
      editor?.insertHTML(
        '<a href="' +
          escapeHtml(link) +
          '">' +
          escapeHtml(linkText.trim() || link) +
          '</a>',
      );
    }
    setLinkOpen(false);
    setError('');
    setUrl('');
    setLinkText('');
  }
  return (
    <View style={styles.editor}>
      <Text style={styles.label}>
        {role ? 'Role description' : 'Application proposal'}
      </Text>
      {editor ? (
        <RichToolbar
          getEditor={() => editor}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
            actions.removeFormat,
          ]}
          onInsertLink={() => {
            setLinkText(selectedText);
            setUrl(selectedLink);
            setLinkOpen(true);
          }}
          iconTint={colors.ink}
          selectedIconTint={colors.brandDark}
          style={styles.toolbar}
        />
      ) : null}
      <RichEditor
        ref={setEditor}
        editorInitializedCallback={() => {
          editor?.command(observeEditorSelection + observeEditorContent);
        }}
        onMessage={event => {
          if (event.type === 'SUPPLYED_CONTENT') {
            publish(String(event.data));
            return;
          }
          if (event.type !== 'SUPPLYED_SELECTION') return;
          const data = event.data;
          setSelectedText(data.text || '');
          setSelectedLink(data.href || '');
        }}
        initialFocus={false}
        initialContentHTML={initial}
        initialHeight={220}
        defaultParagraphSeparator="p"
        styleWithCSS
        pasteAsPlainText
        editorStyle={editorStyle}
        placeholder={
          role
            ? 'Describe the class, cover expectations, timetable notes, support needs, and arrival instructions.'
            : 'Introduce yourself, highlight relevant experience, and explain why you are a strong fit for this role.'
        }
        onChange={() => editor?.command(requestCurrentEditorContent)}
        onLink={() => {}}
      />
      {linkOpen ? (
        <View style={styles.link}>
          <Input
            label="Link text"
            disabled={!!selectedText || !!selectedLink}
            value={linkText}
            onChangeText={setLinkText}
            required={false}
          />
          <Input
            label="Website or email address"
            value={url}
            onChangeText={setUrl}
          />
          <Button title="Apply link" onPress={addLink} />
          <Button
            title="Remove link"
            onPress={() => {
              format('unlink', '');
              setLinkOpen(false);
            }}
            variant="link"
          />
          <Button
            title="Cancel"
            onPress={() => {
              setLinkOpen(false);
              setError('');
            }}
            variant="link"
          />
        </View>
      ) : null}
      <Text style={styles.hint}>
        {count.toLocaleString()} / {limit.toLocaleString()} characters including formatting
      </Text>
      {count > limit || error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error || 'Your text is too long. Shorten it before saving.'}
        </Text>
      ) : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  editor: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  toolbar: { backgroundColor: colors.brandTint, minHeight: 48 },
  hint: { color: colors.muted, fontSize: 12 },
  error: { color: '#b91c1c', fontSize: 14 },
  link: { gap: 10 },
}));
