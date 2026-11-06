import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { errorCodes, isErrorWithCode, pick } from '@react-native-documents/picker';
import {
  createProfileDocument,
  deleteProfileDocument,
  getProfileDocuments,
  ProfileDocument,
  updateProfileDocument,
  uploadProfileDocument,
} from '../../feature/dashboard/shared/apis/profileDocumentsApi';
import { getSessionVersion } from '../../utils/api/session';
import { mimeFromName } from '../../utils/documents/fileUtils';
import Button from '../Ui/Button';
import ConfirmDialog from '../Ui/ConfirmDialog';
import DateField from '../Ui/DateField';
import Input from '../Ui/Input';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

const ALLOWED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_SIZE = 10 * 1024 * 1024;

function errorMessage(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update profile documents.';
}

async function chooseFile() {
  const [picked] = await pick();
  if (picked.error) throw new Error(picked.error);
  const name = (picked.name || 'document')
    .replace(/[\\/\r\n]/g, '')
    .trim()
    .slice(0, 255);
  const mime =
    picked.type && picked.type !== 'application/octet-stream'
      ? picked.type
      : mimeFromName(name);
  if (!ALLOWED.has(mime))
    throw new Error('Choose a PDF, Word, JPG, PNG or WebP file.');
  if (picked.size !== null && (picked.size < 1 || picked.size > MAX_SIZE))
    throw new Error('Choose a non-empty file no larger than 10 MB.');
  const response = await fetch(picked.uri);
  if (!response.ok) throw new Error('Unable to read the selected file.');
  const file = await response.blob();
  if (file.size < 1 || file.size > MAX_SIZE)
    throw new Error('Choose a non-empty file no larger than 10 MB.');
  return { file, name, mime };
}

export default function ProfileDocumentsCard({ role }: { role: 'teacher' | 'school' }) {
  const styles = useSettingsStyles();
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [remove, setRemove] = useState<ProfileDocument>();
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    try {
      const result = await getProfileDocuments();
      if (mounted.current && version === getSessionVersion()) setDocuments(result);
    } catch (problem) {
      if (mounted.current && version === getSessionVersion()) setError(errorMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  async function upload(document: ProfileDocument) {
    if (busyId) return;
    const version = getSessionVersion();
    setError('');
    setNotice('');
    try {
      const selected = await chooseFile();
      if (version !== getSessionVersion()) return;
      setBusyId(document.id);
      const updated = await uploadProfileDocument(
        document.id,
        selected.file,
        selected.name,
        selected.mime,
      );
      if (!mounted.current || version !== getSessionVersion()) return;
      setDocuments(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice('Profile document uploaded.');
    } catch (problem) {
      if (isErrorWithCode(problem) && problem.code === errorCodes.OPERATION_CANCELED) return;
      if (mounted.current && version === getSessionVersion()) setError(errorMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setBusyId('');
    }
  }

  async function create() {
    if (busyId || !title.trim()) {
      if (!title.trim()) setError('Enter a title for the profile document.');
      return;
    }
    const version = getSessionVersion();
    setBusyId('new');
    setError('');
    setNotice('');
    try {
      const document = await createProfileDocument({
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(issueDate ? { issueDate } : {}),
      });
      if (!mounted.current || version !== getSessionVersion()) return;
      setDocuments(current => [document, ...current]);
      setCreating(false);
      setTitle('');
      setDescription('');
      setIssueDate('');
      setNotice('Profile document created. Add its file when ready.');
    } catch (problem) {
      if (mounted.current && version === getSessionVersion()) setError(errorMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setBusyId('');
    }
  }

  function beginEdit(document: ProfileDocument) {
    setCreating(false);
    setEditingId(document.id);
    setTitle(document.title);
    setDescription(document.description || '');
    setIssueDate(document.issueDate?.slice(0, 10) || '');
    setError('');
    setNotice('');
  }

  async function saveEdit(document: ProfileDocument) {
    if (busyId || !title.trim()) {
      if (!title.trim()) setError('Enter a title for the profile document.');
      return;
    }
    const version = getSessionVersion();
    setBusyId(document.id);
    setError('');
    try {
      const updated = await updateProfileDocument(document.id, {
        title: title.trim(),
        description: description.trim(),
        ...(issueDate ? { issueDate } : {}),
      });
      if (!mounted.current || version !== getSessionVersion()) return;
      setDocuments(current =>
        current.map(item => (item.id === updated.id ? updated : item)),
      );
      setEditingId('');
      setTitle('');
      setDescription('');
      setIssueDate('');
      setNotice('Profile document details updated.');
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(errorMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setBusyId('');
    }
  }

  async function removeDocument() {
    if (!remove || busyId) return false;
    const target = remove;
    const version = getSessionVersion();
    setBusyId(target.id);
    setError('');
    try {
      await deleteProfileDocument(target.id);
      if (!mounted.current || version !== getSessionVersion()) return false;
      setDocuments(current => current.filter(item => item.id !== target.id));
      setNotice('Profile document removed.');
      setRemove(undefined);
      return true;
    } catch (problem) {
      if (mounted.current && version === getSessionVersion()) setError(errorMessage(problem));
      return false;
    } finally {
      if (mounted.current && version === getSessionVersion()) setBusyId('');
    }
  }

  async function openDocument(document: ProfileDocument) {
    setBusyId(document.id);
    setError('');
    try {
      const latest = await getProfileDocuments();
      const fresh = latest.find(item => item.id === document.id);
      setDocuments(latest);
      if (!fresh?.fileUrl) throw new Error('Upload a file before opening this document.');
      await Linking.openURL(fresh.fileUrl);
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      if (mounted.current) setBusyId('');
    }
  }

  return (
    <View style={styles.card}>
      <ConfirmDialog
        visible={Boolean(remove)}
        title="Remove profile document?"
        context={remove?.title}
        description="The metadata and uploaded file will be permanently removed from your public profile."
        confirmLabel="Remove document"
        destructive
        onClose={() => setRemove(undefined)}
        onConfirm={removeDocument}
      />
      <SettingsCardHeader
        icon={FileText}
        title={role === 'teacher' ? 'CERTIFICATES' : 'SCHOOL ACHIEVEMENTS'}
        note="Manage reusable documents shown with your profile. Required onboarding checks remain separate."
      />
      {loading ? <Text style={styles.cardNote}>Loading profile documents...</Text> : null}
      {documents.map(document => (
        <View key={document.id} style={styles.record}>
          {editingId === document.id ? (
            <>
              <Input label="TITLE" maxLength={120} value={title} onChangeText={setTitle} />
              <Input label="DESCRIPTION" required={false} multiline maxLength={1000} value={description} onChangeText={setDescription} />
              <DateField label="Issue date" value={issueDate} onChange={setIssueDate} />
              <Button title="Save details" disabled={Boolean(busyId)} onPress={() => saveEdit(document)} />
              <Button title="Cancel editing" variant="link" disabled={Boolean(busyId)} onPress={() => setEditingId('')} />
            </>
          ) : (
            <>
              <Text style={styles.recordValue}>{document.title}</Text>
              {document.description ? <Text style={styles.cardNote}>{document.description}</Text> : null}
              <Text style={styles.cardNote}>
                {document.issueDate ? `Issued ${document.issueDate.slice(0, 10)} · ` : ''}
                {document.originalName || 'No file uploaded'}
              </Text>
              <Button title="Edit details" variant="link" disabled={Boolean(busyId)} onPress={() => beginEdit(document)} />
            </>
          )}
          <Button
            title={document.fileUrl ? 'Open document' : 'Upload file'}
            variant="social"
            disabled={Boolean(busyId)}
            onPress={() => document.fileUrl ? openDocument(document) : upload(document)}
          />
          {document.fileUrl ? (
            <Button title="Replace file" variant="link" disabled={Boolean(busyId)} onPress={() => upload(document)} />
          ) : null}
          <Button title="Remove" variant="link" disabled={Boolean(busyId)} onPress={() => setRemove(document)} />
        </View>
      ))}
      {!documents.length && !loading ? <Text style={styles.cardNote}>No profile documents yet.</Text> : null}
      {creating ? (
        <View style={styles.record}>
          <Input label="TITLE" maxLength={120} value={title} onChangeText={setTitle} />
          <Input label="DESCRIPTION" required={false} multiline maxLength={1000} value={description} onChangeText={setDescription} />
          <DateField label="Issue date" value={issueDate} onChange={setIssueDate} />
          <Button title={busyId === 'new' ? 'Creating...' : 'Create document'} disabled={Boolean(busyId)} onPress={create} />
          <Button title="Cancel" variant="link" disabled={Boolean(busyId)} onPress={() => setCreating(false)} />
        </View>
      ) : (
        <Button title="Add profile document" variant="social" disabled={Boolean(busyId)} onPress={() => setCreating(true)} />
      )}
      <Button title={loading ? 'Refreshing...' : 'Refresh documents'} variant="social" disabled={loading || Boolean(busyId)} onPress={load} />
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}
