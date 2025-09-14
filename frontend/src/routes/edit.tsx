import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  InputGroup,
  InputPicker,
  TagPicker,
} from 'rsuite';
import { ItemDataType } from 'rsuite/esm/MultiCascadeTree';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';

import useAuth from '../context/AuthProvider';
import api from '../api';
import {
  getCardQueryOptions,
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  getCardPartialsForCardQueryOptions,
  createNewCardSeries,
  createNewTag
} from '../query-client';
import {
  Card,
  CardSeries,
  Tag,
  CardPartial
} from '../models';
import PartialEditor from '../components/partial-editor/PartialEditor';
import PartialEditorWithVim
  from '../components/partial-editor/PartialEditorWithVim';
import DialogReorderCardsInSeries
  from '../components/dialogs/DialogReorderCardsInSeries';

export default function Edit() {
  const { authTokens } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [card, setCard] = useState<Partial<Card>>({});
  const [cardSeries, setCardSeries] = useState<Record<number, CardSeries>>({});
  const [tags, setTags] = useState<Record<number, Tag>>({});
  const [cardPartials, setCardPartials]
    = useState<Array<CardPartial>>([]);
  const [cardsFromSeries, setCardsFromSeries] = useState<Array<Card>>([]);

  const [seriesPickerData, setSeriesPickerData]
    = useState<Array<{ label: string; value: number; }>>([]);
  const [tagPickerData, setTagPickerData]
    = useState<Array<{ label: string; value: string; }>>([]);

  const [isCardInSeriesOrderChanged, setIsCardInSeriesOrderChanged]
    = useState(false);

  const [isCardsFromSeriesLoading, setIsCardsFromSeriesLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);

  const [activePartial, setActivePartial] = useState<number | null>(null);
  const [partialsToDeleteIds, setPartialsToDeleteIds]
    = useState<Array<number>>([]);

  const {
    data: cachedCardData,
    isLoading: isCardQueryLoading,
    isFetched: isCardQueryLoaded
  } = useQuery({
    ...getCardQueryOptions(authTokens.access, +id!),
    enabled: !!id,
  });

  useEffect(() => {
    setCard({ ...cachedCardData });

    if (!cachedCardData?.id) {
      return;
    }

    if (cachedCardSeriesData && cardsFromSeries.length === 0) {
      if (card!.card_series) {
        fetchCardsFromSeries(card!.card_series);
      }
    }

    refetchCardPartials();
  }, [cachedCardData]);

  const {
    data: cachedCardSeriesData,
    isLoading: isCardSeriesQueryLoading,
    isFetched: isCardSeriesQueryLoaded
  } = useQuery({
    ...getCardSeriesQueryOptions(authTokens.access),
    enabled: !!card.id,
    select: (result) => {
      const cardSeriesMap: Record<number, CardSeries> = {};
      result.map((_) => (
        cardSeriesMap[_.id] = { ..._ }
      ));
      return cardSeriesMap;
    }
  });

  useEffect(() => {
    if (card.id && cachedCardSeriesData) {
      setCardSeries({ ...cachedCardSeriesData });
  
      setSeriesPickerData(
        Object.values(cachedCardSeriesData!).map((_) => (
          { label: _.name, value: _.id }
        ))
      );
  
      if (card && cardsFromSeries.length === 0) {
        if (card!.card_series) {
          fetchCardsFromSeries(card!.card_series);
        }
      }
    }
  }, [card.id, cachedCardSeriesData]);

  const {
    data: cachedTagsData,
    isLoading: isTagsQueryLoading,
    isFetched: isTagsQueryLoaded
  } = useQuery({
    ...getTagsQueryOptions(authTokens.access),
    enabled: !!card.id,
    select: (result) => {
      const tagsMap: Record<number, Tag> = {};
      result.map((_) => (
        tagsMap[_.id] = { ..._ }
      ));
      return tagsMap;
    }
  });

  useEffect(() => {
    if (card.id && cachedTagsData) {
      setTags({ ...cachedTagsData });
  
      setTagPickerData(
        Object.values(cachedTagsData!).map((_) => (
          { label: _.name, value: _.name }
        ))
      );
  
      if (card.id && Object.entries(cachedTagsData!).length > 0) {
        const tagsIds = card.tags!.map((_) => (
          cachedTagsData![_ as number].id
        ));
        const tagsNames = Object.values(cachedTagsData!)
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
    }
  }, [card.id, cachedTagsData]);

  const {
    data: cachedCardPartials,
    refetch: refetchCardPartials,
    isLoading: isCardPartialsQueryLoading,
    isFetched: isCardPartialsQueryLoaded
  } = useQuery({
    ...getCardPartialsForCardQueryOptions(authTokens.access, card.id!),
    enabled: !!card.id
  });

  useEffect(() => {
    if (cachedCardPartials && cachedCardPartials.length > 0) {
      setCardPartials([...cachedCardPartials!]);
    }
  }, [cachedCardPartials]);

  const createNewCardSeriesMutation = useMutation({
    mutationFn: (
      { accessToken, seriesName }:
      { accessToken: string; seriesName: string; }
    ) => (
      createNewCardSeries(accessToken, seriesName)
    )
  });

  const createNewTagMutation = useMutation({
    mutationFn: (
      { accessToken, tagName }:
      { accessToken: string; tagName: string; }
    ) => (
      createNewTag(accessToken, tagName)
    )
  });

  async function handleSeriesPickerChange(value: number | string) {
    if (typeof value === 'number') {
      setCard({
        ...card,
        card_series: value
      });
  
      fetchCardsFromSeries(value);
    } else if (typeof value === 'string') {
      createNewCardSeriesMutation.mutate({
        accessToken: authTokens.access,
        seriesName: value
      }, {
        onSuccess(responseData: CardSeries) {
          const cardSeriesMap = { ...cardSeries };
          cardSeriesMap[responseData.id] = { ...responseData };
          setCardSeries(cardSeriesMap);
          setSeriesPickerData(
            seriesPickerData.concat([{
              label: value,
              value: responseData.id
            }])
          );
          setCard({
            ...card,
            n_in_series: 1,
            card_series: responseData.id
          });
          setCardsFromSeries([card]);
        }
      });
    }
  }

  function handleClearSeries() {
    setCard({
      ...card,
      card_series: null
    });
    setCardsFromSeries([]);
  }

  const fetchCardsFromSeries = async (seriesId: number) => {
    setIsCardsFromSeriesLoading(true);

    try {
      const response = await api.get(
        `api/cards/cards/get_cards_from_series/?series=${seriesId}`,
        {
          headers: {
            Authorization: `JWT ${authTokens.access}`
          },
          withCredentials: true
        }
      );
      if (!response.data.find((_) => _.id === card.id)) {
        const newCardsFromSeries = response.data.concat([card]).sort(
          (a: Card, b: Card) => a.n_in_series - b.n_in_series
        ).map((_: Card, i: number) => (
          {
            ..._,
            n_in_series: i + 1
          }
        ));
        setCardsFromSeries(newCardsFromSeries);
      } else {
        setCardsFromSeries(response.data);
      }
    } catch (error: any) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      setIsCardsFromSeriesLoading(false);
    }
  };

  function handleCreateTag(item: ItemDataType) {
    createNewTagMutation.mutate({
      accessToken: authTokens.access,
      tagName: item.label as string
    }, {
      onSuccess(responseData: Tag) {
        setCard({
          ...card,
          tags: [...(card.tags ? card.tags : []), responseData.id],
          tagsNames: [
            ...(card.tagsNames ? card.tagsNames : []),
            responseData.name
          ]
        });
        const tagsMap: Record<number, Tag> = {};
        Object.values(tags).map((__) => (
          tagsMap[__.id] = { ...__ }
        ));
        tagsMap[responseData.id] = { ...responseData };
        setTags(tagsMap);
      }
    });
  }

  function handleRemoveTag(value: string) {
    const tagId = Object.values(tags).find((_) => _.name === value)?.id;
    setCard({
      ...card,
      tags: [...card.tags!.filter((_) => _ !== tagId)],
      tagsNames: [...card.tagsNames!.filter((_) => _ !== value)]
    });
  }

  async function handlePickTags(value: Array<string>) {
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

  function addPartial(index: number, type: string) {
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
    setCardPartials(cardPartials.map((_) => (
      { ..._ }
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
    } catch (error: any) {
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
        } catch (error: any) {
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
            {
              ..._,
              position: i + 1
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
        } catch (error: any) {
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
            {
              ..._,
              position: i + 1
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
          partialsToDeleteIds.forEach(async (_) => {
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
        } catch (error: any) {
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
    const partialId = cardPartials[activePartial!].id;
    setActivePartial(null);
    setCardPartials(cardPartials.filter((_, i) => i !== activePartial));
    setPartialsToDeleteIds([...partialsToDeleteIds, partialId]);
  }

  return (
    <>
      {(
        isCardQueryLoading
        || isCardSeriesQueryLoading
        || isTagsQueryLoading
      ) && <p>Loading...</p>}
      {(
        !card.tagsNames
      ) && <p className="h-[100px] bg-blue">{`${card.tagsNames}`}</p>}
      {(
        isCardQueryLoaded
        && isCardSeriesQueryLoaded
        && isTagsQueryLoaded
        && card.tagsNames
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
                creatable
                locale={{ createOption: 'New series: {0}' }}
                data={seriesPickerData}
                style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
                value={cardSeries[card.card_series]?.id}
                onChange={handleSeriesPickerChange}
                onCreate={handleSeriesPickerChange}
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
              creatable
              locale={{ createOption: 'New tag: {0}' }}
              data={tagPickerData}
              style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
              value={card.tagsNames}
              onCreate={(value, item, event) => handleCreateTag(item)}
              onSelect={handlePickTags}
              onTagRemove={handleRemoveTag}
            />
          </div>
          
          <div>
            {isCardPartialsQueryLoading && <p>Loading...</p>}
            {isCardPartialsQueryLoaded && (
              <div className="flex flex-col border-t-2 border-black">
                {cardPartials!.map((_, partialIndex) => (
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
                      <li
                        className="flex items-center w-[36px] h-[36px] mr-2
                          bg-white kn-base-btn"
                        onClick={() => addPartial(partialIndex, 'vim')}
                      >
                        <span className="font-semibold leading-[0.1]">vi</span>
                      </li>
                    </ul>
                    {activePartial === partialIndex
                      && _.content[0].type !== 'vim'
                      && (
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
                      )
                    }
                    {activePartial === partialIndex
                      && _.content[0].type === 'vim'
                      && (
                        <PartialEditorWithVim
                          content={_.content}
                          isPrompt={_.is_prompt}
                          promptInitialContent={_.prompt_initial_content}
                          isActivePartial={true}
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
                      )
                    }
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
                      onClick={() => addPartial(cardPartials!.length, 'text')}
                    >
                      <IoText />
                    </li>
                    <li
                      className="mr-2 bg-white kn-base-btn"
                      onClick={() => addPartial(cardPartials!.length, 'code')}
                    >
                      <FaCode />
                    </li>
                    <li
                      className="flex items-center w-[36px] h-[36px]
                        bg-white kn-base-btn"
                      onClick={() => addPartial(cardPartials!.length, 'vim')}
                    >
                      <span className="font-semibold leading-[0.1]">vi</span>
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