import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { MatchScore } from '../../feature/dashboard/shared/apis/matchingApi';
import Button from '../Ui/Button';
import { useStyles } from './dashboardStyles';

export default function MatchExplanation({ match }: { match: MatchScore }) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.section}>
      <Text style={styles.teacherMeta}>
        Match: {Math.round(match.score)}/100 ·{' '}
        {match.flags.distanceKnown && match.distanceMiles != null
          ? `${match.distanceMiles.toFixed(1)} miles`
          : 'Distance unknown'}
      </Text>
      {match.flags.scheduleConflict ? (
        <Text style={styles.cardBody}>
          An existing hire overlaps these dates.
        </Text>
      ) : null}
      {match.flags.outsideTravelRadius ? (
        <Text style={styles.cardBody}>
          Outside the teacher’s travel radius.
        </Text>
      ) : null}
      <Button
        title={expanded ? 'Hide match details' : 'Why this match?'}
        variant="link"
        compact
        onPress={() => setExpanded(value => !value)}
      />
      {expanded ? (
        <>
          {match.factors.map(factor => (
            <Text key={factor.key} style={styles.cardBody}>
              {factor.label}:{' '}
              {factor.applicable ? factor.detail : 'Not enough information'}
            </Text>
          ))}
          <Text style={styles.teacherMeta}>
            Based on profile information. Confirm availability and suitability
            together.
          </Text>
        </>
      ) : null}
    </View>
  );
}
