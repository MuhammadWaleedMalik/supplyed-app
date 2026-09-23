import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Section from './Section';
import SectionHeading from './SectionHeading';
import { colors, common } from '../Ui/theme';
import { questions } from '../../constants/landingData';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section soft>
      <SectionHeading
        label="COMMON QUESTIONS"
        title="Before your school registers."
      />
      <View style={styles.list}>
        {questions.map(([question, answer], index) => (
          <View
            key={question}
            style={[styles.item, openIndex === index && styles.active]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: openIndex === index }}
              onPress={() => setOpenIndex(openIndex === index ? null : index)}
              style={styles.question}
            >
              <Text style={styles.label}>{question}</Text>
              <Text style={styles.symbol}>
                {openIndex === index ? '−' : '+'}
              </Text>
            </Pressable>
            {openIndex === index && (
              <Text style={[common.body, styles.answer]}>{answer}</Text>
            )}
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 12 },
  item: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  active: { borderColor: colors.blue },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    minHeight: 56,
  },
  label: { ...common.bold, fontSize: 15, lineHeight: 23, flex: 1 },
  symbol: { color: colors.blue, fontSize: 22 },
  answer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
});
