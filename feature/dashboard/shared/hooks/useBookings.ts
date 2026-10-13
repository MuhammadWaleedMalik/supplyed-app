import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  type Booking,
  type BookingInvoiceFilter,
  type BookingQuery,
  type BookingStatus,
  getMyBookingsPage,
} from '../apis/bookingsApi';

export type BookingFilters = {
  status: 'ALL' | BookingStatus;
  search: string;
  from: string;
  to: string;
  invoice: 'ALL' | BookingInvoiceFilter;
};

const initialFilters: BookingFilters = {
  status: 'ALL',
  search: '',
  from: '',
  to: '',
  invoice: 'ALL',
};

function queryFromFilters(filters: BookingFilters, page: number): BookingQuery {
  return {
    page,
    limit: 20,
    status: filters.status === 'ALL' ? undefined : filters.status,
    search: filters.search.trim() || undefined,
    from: filters.from.trim() || undefined,
    to: filters.to.trim() || undefined,
    invoice: filters.invoice === 'ALL' ? undefined : filters.invoice,
  };
}

function rangeError(filters: BookingFilters) {
  if (!filters.from || !filters.to) return '';
  const from = new Date(filters.from).getTime();
  const to = new Date(filters.to).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return '';
  return from > to ? 'The from date must be before the to date.' : '';
}

function errorMessage(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to load bookings.';
}

export function useBookings() {
  const [filters, setFilters] = useState<BookingFilters>(initialFilters);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const page = useRef(0);
  const requestId = useRef(0);
  const requestInFlight = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  async function loadFirst(nextFilters = filtersRef.current) {
    const invalidRange = rangeError(nextFilters);
    const request = ++requestId.current;
    if (invalidRange) {
      requestInFlight.current = false;
      setBookings([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      setError(invalidRange);
      return false;
    }

    const sessionVersion = getSessionVersion();
    requestInFlight.current = true;
    setLoading(true);
    setLoadingMore(false);
    setError('');
    try {
      const result = await getMyBookingsPage(queryFromFilters(nextFilters, 1));
      if (
        request !== requestId.current ||
        sessionVersion !== getSessionVersion()
      )
        return false;
      setBookings(result.bookings);
      page.current = result.pagination.page;
      setHasMore(result.pagination.hasNextPage);
      return true;
    } catch (problem) {
      if (
        request === requestId.current &&
        sessionVersion === getSessionVersion()
      )
        setError(errorMessage(problem));
      return false;
    } finally {
      if (request === requestId.current) {
        requestInFlight.current = false;
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadFirst(filters);
      },
      filters.search ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
      requestInFlight.current = false;
    };
  }, [filters]);

  async function loadMore() {
    if (requestInFlight.current || !hasMore) return;
    requestInFlight.current = true;
    setLoadingMore(true);
    setError('');
    const request = requestId.current;
    const sessionVersion = getSessionVersion();
    try {
      const result = await getMyBookingsPage(
        queryFromFilters(filtersRef.current, page.current + 1),
      );
      if (
        request !== requestId.current ||
        sessionVersion !== getSessionVersion()
      )
        return;
      setBookings(current => [
        ...current,
        ...result.bookings.filter(
          booking => !current.some(existing => existing.id === booking.id),
        ),
      ]);
      page.current = result.pagination.page;
      setHasMore(result.pagination.hasNextPage);
    } catch (problem) {
      if (
        request === requestId.current &&
        sessionVersion === getSessionVersion()
      )
        setError(errorMessage(problem));
    } finally {
      requestInFlight.current = false;
      if (request === requestId.current) setLoadingMore(false);
    }
  }

  function setFilter<Key extends keyof BookingFilters>(
    key: Key,
    value: BookingFilters[Key],
  ) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  return {
    bookings,
    filters,
    loading,
    loadingMore,
    hasMore,
    error,
    setError,
    setFilter,
    clearFilters: () => setFilters(initialFilters),
    loadMore,
    reload: () => loadFirst(),
  };
}
