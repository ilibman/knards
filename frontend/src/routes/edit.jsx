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
import DialogReorderCardsInSeries from '../components/dialogs/DialogReorderCardsInSeries';
import api from '../api';

export default function Edit() {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [card, setCard] = useState({});
  const [cardSeries, setCardSeries] = useState({});
  const [cardsFromSeries, setCardsFromSeries] = useState([]);
  const [tags, setTags] = useState({});
  const [cardPartials, setCardPartials] = useState([]);

  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);

  const [isCardInSeriesOrderChanged, setIsCardInSeriesOrderChanged]
    = useState(false);

  const [isCardLoading, setIsCardLoading] = useState(true);
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isCardsFromSeriesLoading, setIsCardsFromSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardPartialsLoading, setIsCardPartialsLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);

  const [activePartial, setActivePartial] = useState(null);
  const [partialsToDelete, setPartialsToDelete] = useState([]);

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
        
        if (card.card_series) {
          fetchCardsFromSeries(card.card_series);
        }
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

  async function handleSeriesPickerChange(value) {
    if (typeof value === 'number') {
      setCard({
        ...card,
        card_series: value
      });
  
      fetchCardsFromSeries(value);
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
        setCardsFromSeries([card]);
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
    setCardsFromSeries([]);
  }

  const fetchCardsFromSeries = async (seriesId) => {
    setIsCardsFromSeriesLoading(true);

    try {
      const response = await api.get(
        `api/cards/cards/?series=${seriesId}`,
        {
          headers: {
            Authorization: `JWT ${authTokens.access}`
          },
          withCredentials: true
        }
      );
      if (!response.data.find((_) => _.id === card.id)) {
        const newCardsFromSeries = response.data.concat([card]).sort(
          (a, b) => a.n_in_series - b.n_in_series
        ).map((_, i) => (
          {
            ..._,
            n_in_series: i + 1
          }
        ));
        setCardsFromSeries(newCardsFromSeries);
      } else {
        setCardsFromSeries(response.data);
      }
    } catch (error) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      setIsCardsFromSeriesLoading(false);
    }
  };

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
      content: [{
        type,
        children: [{ text: '' }]
      }],
      prompt_initial_content: [{
        type,
        children: [{ text: '' }]
      }],
      card: card.id
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

    if (isCardInSeriesOrderChanged) {
      cardsFromSeries.forEach(async (_) => {
        // save card order in series
        try {
          await api.patch(
            `api/cards/cards/${_.id}/`,
            { n_in_series: _.n_in_series },
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
        }
      });
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
          partialsToDelete.forEach(async (_) => {
            await api.delete(
              `api/cards/card-partials/${_}/`,
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
          });
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
        {content.map((_, i) => {
          if (_.type === 'text') {
            return (
              <p
                className="min-h-[27px]"
                key={i}
              >{_.children.map((__, j) => (
                <span
                  className={`${__.insetQuestion ? 'inset-question' : ''}`}
                  key={i + j}
                >{__.text}</span>
              ))}</p>
            );
          } else {
            return (
              <pre
                className="min-h-[27px] code"
                key={i}
              >
                <code>{_.children.map((__, j) => (
                  <span
                    className={`${__.insetQuestion ? 'inset-question' : ''}`}
                    key={i + j}
                  >{__.text}</span>
                ))}</code>
              </pre>
            );
          }
        })}
      </>
    );
  }

  function handlePartialDelete() {
    const partialId = cardPartials[activePartial].id;
    setActivePartial(null);
    setCardPartials(cardPartials.filter((_, i) => i !== activePartial));
    setPartialsToDelete([...partialsToDelete, partialId]);
  }

  return (
    <>
      {(
        isCardLoading
        || isCardSeriesLoading
        || isTagsLoading
      ) && <p>Loading...</p>}
      {(
        !isCardLoading
        && !isCardSeriesLoading
        && !isTagsLoading
      ) && (
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
            <div className="flex">
              <InputPicker
                data={seriesPickerData}
                style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
                value={cardSeries[card.card_series]?.id}
                onChange={handleSeriesPickerChange}
                onClean={handleClearSeries}
              />
              <DialogReorderCardsInSeries
                series={cardSeries[card.card_series]}
                cardsFromSeries={cardsFromSeries}
                onSave={(value) => {
                  setCardsFromSeries(value);
                  setIsCardInSeriesOrderChanged(true);
                }}
              >
              </DialogReorderCardsInSeries>
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
          
          <div>
            {isCardPartialsLoading && <p>Loading...</p>}
            {!isCardPartialsLoading && (
              <div className="flex flex-col border-t-2 border-black">
                {cardPartials.map((_, partialIndex) => (
                  <div
                    className="pt-2.5 pr-2.5 pl-2.5"
                    key={partialIndex}
                  >
                    <ul className="flex flex-row mb-2.5">
                      <li
                        className="mr-2 bg-white kn-base-btn"
                        onClick={() => addPartial(partialIndex, 'text')}
                      >
                        <IoText />
                      </li>
                      <li
                        className="mr-2 bg-white kn-base-btn"
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
                        className="p-4 bg-brown-light shadow-md
                          outline-none partial-editor inactive-partial"
                        onClick={() => setActivePartial(partialIndex)}
                      >{renderReadOnlyPartial(_.content)}</div>
                    )}
                  </div>
                ))}
                <div className="inline-flex flex-col w-min">
                  <ul className="m-2.5 mr-0 flex flex-row">
                    <li
                      className="mr-2 bg-white kn-base-btn"
                      onClick={() => addPartial(cardPartials.length, 'text')}
                    >
                      <IoText />
                    </li>
                    <li
                      className="bg-white kn-base-btn"
                      onClick={() => addPartial(cardPartials.length, 'code')}
                    >
                      <FaCode />
                    </li>
                  </ul>
                  <div
                    className="mb-2.5 ml-2.5 h-[72px]
                      bg-green kn-base-btn"
                    onClick={() => saveChanges()}
                  >
                    <FaCheck className="fill-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}