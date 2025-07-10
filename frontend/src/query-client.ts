import {
  QueryClient,
  queryOptions,
  infiniteQueryOptions
} from '@tanstack/react-query';
import api from './api';
import {
  CardsPaginated,
  CardSeries,
  Tag,
  CardPartial
} from './models';

export const queryClient = new QueryClient();

export function getCardsQueryOptions(accessToken: string, queryParams: any) {
  return infiniteQueryOptions({
    queryKey: ['cards', 'list', queryParams],
    queryFn: async (meta) => {
      // construct query params string from params object
      let flattenedParams = Object.keys(queryParams).reduce(function (r, k) {
        return r = r + (queryParams[k] ? queryParams[k] + '&' : '');
      }, '');
      flattenedParams = flattenedParams.substring(
        0,
        flattenedParams.length - 1
      );

      const response = await api.get<CardsPaginated>(
        `api/cards/cards/?page=${meta.pageParam}`
          + `${flattenedParams ? `&${flattenedParams}` : ''}`,
        {
          headers: {
            Authorization: `JWT ${accessToken}`
          },
          withCredentials: true,
          signal: meta.signal
        }
      );
    
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (result) => result.next,
    select: (result) => result.pages.flatMap((_) => _.results).flat(),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function getCardSeriesQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ['card_series', 'list'],
    queryFn: async (meta) => {
      const response = await api.get<Array<CardSeries>>(
        'api/cards/card-series/',
        {
          headers: {
            Authorization: `JWT ${accessToken}`
          },
          withCredentials: true,
          signal: meta.signal
        }
      );

      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function getTagsQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ['tags', 'list'],
    queryFn: async (meta) => {
      const response = await api.get<Array<Tag>>(
        'api/cards/tags/',
        {
          headers: {
            Authorization: `JWT ${accessToken}`
          },
          withCredentials: true,
          signal: meta.signal
        }
      );
    
      return response.data;
    }
  });
}

export function getCardPartialsQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ['card_partials', 'list'],
    queryFn: async (meta) => {
      const response = await api.get<Array<CardPartial>>(
        'api/cards/card-partials/',
        {
          headers: {
            Authorization: `JWT ${accessToken}`
          },
          withCredentials: true,
          signal: meta.signal
        }
      );
    
      return response.data;
    }
  });
}