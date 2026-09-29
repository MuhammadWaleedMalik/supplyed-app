import navigationReducer, {
  openMessages,
  showPage,
} from '../feature/dashboard/shared/store/navigationSlice';
import schoolReducer, {
  selectSchoolJob,
  setSchoolData,
} from '../feature/dashboard/school/store/schoolSlice';
import teacherReducer, {
  setTeacherData,
} from '../feature/dashboard/teacher/store/teacherSlice';
import type { Job } from '../feature/dashboard/shared/apis/jobsApi';

const job: Job = {
  id: 'job-1',
  postedByUserId: 'school-1',
  title: 'Maths Teacher',
  status: 'ACTIVE',
};

describe('dashboard Redux state', () => {
  it('changes the active dashboard page', () => {
    const initial = navigationReducer(undefined, { type: 'initial' });
    const next = navigationReducer(initial, showPage('Messages'));

    expect(next.page).toBe('Messages');
  });

  it('opens messages with the selected teacher', () => {
    const initial = navigationReducer(undefined, { type: 'initial' });
    const next = navigationReducer(initial, openMessages('teacher-1'));

    expect(next.page).toBe('Messages');
    expect(next.messageRecipientId).toBe('teacher-1');
  });

  it('stores school jobs and keeps the selected job easy to follow', () => {
    const initial = schoolReducer(undefined, { type: 'initial' });
    const loaded = schoolReducer(
      initial,
      setSchoolData({ jobs: [job], applications: [] }),
    );
    const selected = schoolReducer(loaded, selectSchoolJob(job.id));

    expect(selected.jobs).toEqual([job]);
    expect(selected.selectedJobId).toBe(job.id);
  });

  it('stores teacher jobs and only the supplied teacher applications', () => {
    const initial = teacherReducer(undefined, { type: 'initial' });
    const loaded = teacherReducer(
      initial,
      setTeacherData({ jobs: [job], applications: [] }),
    );

    expect(loaded.jobs).toEqual([job]);
    expect(loaded.applications).toEqual([]);
  });
});
