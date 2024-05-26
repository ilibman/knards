import { useState, useEffect, useContext } from 'react';
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

  async function handleSeriesPickerChange(value) {
    if (typeof value === 'number') {
      setCard({
        ...card,
        card_series: value
      });
    } else if (typeof value === 'string') {
      try {
        const response = await api.post(
          'api/cards/card-series/',
          { name: value },
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
        const cardSeriesMap = { ...cardSeries };
        cardSeriesMap[response.data.id] = { ...response.data };
        setCardSeries(cardSeriesMap);
        setSeriesPickerData(
          seriesPickerData.concat([{ label: value, value: response.data.id }])
        );
        setCard({
          ...card,
          n_in_series: 1,
          card_series: response.data.id
        });
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      }
    }
  }

  function handleClearSeries() {
    setCard({
      ...card,
      card_series: null
    });
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
      content: [{
        type,
        children: [{ text: '' }]
      }],
      prompt_initial_content: [{
        type,
        children: [{ text: '' }]
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
      // save partials
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

  function handlePartialContentChange(value, partialIndex) {
    setCardPartials(cardPartials.map((_, i) => {
      if (i === partialIndex) {
        return {
          ..._,
          content: [...value]
        }
      } else {
        return { ..._ };
      }
    }));
  }

  function handlePartialIsPromptChange(value, partialIndex) {
    setCardPartials(cardPartials.map((_, i) => {
      if (i === partialIndex) {
        return {
          ..._,
          is_prompt: value
        }
      } else {
        return { ..._ };
      }
    }));
  }

  function handlePromptInitialContentChange(value, partialIndex) {
    setCardPartials(cardPartials.map((_, i) => {
      if (i === partialIndex) {
        return {
          ..._,
          prompt_initial_content: value
        }
      } else {
        return { ..._ };
      }
    }));
  }

  function renderReadOnlyPartial(content) {
    return (
      <>
        {content.map((_, i) => (
          <span
            key={i}
          >{_.children.map((__, j) => (
            <span
              className={`${__.insetQuestion ? 'inset-question' : ''}`}
              key={i + j}
            >{__.text}</span>
          ))}</span>
        ))}
      </>
    );
  }

  function handlePartialDelete() {
    setActivePartial(null);
    setCardPartials(cardPartials.filter((_, i) => i !== activePartial));
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
            <div className="flex">
              <InputPicker
                creatable
                locale={{ createOption: 'New series: {0}' }}
                data={seriesPickerData}
                style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
                value={cardSeries[card.card_series]?.id}
                onChange={handleSeriesPickerChange}
                onCreate={handleSeriesPickerChange}
                onClean={handleClearSeries}
              />
            </div>
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

          <div className="flex flex-col border-t-2 border-black">
            {cardPartials.map((_, partialIndex) => (
              <div
                className="pt-2.5 pr-2.5 pl-2.5"
                key={partialIndex}
              >
                <ul className="flex flex-row mb-2">
                  <li
                    className="mr-2 p-2 bg-white kn-base-btn"
                    onClick={() => addPartial(partialIndex, 'text')}
                  >
                    <IoText />
                  </li>
                  <li
                    className="mr-2 p-2 bg-white kn-base-btn"
                    onClick={() => addPartial(partialIndex, 'code')}
                  >
                    <FaCode />
                  </li>
                </ul>
                {activePartial === partialIndex && (
                  <PartialEditor
                    content={_.content}
                    isPrompt={_.is_prompt}
                    promptInitialContent={_.prompt_initial_content}
                    onClick={() => setActivePartial(partialIndex)}
                    onContentChange={
                      (value) => handlePartialContentChange(
                        value,
                        partialIndex
                      )
                    }
                    onIsPromptChange={(value) =>
                      handlePartialIsPromptChange(
                        value,
                        partialIndex
                      )
                    }
                    onPromptInitialContentChange={(value) =>
                      handlePromptInitialContentChange(
                        value,
                        partialIndex
                      )
                    }
                    onDelete={handlePartialDelete}
                  />
                )}
                {activePartial !== partialIndex && (
                  <div
                    className="p-4 flex flex-wrap bg-brown-light shadow-md
                      outline-none partial-editor inactive-partial"
                    onClick={() => setActivePartial(partialIndex)}
                  >{renderReadOnlyPartial(_.content)}</div>
                )}
              </div>
            ))}
            <ul className="pt-2.5 pr-2.5 pl-2.5 flex flex-row mb-2">
              <li
                className="mr-2 p-2 bg-white kn-base-btn"
                onClick={() => addPartial(cardPartials.length, 'text')}
              >
                <IoText />
              </li>
              <li
                className="mr-2 p-2 bg-white kn-base-btn"
                onClick={() => addPartial(cardPartials.length, 'code')}
              >
                <FaCode />
              </li>
            </ul>
            <div
              className="mb-2.5 ml-2.5 w-[80px] h-[72px]
                bg-green kn-base-btn"
              onClick={() => saveCard()}
            >
              <FaCheck className="fill-white" />
            </div>
          </div>
        </>
      )}
    </>
  );
}