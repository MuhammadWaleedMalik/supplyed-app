import {
  observeEditorSelection,
  restoreEditorSelection,
  editorColor,
} from '../../utils/ui/editorSelection';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  actions,
  RichEditor,
  RichToolbar,
} from 'react-native-pell-rich-editor';
import {
  editorColors,
  editorFonts,
  editorHtml,
  editorSizes,
  escapeHtml,
  safeLink,
  sanitizeHtml,
} from '../../utils/ui/safeHtml';
import { richTextToPlainText } from '../../utils/ui/richText';
import { observeEditorContent, requestCurrentEditorContent } from '../../utils/ui/editorContent';
import DynamicSelect from './DynamicSelect';
import Button from './Button';
import Input from './Input';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  role?: boolean;
};

const editorStyle = {
  backgroundColor: '#ffffff',
  color: '#17211c',
  contentCSSText: 'font-size:16px;line-height:1.7;padding:12px;',
};

// Screens only pass value/onChange. The editor library owns the cursor.
export default function ProposalEditor({ value, onChange, role }: Props) {
  const [editor, setEditor] = useState<RichEditor | null>(null);
  const [initial] = useState(() => editorHtml(value));
  const lastContent = useRef(initial);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [font, setFont] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
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
      <Button title={formattingOpen ? 'Hide text options' : 'Text options'} variant="link" compact onPress={() => setFormattingOpen(current => !current)} />
      {formattingOpen ? <View style={styles.link}><DynamicSelect
        name="proposalFontFamily"
        label="Font"
        value={font}
        placeholder="SupplyEd Sans"
        onChange={next => {
          if (next && !editorFonts.includes(next)) {
            setError('This font is not supported yet.');
            return;
          }
          setFont(next);
          format('fontName', next || 'Arial');
        }}
      />
      <DynamicSelect
        name={role ? 'descriptionFontSize' : 'proposalFontSize'}
        label="Text size"
        value={size}
        placeholder="16"
        onChange={next => {
          const px = next ? (next.endsWith('px') ? next : next + 'px') : '16px';
          if (!editorSizes.includes(px)) {
            setError('This size is not supported yet.');
            return;
          }
          setSize(next);
          editor?.command(
            restoreEditorSelection +
              'document.execCommand("fontSize",false,"7"); document.querySelectorAll("span").forEach(function(node){if(node.style.fontSize==="xxx-large") node.style.fontSize=' +
              JSON.stringify(px) +
              ';})',
          );
          editor?.focusContentEditor();
        }}
      />
      <DynamicSelect
        name="proposalTextColor"
        label="Text color"
        value={color}
        placeholder="Default"
        onChange={next => {
          if (next && !editorColors.includes(next.toLowerCase())) {
            setError('This text color is not supported yet.');
            return;
          }
          setColor(next);
          format('foreColor', next || '#17211c');
        }}
      />
      </View> : null}
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
          const selectedFont = String(data.font || '').replace(/["']/g, '');
          const selectedColor = editorColor(String(data.color || ''));
          setFont(editorFonts.includes(selectedFont) ? selectedFont : '');
          setSize(editorSizes.includes(data.size) ? data.size : '');
          setColor(editorColors.includes(selectedColor) ? selectedColor : '');
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
