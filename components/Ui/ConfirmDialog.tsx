import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import FilterSheet from './FilterSheet';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  context?: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void> | boolean | void;
};

export default function ConfirmDialog(props: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (props.visible) setError('');
  }, [props.visible, props.title]);
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await props.onConfirm();
      if (result !== false) props.onClose();
      else
        setError(
          'The action could not be confirmed. Check the latest record and try again.',
        );
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Please try again.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <FilterSheet
      visible={props.visible}
      title={props.title}
      onClose={props.onClose}
      onReset={props.onClose}
      resetLabel="Cancel"
      applyLabel={props.confirmLabel}
      onApply={confirm}
      busy={busy}
      destructive={props.destructive}
    >
      <View style={[styles.icon, props.destructive && styles.dangerIcon]}>
        {props.destructive ? (
          <AlertCircle size={28} color="#b42318" />
        ) : (
          <CheckCircle2 size={28} color={colors.brandDark} />
        )}
      </View>
      {props.context ? (
        <Text style={styles.context}>{props.context}</Text>
      ) : null}
      <Text style={styles.description}>{props.description}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </FilterSheet>
  );
}
const useStyles = createThemedStyles(colors => ({
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  dangerIcon: { backgroundColor: '#fff1f0' },
  context: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 24 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 22 },
}));
