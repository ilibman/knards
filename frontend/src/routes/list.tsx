import { useState, useEffect, useContext } from 'react';
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
import api from '../api';
import ListStatsAndRevise from '../components/ListStatsAndRevise';

export default function List() {
  const { authTokens } = useContext(AuthContext);
  const [params, setParams] = useState({});
  const [cards, setCards] = useState([]);
  const [cardSeries, setCardSeries] = useState({});
  const [tags, setTags] = useState({});
  const [preselectedTags, setPreselectedTags] = useState([]);
  const [cardPartials, setCardPartials] = useState({});

  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);

  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardPartialsLoading, setIsCardPartialsLoading] = useState(true);

  const [cookies, setCookies, removeCookies] = useCookies(['tags']);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      // construct query params string from params object
      let flattenedParams = Object.keys(params).reduce(function (r, k) {
        return r = r + params[k] + '&';
      }, '');
      flattenedParams = flattenedParams.substring(
        0,
        flattenedParams.length - 1
      );

      try {
        const response = await api.get(
          `api/cards/cards/${flattenedParams ? `?${flattenedParams}` : ''}`,
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true,
            signal: controller.signal
          }
        );
        setCards(response.data);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardsLoading(false);
      }
    };

    fetchCards();

    return () => {
      controller.abort();
    }
  }, [params]);

  useEffect(() => {

    const fetchCardSeries = async () => {
      try {
        const response = await api.get(
          'api/cards/card-series/',
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        const cardSeriesMap = {};
        response.data.map((_) => (
          cardSeriesMap[_.id] = { ..._ }
        ));
        setSeriesPickerData(
          response.data.map((_) => ({ label: _.name, value: _.name }))
        );
        setCardSeries(cardSeriesMap);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardSeriesLoading(false);
      }
    };

    fetchCardSeries();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get(
          'api/cards/tags/',
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        const tagsMap = {};
        response.data.map((_) => (
          tagsMap[_.id] = { ..._ }
        ));
        setTagPickerData(
          response.data.map((_) => ({ label: _.name, value: _.name }))
        );
        setTags(tagsMap);
        
        if (cookies.tags) {
          const preselectedTagsIds
            = JSON.stringify(cookies.tags).indexOf(',') !== -1
              ? cookies.tags.split(',')
              : cookies.tags;
          params.tags = `tags=${preselectedTagsIds}`;
          setParams({ ...params });
          setPreselectedTags(
            preselectedTagsIds.length
              ? preselectedTagsIds.map((_) => tagsMap[_]?.name)
              : [tagsMap[preselectedTagsIds]?.name]
          );
        }
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsTagsLoading(false);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    const fetchCardPartials = async () => {
      try {
        const response = await api.get(
          'api/cards/card-partials/',
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        const cardPartialsMap = {};
        response.data.forEach((_) => {
          if (!cardPartialsMap[_.card]) {
            cardPartialsMap[_.card] = [];
          }
          cardPartialsMap[_.card].push({ ..._ });
        });
        setCardPartials(cardPartialsMap);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardPartialsLoading(false);
      }
    };

    fetchCardPartials();
  }, []);

  function handleSeriesPickerChange(value) {
    if (!value || value.length === 0) {
      delete params.series;
      setParams({ ...params });
      return false;
    }

    const flattenedSeries = Object.keys(cardSeries).reduce(function (r, k) {
      return r.concat(cardSeries[k]);
    }, []);

    const selectedSeriesId = flattenedSeries.find((_) => (
      _.name === value
    )).id;
      
    params.series = `series=${selectedSeriesId}`
    setParams({ ...params });
  }

  function handleTagSelect(value) {
    const flattenedTags = Object.keys(tags).reduce(function (r, k) {
      return r.concat(tags[k]);
    }, []);
    
    const selectedTagIds = flattenedTags.filter((_) => (
      value.includes(_.name)
    )).map((_) => _.id);

    params.tags = `tags=${selectedTagIds}`;
    setCookies('tags', selectedTagIds.join(','), { path: '/' });
    setParams({ ...params });
  }

  function handleTagRemove(value) {
    const tagId = Object.values(tags).find((_) => _.name === value).id;
    const tagList
      = JSON.stringify(cookies.tags).indexOf(',') !== -1
        ? cookies.tags.split(',').filter((_) => +_ !== tagId)
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

  function handleTagInclusionSettingChange(value) {
    params.tagInclustion = `tag_inclusion=${value}`;
    setParams({ ...params });
  }

  function handleFulltextChange(value) {
    if (value.target.value === '') {
      delete params.fulltext;
      setParams({ ...params });
      return false;
    }
      
    params.fulltext = `fulltext=${value.target.value}`
    setParams({ ...params });
  }

  function renderPartialText(content) {
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
        isCardSeriesLoading
        || isTagsLoading
      ) && <p>Loading...</p>}
      {(
        !isCardSeriesLoading
        && !isTagsLoading
      ) && (
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
          <div id="tag-picker">
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
              onChange={handleTagInclusionSettingChange}
            >
              <Radio className="text-lg" checked value="or">OR</Radio>
              <Radio className="text-lg" value="and">AND</Radio>
            </RadioGroup>
          </div>
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
            {(
              isCardsLoading
              || isCardSeriesLoading
              || isTagsLoading
              || isCardPartialsLoading
            ) && <p>Loading...</p>}
            {(
              !isCardsLoading
              && !isCardSeriesLoading
              && !isTagsLoading
              && !isCardPartialsLoading
            ) && (
              <div className="flex flex-col border-t-2">
                {cards.map((_, i) => (
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
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}