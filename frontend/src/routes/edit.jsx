import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  InputGroup,
  InputPicker,
  TagPicker,
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import AuthContext from '../context/AuthProvider';
import PartialEditor from '../components/PartialEditor';
import api from '../api';
import '../styles/rs-suite-overrides.scss';

export default function Edit() {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [card, setCard] = useState({});
  const [cardSeries, setCardSeries] = useState({});
  const [tags, setTags] = useState({});
  const [cardPartials, setCardPartials] = useState([]);

  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);

  const [isCardLoading, setIsCardLoading] = useState(true);
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardPartialsLoading, setIsCardPartialsLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);

  const [activePartial, setActivePartial] = useState(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await api.get(
          `api/cards/cards/${id}/`,
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        setCard(response.data);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardLoading(false);
      }
    };

    fetchCard();
  }, [id]);

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
          response.data.map((_) => ({ label: _.name, value: _.id }))
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
  }, [card.id]);

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
  }, [card.id]);

  useEffect(() => {
    const fetchCardPartials = async () => {
      try {
        const response = await api.get(
          `api/cards/card-partials/?card=${id}`,
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        setCardPartials(response.data);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardPartialsLoading(false);
      }
    };

    fetchCardPartials();
  }, [card.id]);

  function handleSeriesPickerChange(value) {
    setCard({
      ...card,
      card_series: value
    });
  }

  useEffect(() => {
    setTagPickerData(
      Object.values(tags).map((_) => ({ label: _.name, value: _.name }))
    );

    if (card.id && Object.entries(tags).length > 0) {
      const tagsIds = card.tags.map((_) => (
        tags[_].id
      ));
      const tagsNames = Object.values(tags)
        .filter((_) => (
          tagsIds.includes(_.id)
        ))
        .map((_) => (
          _.name
        ));
      setCard({
        ...card,
        tags: [...tagsIds],
        tagsNames: [...tagsNames]
      });
    }
  }, [tags]);

  function handleEnterTags(value) {
    const allTagsNames = Object.values(tags).map((_) => _.name);
    const newTags = value.filter((_) => (
      !allTagsNames.includes(_)
    ));

    newTags.forEach(async (_) => {
      try {
        const response = await api.post(
          'api/cards/tags/',
          { name: _ },
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`,
              'X-CSRFToken': document.cookie.replace(
                /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
              )
            },
            withCredentials: true
          }
        );

        setCard({
          ...card,
          tags: [...card.tags, response.data.id]
        });
        const tagsMap = {};
        Object.values(tags).map((__) => (
          tagsMap[__.id] = { ...__ }
        ));
        tagsMap[response.data.id] = { ...response.data };
        setTags(tagsMap);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      }
    });
  }

  async function handlePickTags(value) {
    const newTags = Object.values(tags)
      .filter((_) => (
        value.includes(_.name)
      ))
      .map((_) => (
        {
          id: _.id,
          name: _.name
        }
      ));

    setCard({
      ...card,
      tags: newTags.map((_) => _.id),
      tagsNames: newTags.map((_) => _.name)
    });
  }

  function addPartial(index, type) {
    cardPartials.splice(index, 0, {
      'partial_type': type,
      content: [{
        type: 'text',
        content: '',
        firstNodeInLine: true,
        lastNodeInLine: true
      }]
    });
    setCardPartials(cardPartials.map((_, i) => (
      {
        ..._,
        position: ++i
      }
    )));
  }

  async function saveChanges() {
    setIsCardSaving(true);

    // save card metadata
    try {
      await api.patch(
        `api/cards/cards/${card.id}/`,
        { ...card },
        {
          headers: {
            Authorization: `JWT ${authTokens.access}`,
            'X-CSRFToken': document.cookie.replace(
              /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
            )
          },
          withCredentials: true
        }
      );
    } catch (error) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      if (cardPartials.length === 0) {
        setIsCardSaving(false);
        navigate('/list');
      }
    }

    // save partials
    cardPartials.forEach(async (_, i) => {
      if (!_.id) {
        try {
          await api.post(
            'api/cards/card-partials/',
            { ..._ },
            {
              headers: {
                Authorization: `JWT ${authTokens.access}`,
                'X-CSRFToken': document.cookie.replace(
                  /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
                )
              },
              withCredentials: true
            }
          );
        } catch (error) {
          if (!error.response) {
            console.error(error.message);
          }
        } finally {
          if (i === cardPartials.length - 1) {
            setIsCardSaving(false);
            navigate('/list');
          }
        }
      } else {
        try {
          await api.patch(
            `api/cards/card-partials/${_.id}/`,
            { ..._ },
            {
              headers: {
                Authorization: `JWT ${authTokens.access}`,
                'X-CSRFToken': document.cookie.replace(
                  /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
                )
              },
              withCredentials: true
            }
          );
        } catch (error) {
          if (!error.response) {
            console.error(error.message);
          }
        } finally {
          if (i === cardPartials.length - 1) {
            setIsCardSaving(false);
            navigate('/list');
          }
        }
      }
    });
  }

  function handlePartialChange(event, index) {
    setCardPartials(cardPartials.map((_, i) => {
      if (i === index) {
        return {
          ..._,
          content: event.target.value
        }
      } else {
        return _;
      }
    }));
  }

  return (
    <>
      <div
        id="title"
        onClick={() => setActivePartial(null)}
      >
        <label
          className="mx-3 text-white font-base font-semibold text-lg"
        >Title:</label>
        <InputGroup
          inside
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
        >
          <Input
            spellCheck={false}
            value={card.title ?? ''} 
            onChange={e => setCard({
              ...card,
              title: e
            })}
          />
        </InputGroup>
      </div>
      <div
        id="series-picker"
        onClick={() => setActivePartial(null)}
      >
        <label
          className="mx-3 text-white font-base font-semibold text-lg"
        >Series:</label>
        <InputPicker
          data={seriesPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
          value={cardSeries[card.card_series]?.id}
          onChange={handleSeriesPickerChange}
        />
      </div>
      <div
        id="tag-picker"
        onClick={() => setActivePartial(null)}
      >
        <label
          className="mx-3 text-white font-base font-semibold text-lg"
        >Tags:</label>
        <TagPicker
          data={tagPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
          value={card.tagsNames}
          onChange={handleEnterTags}
          onSelect={handlePickTags}
        />
      </div>
      
      <div>
        {(
          isCardLoading
          || isCardSeriesLoading
          || isTagsLoading
          || isCardPartialsLoading
        ) && <p>Loading...</p>}
        {(
          !isCardLoading
          && !isCardSeriesLoading
          && !isTagsLoading
          && !isCardPartialsLoading
        ) && (
          <div className="flex flex-col border-t">
            {cardPartials.map((_, partialIndex) => (
              <div
                className="pt-2.5 pr-2.5 pl-2.5"
                key={_.id}
              >
                <ul className="flex flex-row mb-2">
                  <li
                    className="mr-2 p-2 bg-white shadow-md cursor-pointer
                      hover:opacity-80"
                    onClick={() => addPartial(partialIndex, 'text')}
                  >
                    <IoText />
                  </li>
                  <li
                    className="mr-2 p-2 bg-white shadow-md cursor-pointer
                      hover:opacity-80"
                    onClick={() => addPartial(partialIndex, 'code')}
                  >
                    <FaCode />
                  </li>
                </ul>
                <PartialEditor
                  className={`p-4 flex flex-wrap bg-brown-light shadow-md
                    ${activePartial === partialIndex
                      ? 'active-partial'
                      : 'inactive-partial'}`.replace(/\s+/g, ' ').trim()}
                  content={_.content}
                  partialPosition={_.position}
                  onClick={setActivePartial}
                  onChange={(e) => handlePartialChange(e, partialIndex)}
                >
                </PartialEditor>
              </div>
            ))}
            <ul className="pt-2.5 pr-2.5 pl-2.5 flex flex-row mb-2">
              <li
                className="mr-2 p-2 bg-white shadow-md cursor-pointer
                  hover:opacity-80"
                onClick={() => addPartial(cardPartials.length, 'text')}
              >
                <IoText />
              </li>
              <li
                className="mr-2 p-2 bg-white shadow-md cursor-pointer
                  hover:opacity-80"
                onClick={() => addPartial(cardPartials.length, 'code')}
              >
                <FaCode />
              </li>
            </ul>
            <div
              className="flex justify-center mb-2.5 ml-2.5 p-2 w-[72px]
                bg-green shadow-md
                cursor-pointer hover:opacity-80"
              onClick={() => saveChanges()}
            >
              <FaCheck className="fill-white" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}