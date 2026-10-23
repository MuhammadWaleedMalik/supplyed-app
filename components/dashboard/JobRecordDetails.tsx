import React from 'react';
import { View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { listingStatus } from '../../utils/jobs/londonTime';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import RichText from '../Ui/RichText';
import ContentPreview from '../Ui/ContentPreview';
import { useStyles } from './dashboardStyles';
export default function JobRecordDetails({
  job,
  actions,
}: {
  job: Job;
  actions?: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <RecordSection
        title={job.title}
        action={<StatusBadge status={listingStatus(job)} />}
      >
        <InfoGrid
          items={[
            { label: 'Pay', value: displayPay(job.payAmount, job.payType) },
            { label: 'Planned work', value: plannedLabel(job) },
            { label: 'Starts', value: displayDate(job.startDate) },
            { label: 'Ends', value: displayDate(job.endDate) },
          ]}
        />
      </RecordSection>
      <RecordSection title="About the role">
        <RichText
          value={job.description}
          title="Role description"
          emptyText="No description provided."
        />
        <InfoGrid
          items={[
            {
              label: 'Subjects',
              value: job.subjects?.join(', ') || job.subject,
            },
            { label: 'Key stages', value: job.keyStages?.join(', ') },
            { label: 'Required skills', value: job.requiredSkills?.join(', ') },
            {
              label: 'Experience',
              value:
                job.minExperienceYears == null
                  ? undefined
                  : job.minExperienceYears + ' years',
            },
          ]}
        />
      </RecordSection>
      <RecordSection title="Location & listing">
        <InfoGrid
          items={[
            {
              label: 'Job address',
              value: [job.address, job.city, job.county, job.postalCode]
                .filter(Boolean)
                .join(', '),
            },
            { label: 'Opens', value: displayDate(job.liveFrom) },
            {
              label: 'Application deadline',
              value: displayDate(job.expiresAt),
            },
          ]}
        />
        {job.parkingInfo ? (
          <ContentPreview title="Parking information" text={job.parkingInfo} />
        ) : null}
      </RecordSection>
      {actions ? (
        <RecordSection title="Manage this job">{actions}</RecordSection>
      ) : null}
    </View>
  );
}
