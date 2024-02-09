import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Input,
  InputGroup,
  SelectPicker,
  TagPicker,
  Radio,
  RadioGroup
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import api from '../api';
import './list.scss';

export default function List() {
  const [params, setParams] = useState({});
  const [cards, setCards] = useState([]);
  const [cardSeries, setCardSeries] = useState({});
  const [tags, setTags] = useState({});
  const [cardPartials, setCardPartials] = useState({});

  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);

  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardPartialsLoading, setIsCardPartialsLoading] = useState(true);

  useEffect(() => {
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
          `api/cards/cards/${flattenedParams ? `?${flattenedParams}` : ''}`
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
  }, [params]);

  useEffect(() => {
    const fetchCardSeries = async () => {
      try {
        const response = await api.get('api/cards/card-series/');
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
        const response = await api.get('api/cards/tags/');
        const tagsMap = {};
        response.data.map((_) => (
          tagsMap[_.id] = { ..._ }
        ));
        setTagPickerData(
          response.data.map((_) => ({ label: _.name, value: _.name }))
        );
        setTags(tagsMap);
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
        const response = await api.get('api/cards/card-partials/');
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

  function handleTagPickerChange(value) {
    if (value.length === 0) {
      delete params.tags;
      setParams({ ...params });
      return false;
    }

    const flattenedTags = Object.keys(tags).reduce(function (r, k) {
      return r.concat(tags[k]);
    }, []);
    
    const selectedTagIds = flattenedTags.filter((_) => (
      value.includes(_.name)
    )).map((_) => _.id);
      
    params.tags = `tags=${selectedTagIds}`
    setParams({ ...params });
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

  return (
    <>
      <div id="series-picker" className="">
        <label className="mx-3 font-base font-semibold text-lg">Series:</label>
        <SelectPicker
          data={seriesPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
          onChange={handleSeriesPickerChange}
        />
      </div>
      <div id="tag-picker" className="">
        <label className="mx-3 font-base font-semibold text-lg">Tags:</label>
        <TagPicker
          data={tagPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px' }}
          onChange={handleTagPickerChange}
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
      <div id="fulltext-search" className="">
        <label className="mx-3 font-base font-semibold text-lg">Fulltext:</label>
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
      <div className="">
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
          <div className="flex flex-col border-t">
            {cards.map((_, i) => (
              <Link
                className="border-b"
                key={_.id}
                to={`/edit/${_.id}`}
              >
                <div className="flex font-semibold text-lg">
                  <div className="px-2 border-r">{_.id}</div>
                  <div className="flex-1 flex flex-col px-2 border-r">
                    {
                      _.title
                      ? (
                        <>
                          <div>{_.title}</div>
                        </>
                      ) : (
                        <>
                          <div>{
                            cardPartials[_.id]
                            ? cardPartials[_.id][0].content.substring(0, 10)
                            : ''
                          }</div>
                        </>
                      )
                    }
                    <div>{
                      _.card_series
                      ? `#${_.n_in_series} in ${cardSeries[_.card_series]?.name}`
                      : ''
                    }</div>
                  </div>
                  <div className="px-2 border-r">{_.tags.map((__) => (
                    <div key={tags[__].id}>{tags[__]?.name}</div>
                  ))}</div>
                  <div className="px-2">
                    {new Date(_.created_at).toLocaleString(
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
  );
}