import { useTheme } from '../Ui/theme';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  CheckCheck,
  FileText,
  Info,
  Paperclip,
  SendHorizontal,
  X,
} from 'lucide-react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  ChatMessage,
  getAttachmentDownload,
  MessageAttachment,
} from '../../constants/conversationsApi';
import { useConversation } from '../../feature/dashboard/shared/hooks/useConversation';
import { useAppSelector } from '../../store/hooks';
import { pickChatAttachment } from '../../utils/documents/pickChatAttachment';
import { pickWasCancelled } from '../../utils/documents/pickDocument';
import Button from '../Ui/Button';
import ConversationAvatar from './ConversationAvatar';
import ConversationDetails from './ConversationDetails';
import { useChatStyles } from './chatStyles';

export default function ConversationThread({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const chatStyles = useChatStyles();

  const [body, setBody] = useState('');
  const [files, setFiles] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [details, setDetails] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    file: MessageAttachment;
    text?: string;
  }>();
  const insets = useSafeAreaInsets();
  const chat = useConversation(id, !details && !preview);
  const [typingVisible, setTypingVisible] = useState(false);
  const remoteTyping = useAppSelector(state => state.conversations.typing[id]);
  const connected = useAppSelector(state => state.conversations.connected);
  const socketError = useAppSelector(state => state.conversations.error);
  const uploadingRef = useRef(false);
  const alive = useRef(true);
  const list = useRef<FlatList<ChatMessage>>(null);
  const historyScrollStarted = useRef(false);
  const conversation = chat.conversation;
  const messages = [...chat.messages].reverse();
  const disabled =
    chat.loading ||
    chat.busy ||
    uploading ||
    !conversation ||
    conversation.readOnly ||
    conversation.applicationStatus === 'REJECTED';
  const sendDisabled =
    disabled || chat.uncertain || (!body.trim() && !files.length);
  const composerBottom = keyboardVisible ? 8 : Math.max(insets.bottom, 8);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      list.current?.scrollToOffset({ offset: 0, animated: true });
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  useEffect(() => {
    alive.current = true;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => {
      alive.current = false;
      back.remove();
    };
  }, [onBack]);

  useEffect(() => {
    const remaining = (remoteTyping?.until || 0) - Date.now();
    setTypingVisible(remaining > 0);
    if (remaining <= 0) return;
    const timer = setTimeout(() => setTypingVisible(false), remaining);
    return () => clearTimeout(timer);
  }, [remoteTyping?.until]);

  async function attachFile() {
    if (disabled || uploadingRef.current || files.length >= 5) return;
    uploadingRef.current = true;
    setUploading(true);
    setFileError('');
    try {
      const file = await pickChatAttachment(id);
      if (alive.current) setFiles(current => [...current, file]);
    } catch (problem) {
      if (alive.current && !pickWasCancelled(problem))
        setFileError(
          problem instanceof Error ? problem.message : 'Unable to attach file.',
        );
    } finally {
      uploadingRef.current = false;
      if (alive.current) setUploading(false);
    }
  }

  async function openFile(file: MessageAttachment, external = false) {
    setFileError('');
    try {
      const result = await getAttachmentDownload(id, file.id);
      if (!alive.current) return;
      if (!/^https:\/\//i.test(result.url))
        throw new Error('A secure download link is unavailable.');
      if (!external && file.contentType.startsWith('image/')) {
        setPreview({ url: result.url, file });
      } else if (!external && file.contentType === 'text/plain') {
        const response = await fetch(result.url);
        if (!response.ok)
          throw new Error(
            'Unable to preview this file. Please try opening it again.',
          );
        const text = await response.text();
        if (alive.current)
          setPreview({ url: result.url, file, text: text.slice(0, 20000) });
      } else await Linking.openURL(result.url);
    } catch (problem) {
      if (alive.current)
        setFileError(
          problem instanceof Error ? problem.message : 'Unable to open file.',
        );
    }
  }

  async function send() {
    if (sendDisabled) return;
    if (await chat.send(body, files)) {
      setBody('');
      setFiles([]);
      setFileError('');
      list.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }

  function renderMessage({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) {
    const mine = item.senderSide === conversation?.me;
    const seen =
      mine &&
      conversation?.counterpartLastReadAt &&
      item.createdAt <= conversation.counterpartLastReadAt;
    const date = new Date(item.createdAt);
    const olderMessage = messages[index + 1];
    const showDate =
      !olderMessage ||
      new Date(olderMessage.createdAt).toDateString() !== date.toDateString();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const day =
      date.toDateString() === today.toDateString()
        ? 'Today'
        : date.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : date.toLocaleDateString([], {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
    return (
      <View style={chatStyles.messageGroup}>
        {showDate ? (
          <View style={chatStyles.day}>
            <Text style={chatStyles.dayText}>{day}</Text>
          </View>
        ) : null}
        <View style={[chatStyles.bubble, mine && chatStyles.ownBubble]}>
          {item.senderSide === null ? (
            <Text style={chatStyles.muted}>Deleted account</Text>
          ) : null}
          {item.body ? (
            <Text
              selectable
              style={[chatStyles.body, mine && chatStyles.ownMessageText]}
            >
              {item.body}
            </Text>
          ) : null}
          {item.attachments.map(file => (
            <Pressable
              key={file.id}
              accessibilityRole="button"
              accessibilityLabel={'Open ' + file.fileName}
              onPress={() => openFile(file)}
              style={chatStyles.file}
            >
              <Text style={chatStyles.name}>{file.fileName}</Text>
              <Text style={chatStyles.muted}>
                {Math.max(1, Math.ceil(file.sizeBytes / 1024))} KB · Tap to open
              </Text>
            </Pressable>
          ))}
          <View style={chatStyles.messageMeta}>
            <Text
              style={[
                chatStyles.messageTime,
                mine && chatStyles.ownMessageTime,
              ]}
            >
              {date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {mine ? (
              <View accessible accessibilityLabel={seen ? 'Read' : 'Sent'}>
                <CheckCheck
                  size={16}
                  color={seen ? '#ffffff' : colors.brandTint}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={chatStyles.chatScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={chatStyles.chatScreen}
      >
        <StatusBar barStyle="dark-content" />
        <View style={chatStyles.threadHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to chats"
            style={chatStyles.iconButton}
            onPress={onBack}
          >
            <ArrowLeft color="#111b21" size={24} />
          </Pressable>
          {conversation ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View conversation details"
                style={chatStyles.contactButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setDetails(true);
                }}
              >
                <ConversationAvatar
                  name={conversation.counterpart.name}
                  imageUrl={conversation.counterpart.imageUrl}
                />
                <View style={chatStyles.copy}>
                  <Text numberOfLines={1} style={chatStyles.name}>
                    {conversation.counterpart.name}
                  </Text>
                  <Text numberOfLines={1} style={chatStyles.muted}>
                    {remoteTyping?.side !== conversation.me && typingVisible
                      ? 'typing…'
                      : conversation.job.title}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Conversation information"
                style={chatStyles.iconButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setDetails(true);
                }}
              >
                <Info size={23} color="#111b21" />
              </Pressable>
            </>
          ) : null}
        </View>
        {!connected && socketError ? (
          <Text style={[chatStyles.muted, chatStyles.connection]}>
            {socketError}
          </Text>
        ) : null}
        {chat.loading ? <ActivityIndicator color={colors.brand} /> : null}
        <FlatList
          ref={list}
          style={chatStyles.list}
          data={messages}
          inverted
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={chatStyles.thread}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 40,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          onScroll={event =>
            chat.setCaughtUp(event.nativeEvent.contentOffset.y < 60)
          }
          scrollEventThrottle={100}
          onScrollBeginDrag={() => {
            historyScrollStarted.current = true;
          }}
          onEndReached={() => {
            if (!historyScrollStarted.current) return;
            historyScrollStarted.current = false;
            chat.loadOlder();
          }}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            !chat.loading ? (
              <Text
                style={[
                  chatStyles.muted,
                  chatStyles.center,
                  chatStyles.emptyThread,
                ]}
              >
                Start the conversation about this application.
              </Text>
            ) : undefined
          }
          ListFooterComponent={
            chat.hasMore ? (
              chat.olderLoading ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <Text style={[chatStyles.muted, chatStyles.center]}>
                  Scroll up for earlier messages
                </Text>
              )
            ) : undefined
          }
        />
        {chat.error || fileError ? (
          <View>
            <Text style={chatStyles.error} accessibilityLiveRegion="polite">
              {fileError || chat.error}
            </Text>
            <Button
              title="Refresh conversation"
              variant="link"
              onPress={chat.refresh}
            />
          </View>
        ) : null}
        {chat.uncertain ? (
          <View style={chatStyles.notice}>
            <Text style={chatStyles.body}>
              Your message may already have been sent. Check the history before
              sending it again.
            </Text>
            <Button
              title="I checked the history — allow another send"
              variant="social"
              onPress={chat.reviewUncertainSend}
            />
          </View>
        ) : null}
        {conversation?.readOnly ||
        conversation?.applicationStatus === 'REJECTED' ? (
          <View style={chatStyles.notice}>
            <Text style={chatStyles.body}>
              This application was rejected. You can still read messages and
              open files.
            </Text>
          </View>
        ) : (
          <View
            style={[
              chatStyles.composer,
              {
                paddingBottom: composerBottom,
              },
            ]}
          >
            {files.map(file => (
              <View key={file.id} style={chatStyles.attachmentDraft}>
                <FileText size={20} color={colors.brand} />
                <Text
                  style={[chatStyles.muted, chatStyles.copy]}
                  numberOfLines={1}
                >
                  {file.fileName}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={'Remove ' + file.fileName}
                  style={chatStyles.iconButton}
                  disabled={chat.busy}
                  onPress={() =>
                    setFiles(current =>
                      current.filter(item => item.id !== file.id),
                    )
                  }
                >
                  <X size={20} color="#667781" />
                </Pressable>
              </View>
            ))}
            <View style={chatStyles.composerRow}>
              <View style={chatStyles.inputPill}>
                <TextInput
                  selectionColor={colors.brand}
                  accessibilityLabel="Message"
                  placeholder="Message"
                  placeholderTextColor="#667781"
                  multiline
                  maxLength={2000}
                  value={body}
                  editable={!disabled}
                  style={chatStyles.input}
                  onChangeText={value => {
                    setBody(value);
                    if (value.trim()) chat.typing();
                    else chat.stopTyping();
                  }}
                  onBlur={chat.stopTyping}
                  onFocus={() =>
                    list.current?.scrollToOffset({ offset: 0, animated: true })
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    uploading ? 'Uploading attachment' : 'Attach file'
                  }
                  accessibilityState={{
                    disabled: disabled || files.length >= 5,
                    busy: uploading,
                  }}
                  disabled={disabled || files.length >= 5}
                  onPress={attachFile}
                  style={chatStyles.iconButton}
                >
                  {uploading ? (
                    <ActivityIndicator color={colors.brand} size="small" />
                  ) : (
                    <Paperclip color="#667781" size={23} />
                  )}
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  chat.busy ? 'Sending message' : 'Send message'
                }
                accessibilityState={{ disabled: sendDisabled, busy: chat.busy }}
                disabled={sendDisabled}
                onPress={send}
                style={({ pressed }) => [
                  chatStyles.sendButton,
                  sendDisabled && chatStyles.sendDisabled,
                  pressed && chatStyles.pressedButton,
                ]}
              >
                {chat.busy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <SendHorizontal size={24} color="#fff" fill="#fff" />
                )}
              </Pressable>
            </View>
            {body.length >= 1800 ? (
              <Text style={chatStyles.characterCount}>{body.length}/2000</Text>
            ) : null}
          </View>
        )}
        {details && conversation ? (
          <ConversationDetails
            conversation={conversation}
            onClose={() => setDetails(false)}
          />
        ) : null}
        {preview ? (
          <Modal onRequestClose={() => setPreview(undefined)}>
            <SafeAreaView style={chatStyles.modal}>
              <Text style={chatStyles.name}>{preview.file.fileName}</Text>
              {preview.text !== undefined ? (
                <ScrollView>
                  <Text selectable style={chatStyles.body}>
                    {preview.text}
                  </Text>
                  {preview.text.length === 20000 ? (
                    <Text style={chatStyles.muted}>
                      Preview limited to 20,000 characters. Open the file to
                      read everything.
                    </Text>
                  ) : null}
                </ScrollView>
              ) : (
                <Image
                  source={{ uri: preview.url }}
                  resizeMode="contain"
                  style={chatStyles.preview}
                  onError={() =>
                    setFileError(
                      'Preview unavailable. Open the file or close and try again.',
                    )
                  }
                />
              )}
              {fileError ? (
                <Text style={chatStyles.error}>{fileError}</Text>
              ) : null}
              <Button
                title="Open or download"
                onPress={() => openFile(preview.file, true)}
              />
              <Button
                title="Close preview"
                variant="link"
                onPress={() => setPreview(undefined)}
              />
            </SafeAreaView>
          </Modal>
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
