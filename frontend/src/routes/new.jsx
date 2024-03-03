import { useState, useEffect, useContext } from 'react';
import {
  Input,
  InputGroup,
  SelectPicker,
  TagPicker,
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import AuthContext from '../context/AuthProvider';
import PartialEditor from '../components/PartialEditor';
import api from '../api';

export default function New() {
  const { authTokens } = useContext(AuthContext);

  const [card, setCard] = useState({});
  const [cardSeries, setCardSeries] = useState([]);
  const [tags, setTags] = useState([]);
  const [cardPartials, setCardPartials] = useState([]);
  
  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);
  
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);

  const [activePartial, setActivePartial] = useState(null);
  
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
        setSeriesPickerData(
          response.data.map((_) => ({ label: _.name, value: _.id }))
        );
        setCardSeries(response.data);
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
        setTagPickerData(
          response.data.map((_) => ({ label: _.name, value: _.name }))
        );
        setTags(response.data);
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

  function handleSeriesPickerChange(value) {
    setCard({
      ...card,
      card_series: value
    })
  }

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
        setTags([
          ...tags,
          { ...response.data }
        ]);
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

  async function saveCard() {
    setIsCardSaving(true);

    try {
      const response = await api.post(
        `api/cards/cards/`,
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
      setCard(response.data);
    } catch (error) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      if (cardPartials.length === 0) {
        setIsCardSaving(false);
        setCard({});
      }
    }
  }

  useEffect(() => {
    if (card.id) {
      cardPartials.forEach(async (_, i) => {
        try {
          await api.post(
            'api/cards/card-partials/',
            {
              ..._,
              card: card.id
            },
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
            setCard({});
            setCardPartials([]);
          }
        }
      });
    }
  }, [card.id]);

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
        className="mt-2"
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
        <SelectPicker
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
          isCardSeriesLoading
          || isTagsLoading
        ) && <p>Loading...</p>}
        {(
          !isCardSeriesLoading
          && !isTagsLoading
        ) && (
          <div className="flex flex-col border-t-2 border-black">
            {cardPartials.map((_, partialIndex) => (
              <div
                className="pt-2.5 pr-2.5 pl-2.5"
                key={partialIndex}
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
              onClick={() => saveCard()}
            >
              <FaCheck className="fill-white" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}