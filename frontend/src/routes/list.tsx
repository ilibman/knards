import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';

import useAuth from '../context/AuthProvider';
import { useIntersection } from '../hooks';
import {
  getCardsQueryOptions,
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  getCardPartialsQueryOptions
} from '../query-client';
import {
  CardSeries,
  Tag,
  CardPartial
} from '../models';
import RadioboxGroup from '../components/ui/RadioboxGroup';
import ListStatsAndRevise from '../components/ListStatsAndRevise';
import DialogEditSeries from '../components/dialogs/DialogEditSeries';
import DialogEditTags from '../components/dialogs/DialogEditTags';

export default function List() {
  const { authTokens } = useAuth();
  const [params, setParams] = useState<{
    series?: string;
    tags?: string;
    tagInclusion?: string;
    fulltext?: string;
  }>({});
  const [tagInclusionParam, setTagInclusionParam] = useState<{
    'or': boolean;
    'and': boolean;
  }>({
    'or': false,
    'and': false
  });

  const [cardSeriesMap, setCardSeriesMap]
    = useState<Record<number, CardSeries>>({});
  const [selectedCardSeries, setSelectedCardSeries]
    = useState<CardSeries | null>(null);

  const [tagsMap, setTagsMap]
    = useState<Record<number, Tag>>({});
  const [selectedTags, setSelectedTags]
    = useState<Array<Tag>>([]);

  const [tagsChanged, setTagsChanged] = useState<boolean>(false);
  const [cookies, setCookies, removeCookies] = useCookies(['tags']);

  const {
    data: cards,
    isFetching: isCardsQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    ...getCardsQueryOptions(authTokens.access, params)
  });

  const {
    data: cardSeries,
    isLoading: isCardSeriesQueryLoading,
  } = useQuery({
    ...getCardSeriesQueryOptions(authTokens.access)
  });

  const {
    data: tags,
    isFetching: isTagsQueryLoading,
    refetch: refetchTags
  } = useQuery({
    ...getTagsQueryOptions(authTokens.access)
  });

  const {
    data: cardPartials,
    isFetching: isCardPartialsQueryLoading
  } = useQuery({
    ...getCardPartialsQueryOptions(authTokens.access),
    select: (result) => {
      const cardPartialsMap: Record<number, Array<CardPartial>> = {};
      result.forEach((_) => {
        if (!cardPartialsMap[_.card]) {
          cardPartialsMap[_.card] = [];
        }
        cardPartialsMap[_.card].push({ ..._ });
      });
      return cardPartialsMap;
    }
  });

  const cursorRef = useIntersection(() => {
    fetchNextPage();
  });

  useEffect(() => {
    if (cardSeries) {
      const cardSeriesMap: Record<number, CardSeries> = {};
      cardSeries.map((_) => (
        cardSeriesMap[_.id] = { ..._ }
      ));
      setCardSeriesMap(cardSeriesMap);
    }
  }, [cardSeries]);

  useEffect(() => {
    if (tags) {
      const tagsMap: Record<number, Tag> = {};
      tags.map((_) => (
        tagsMap[_.id] = { ..._ }
      ));
      setTagsMap(tagsMap);

      if (cookies.tags) {
        const preselectedTagsIds
          = JSON.stringify(cookies.tags).indexOf(',') !== -1
            ? cookies.tags.split(',')
            : cookies.tags;
        params.tags = `tags=${preselectedTagsIds}`;
        setParams({ ...params });
        setSelectedTags(
          preselectedTagsIds.length
            ? preselectedTagsIds.map((_: number) => tagsMap[_])
            : [tagsMap[preselectedTagsIds]]
        );
      }
    }
  }, [tags]);

  useEffect(() => {
    if (!selectedCardSeries) {
      delete params.series;
      setParams({ ...params });
      return;
    }
      
    params.series = `series=${selectedCardSeries.id}`
    setParams({ ...params });
  }, [selectedCardSeries]);

  useEffect(() => {
    if (!tagsChanged) {
      return;
    }

    if (selectedTags.length === 0) {
      delete params.tags;
      setParams({ ...params });
      removeCookies('tags');
    } else {
      params.tags = `tags=${selectedTags.map((_) => _.id)}`;
      setParams({ ...params });
      setCookies(
        'tags',
        selectedTags.map((_) => _.id).join(','),
        { path: '/' }
      );
    }
  }, [selectedTags]);

  function renderPartialText(
    content: Array<{
      children: Array<{ text: string; insetQuestion: boolean; }>;
      type: string;
    }>) {
      return content.map((_) => (
        _.children.map((__) => (
          __.insetQuestion
            ? '?'
            : __.text
        ))
      )).flat().join(' ').substring(0, 100);
    }

  return (
    <>
      {(
        (isCardsQueryLoading && !isFetchingNextPage)
        || isTagsQueryLoading
        || isCardPartialsQueryLoading
      ) && <p className="mt-2 ml-8 text-white text-lg">Loading...</p>}
      {(
        (!isCardsQueryLoading || isFetchingNextPage)
        && !isTagsQueryLoading
        && !isCardPartialsQueryLoading
      ) && (
        <>
          <div className="mt-2">
            <DialogEditSeries
              onlySelect={true}
              selectedSeries={selectedCardSeries}
              cardSeries={cardSeries!}
              disabled={isCardSeriesQueryLoading}
              placeForReorderBtn={false}
              onSave={(cardSeries: CardSeries) => (
                setSelectedCardSeries(cardSeries)
              )}
              onClearSeries={() => setSelectedCardSeries(null)}
            />
          </div>
          <div className="mt-2">
            <DialogEditTags
              onlySelect={true}
              selectedTags={selectedTags}
              tags={tags!}
              disabled={isTagsQueryLoading}
              onCreateNewTag={(createdTag: Tag, selectedTags: Array<Tag>) => {
                setSelectedTags([
                  ...selectedTags,
                  createdTag
                ]);
                refetchTags();
              }}
              onSave={(tags: Array<Tag>) => {
                setTagsChanged(true);
                setSelectedTags(tags);
              }}
              onClearTags={() => {
                setTagsChanged(true);
                setSelectedTags([]);
              }}
            />
          </div>
          <div className="relative my-2 ml-2.5">
            <RadioboxGroup
              classForLabels={'text-white font-base font-semibold text-lg'}
              vertical={false}
              properties={[
                {
                  title: 'Or',
                  value: tagInclusionParam['or']
                },
                {
                  title: 'And',
                  value: tagInclusionParam['and']
                }
              ]}
              onSelected={(newValues: Array<boolean>) => {
                setTagInclusionParam({
                  'or': newValues[0],
                  'and': newValues[1]
                });
                params.tagInclusion
                  = `tag_inclusion=${newValues[0] ? 'or' : 'and'}`;
                setParams({ ...params });
              }}
            />
          </div>
          <ListStatsAndRevise queryParams={params}>
          </ListStatsAndRevise>
          <div>
            {false && <p>Loading...</p>}
            {true && (
              <div className="flex flex-col border-t-2">
                {cards?.map((_, i) => (
                  <Link
                    className="bg-brown-light border-b"
                    key={_.id}
                    to={`/edit/${_.id}`}
                  >
                    <div className="flex font-semibold text-lg">
                      {
                        _.title
                        && (
                          <div className="flex-1 px-2 border-r">
                            {_.title}
                          </div>
                        )
                      }
                      <div className="flex-1 px-2 border-r">
                        {
                          cardPartials[_.id]
                            ? renderPartialText(
                              cardPartials[_.id][0].content,
                              true
                            )
                            : ''
                        }
                      </div>
                      {
                        _.card_series
                        && (
                          <div className="px-2 border-r">
                            {
                              _.card_series
                                ? `#${_.n_in_series} in ${cardSeriesMap[_.card_series]?.name}`
                                : ''
                            }
                          </div>
                        )
                      }
                      {
                        _.tags.length > 0
                        && (
                          <div className="px-2 border-r">{_.tags.map((__) => (
                            <div key={tagsMap[__]?.id}>{tagsMap[__]?.name}</div>
                          ))}</div>
                        )
                      }
                      <div className="px-2">
                        Created: {new Date(_.created_at).toLocaleString(
                          'en-UK',
                          { day: 'numeric', month: 'numeric', year: 'numeric' }
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <div
                  className="flex justify-center my-10
                    font-semibold text-lg
                    this-should-be-at-the-end-of-the-list"
                  ref={cursorRef}
                >
                  {!hasNextPage && <p className="text-white">
                    No more cards.
                  </p>}
                  {isFetchingNextPage && <p className="text-white">
                    Loading...
                  </p>}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}