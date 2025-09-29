import {
  QueryClient,
  QueryCache,
  queryOptions,
  infiniteQueryOptions
} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from './api';
import {
  CardsPaginated,
  Card,
  CardSeries,
  Tag,
  CardPartial,
} from './models';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      // staleTime: 1 * 60 * 1000, // cache the data for 1 min
      // gcTime: Infinity,
      // refetchOnWindowFocus: false,
      // refetchOnMount: 'always',
      // refetchOnReconnect: false,
    },
    mutations: {}
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast(`Something went wrong: ${error.message}`);
    }
  }),
});

export function getCardsQueryOptions(accessToken: string, queryParams: any) {
  return infiniteQueryOptions({
    queryKey: ['cards', queryParams],
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
  });
}

export function getCardQueryOptions(
  accessToken: string,
  cardId: number
) {
  return queryOptions({
    queryKey: ['cards', cardId],
    queryFn: async (meta) => {
      const response = await api.get<Card>(
        `api/cards/cards/${cardId}/`,
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

export function getCardSeriesQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ['card_series'],
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
  });
}

export function getTagsQueryOptions(accessToken: string) {
  return queryOptions({
    queryKey: ['tags'],
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
    queryKey: ['card_partials'],
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

export function getCardPartialsForCardQueryOptions(
  accessToken: string,
  cardId: number
) {
  return queryOptions({
    queryKey: ['card_partials', cardId],
    queryFn: async (meta) => {
      if (cardId) {
        const response = await api.get<Array<CardPartial>>(
          `api/cards/card-partials/?card=${cardId}`,
          {
            headers: {
              Authorization: `JWT ${accessToken}`
            },
            withCredentials: true,
            signal: meta.signal
          }
        );
      
        return response.data;
      } else {
        return [];
      }
    }
  });
}

export async function createNewCard(
  accessToken: string,
  cardData: Partial<Card>
) {
  const response = await api.post(
    'api/cards/cards/',
    { ...cardData },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function updateCard(
  accessToken: string,
  cardId: number,
  cardData: Partial<Card>
) {
  const response = await api.patch(
    `api/cards/cards/${cardId}/`,
    { ...cardData },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function createNewCardSeries(
  accessToken: string,
  seriesName: string
) {
  const response = await api.post(
    'api/cards/card-series/',
    { name: seriesName },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function createNewTag(
  accessToken: string,
  tagName: string
) {
  const response = await api.post(
    'api/cards/tags/',
    { name: tagName },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function createNewCardPartial(
  accessToken: string,
  cardPartialData: Partial<CardPartial>
) {
  const response = await api.post(
    'api/cards/card-partials/',
    { ...cardPartialData },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function updateCardPartial(
  accessToken: string,
  cardPartialId: number,
  cardPartialData: Partial<CardPartial>
) {
  const response = await api.patch(
    `api/cards/card-partials/${cardPartialId}/`,
    { ...cardPartialData },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function deleteCardPartial(
  accessToken: string,
  cardPartialId: number
) {
  const response = await api.delete(
    `api/cards/card-partials/${cardPartialId}/`,
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}

export async function reorderCardsInSeries(
  accessToken: string,
  cardsFromSeries: Array<Card>
) {
  const response = await api.post(
    `api/cards/cards/reorder_cards_in_series/`,
    { cards_from_series: cardsFromSeries },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
        'X-CSRFToken': document.cookie.replace(
          /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
        )
      },
      withCredentials: true
    }
  );

  return response.data;
}