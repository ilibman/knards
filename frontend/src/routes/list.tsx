import { useState, useEffect, useContext } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import {
  Input,
  InputGroup,
  SelectPicker,
  TagPicker,
  Radio,
  RadioGroup
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import AuthContext from '../context/AuthProvider';
import { useIntersection } from '../hooks';
import {
  getCardsQueryOptions,
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  getCardPartialsQueryOptions
} from '../query-client';
import ListStatsAndRevise from '../components/ListStatsAndRevise';
import {
  CardSeries,
  Tag,
  CardPartial
} from '../models';

export default function List() {
  const { authTokens } = useContext(AuthContext);
  const [params, setParams] = useState<{
    series?: string;
    tags?: string;
    tagInclusion?: string;
    fulltext?: string;
  }>({});
  const [preselectedTags, setPreselectedTags] = useState<Array<number>>([]);
  const [preselectedTagsReady, setPreselectedTagsReady] = useState(false);

  const [seriesPickerData, setSeriesPickerData]
    = useState<Array<{ label: string; value: string; }>>([]);
  const [tagPickerData, setTagPickerData]
    = useState<Array<{ label: string; value: string; }>>([]);

  const [cookies, setCookies, removeCookies] = useCookies(['tags']);

  const {
    data: cards,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    ...getCardsQueryOptions(authTokens.access, params)
  });

  const { data: cardSeries } = useQuery({
    ...getCardSeriesQueryOptions(authTokens.access),
    select: (result) => {
      const cardSeriesMap: Record<number, CardSeries> = {};
      result.map((_) => (
        cardSeriesMap[_.id] = { ..._ }
      ));
      return cardSeriesMap;
    }
  });

  useEffect(() => {
    if (cardSeries) {
      setSeriesPickerData(
        Object.values(cardSeries).map((_) => ({ label: _.name, value: _.name }))
      );
    }
  }, [cardSeries]);

  const { data: tags } = useQuery({
    ...getTagsQueryOptions(authTokens.access),
    select: (result) => {
      const tagsMap: Record<number, Tag> = {};
      result.map((_) => (
        tagsMap[_.id] = { ..._ }
      ));
      return tagsMap;
    }
  });

  useEffect(() => {
    // TODO: remove if when we're sure tags can't be empty
    if (tags) {
      setTagPickerData(
        Object.values(tags).map((_) => ({ label: _.name, value: _.name }))
      );

      if (cookies.tags) {
        const preselectedTagsIds
          = JSON.stringify(cookies.tags).indexOf(',') !== -1
            ? cookies.tags.split(',')
            : cookies.tags;
        params.tags = `tags=${preselectedTagsIds}`;
        setParams({ ...params });
        setPreselectedTags(
          preselectedTagsIds.length
            ? preselectedTagsIds.map((_: number) => tags[_]?.name)
            : [tags[preselectedTagsIds]?.name]
        );
        setPreselectedTagsReady(true);
      }
    }
  }, [tags]);

  const { data: cardPartials } = useQuery({
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

  function handleSeriesPickerChange(value: string | null) {
    // TODO: remove this when we're sure cardSeries can't be empty
    if (!cardSeries) {
      return false;
    }

    if (!value || value.length === 0) {
      delete params.series;
      setParams({ ...params });
      return false;
    }

    const selectedSeriesId = Object.values(cardSeries).find((_) => (
      _.name === value
    ))?.id;
      
    params.series = `series=${selectedSeriesId}`
    setParams({ ...params });
  }

  function handleTagSelect(value: Array<string>) {
    // TODO: remove this when we're sure tags can't be empty
    if (!tags) {
      return false;
    }

    const selectedTagIds = Object.values(tags).filter((_) => (
      value.includes(_.name)
    )).map((_) => _.id);

    params.tags = `tags=${selectedTagIds}`;
    setCookies('tags', selectedTagIds.join(','), { path: '/' });
    setParams({ ...params });
  }

  function handleTagRemove(value: string) {
    // TODO: remove this when we're sure tags can't be empty
    if (!tags) {
      return false;
    }

    const tagId = Object.values(tags).find((_) => _.name === value)?.id;
    const tagList
      = JSON.stringify(cookies.tags).indexOf(',') !== -1
        ? cookies.tags.split(',').filter((_: string) => +_ !== tagId)
        : [];

    if (tagList.length === 0) {
      delete params.tags;
      setParams({ ...params });
      removeCookies('tags');
    } else {
      params.tags = `tags=${tagList}`;
      setParams({ ...params });
      setCookies('tags', tagList.join(','), { path: '/' });
    }
  }

  function handleTagInclusionSettingChange(value: string) {
    params.tagInclusion = `tag_inclusion=${value}`;
    setParams({ ...params });
  }

  function handleFulltextChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.value === '') {
      delete params.fulltext;
      setParams({ ...params });
      return false;
    }
      
    params.fulltext = `fulltext=${event.target.value}`
    setParams({ ...params });
  }

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
      {false && <p>Loading...</p>}
      {true && (
        <>
          <div
            className="mt-2"
            id="series-picker"
          >
            <label
              className="mx-3 text-white font-base font-semibold text-lg"
            >Series:</label>
            <SelectPicker
              data={seriesPickerData}
              style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
              onChange={handleSeriesPickerChange}
            />
          </div>
          {preselectedTagsReady && <div id="tag-picker">
            <label
              className="mx-3 text-white font-base font-semibold text-lg"
            >Tags:</label>
            <TagPicker
              data={tagPickerData}
              style={{ width: 'calc(100% - 20px)', margin: '4px 10px' }}
              defaultValue={preselectedTags}
              onSelect={handleTagSelect}
              onTagRemove={handleTagRemove}
            />
            <RadioGroup
              name="tagInclusionSetting"
              inline
              style={{ width: 'calc(100% - 20px)', margin: '0 10px' }}
              onChange={(value) => {
                handleTagInclusionSettingChange(String(value))
              }}
            >
              <Radio className="text-lg" checked value="or">OR</Radio>
              <Radio className="text-lg" value="and">AND</Radio>
            </RadioGroup>
          </div>}
          {false && (
            <div id="fulltext-search">
              <label
                className="mx-3 text-white font-base font-semibold text-lg"
              >Fulltext:</label>
              <InputGroup
                inside
                style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
                onChange={handleFulltextChange}
              >
                <Input />
                <InputGroup.Button>
                  <SearchIcon />
                </InputGroup.Button>
              </InputGroup>
            </div>
          )}
          <ListStatsAndRevise
            cards={cards}
            tags={tags}
          >
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
                                ? `#${_.n_in_series} in ${cardSeries[_.card_series]?.name}`
                                : ''
                            }
                          </div>
                        )
                      }
                      {
                        _.tags.length > 0
                        && (
                          <div className="px-2 border-r">{_.tags.map((__) => (
                            <div key={tags[__].id}>{tags[__]?.name}</div>
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