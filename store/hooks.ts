import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

export function useAppDispatch() {
  return useDispatch<AppDispatch>();
}

export function useAppSelector<T>(select: (state: RootState) => T) {
  return useSelector(select);
}
