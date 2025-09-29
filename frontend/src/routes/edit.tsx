import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  InputGroup
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';

import useAuth from '../context/AuthProvider';
import api from '../api';
import {
  queryClient,
  getCardQueryOptions,
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  getCardPartialsForCardQueryOptions,
  updateCard,
  reorderCardsInSeries,
  createNewCardPartial,
  updateCardPartial,
  deleteCardPartial
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
import DialogEditSeries from '../components/dialogs/DialogEditSeries';
import DialogEditTags from '../components/dialogs/DialogEditTags';

export default function Edit() {
  const { authTokens } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [card, setCard] = useState<Card | null>(null);
  const [cardPartials, setCardPartials]
    = useState<Array<CardPartial>>([]);
  const [selectedCardSeries, setSelectedCardSeries]
    = useState<CardSeries | null>(null);
  const [cardsFromSeries, setCardsFromSeries] = useState<Array<Card>>([]);
  const [selectedTags, setSelectedTags]
    = useState<Array<Tag>>([]);

  const [activePartial, setActivePartial] = useState<number | null>(null);
  const [partialsToDeleteIds, setPartialsToDeleteIds]
    = useState<Array<number>>([]);

  const [initialTagsFromCardProcessed, setInitialTagsFromCardProcessed]
    = useState<boolean>(false);
  const [isCardInSeriesOrderChanged, setIsCardInSeriesOrderChanged]
    = useState(false);

  const [isCardsFromSeriesLoading, setIsCardsFromSeriesLoading]
    = useState(true);

  const {
    data: cachedCardData,
    isLoading: isCardQueryLoading,
    isFetched: isCardQueryLoaded
  } = useQuery({
    ...getCardQueryOptions(authTokens.access, +id!),
    enabled: !!id
  });

  const {
    data: cachedCardSeriesData,
    refetch: refetchCardSeries,
    isLoading: isCardSeriesQueryLoading
  } = useQuery({
    ...getCardSeriesQueryOptions(authTokens.access)
  });

  const {
    data: cachedTagsData,
    refetch: refetchTags,
    isLoading: isTagsQueryLoading,
    isFetched: isTagsQueryLoaded
  } = useQuery({
    ...getTagsQueryOptions(authTokens.access)
  });

  const {
    data: cachedCardPartials,
    isLoading: isCardPartialsQueryLoading,
    isFetched: isCardPartialsQueryLoaded
  } = useQuery({
    ...getCardPartialsForCardQueryOptions(authTokens.access, +id!),
    enabled: !!id
  });

  const {
    mutate: updateCardMutation,
    isPending: isCardSaving,
    isSuccess: isCardSaved
  } = useMutation({
    mutationFn: (
      { accessToken, cardId, cardData }:
      { accessToken: string; cardId: number; cardData: Partial<Card>; }
    ) => (
      updateCard(accessToken, cardId, cardData)
    )
  });

  const { mutate: reorderCardsInSeriesMutation } = useMutation({
    mutationFn: (
      { accessToken, cardsFromSeries }:
      { accessToken: string; cardsFromSeries: Array<Card>; }
    ) => (
      reorderCardsInSeries(accessToken, cardsFromSeries)
    )
  });

  const { mutate: createNewCardPartialMutation } = useMutation({
    mutationFn: (
      { accessToken, cardPartialData }:
      { accessToken: string; cardPartialData: Partial<CardPartial>; }
    ) => (
      createNewCardPartial(accessToken, cardPartialData)
    )
  });

  const { mutate: updateCardPartialMutation } = useMutation({
    mutationFn: (
      { accessToken, cardPartialId, cardPartialData }:
      {
        accessToken: string;
        cardPartialId: number;
        cardPartialData: Partial<CardPartial>;
      }
    ) => (
      updateCardPartial(accessToken, cardPartialId, cardPartialData)
    )
  });

  const { mutate: deleteCardPartialMutation } = useMutation({
    mutationFn: (
      { accessToken, cardPartialId }:
      { accessToken: string; cardPartialId: number; }
    ) => (
      deleteCardPartial(accessToken, cardPartialId)
    )
  });

  useEffect(() => {
    if (cachedCardData?.id) {
      setCard({ ...cachedCardData });
    }
  }, [cachedCardData]);

  useEffect(() => {
    if (cachedCardSeriesData) {
      const cardSeriesMap: Record<number, CardSeries> = {};
      cachedCardSeriesData.map((_) => (
        cardSeriesMap[_.id] = { ..._ }
      ));

      if (card?.id) {
        // set selectedCardSeries BUT ONLY ONCE (otherwise inf loop)
        if (card.card_series && (
          !selectedCardSeries || selectedCardSeries.id !== card.card_series
        )) {
          setSelectedCardSeries(cardSeriesMap[card.card_series]);
        }

        // this is needed for reorder cards in series func
        if (cardsFromSeries.length === 0) {
          if (card.card_series) {
            fetchCardsFromSeries(card.card_series);
          }
        }
      }
    }
  }, [card, cachedCardSeriesData]);

  useEffect(() => {
    // initial selected tags = tags saved on a card
    // we need to assign this once at component init
    if (card?.id
      && card?.tags
      && cachedTagsData
      && !initialTagsFromCardProcessed) {
      setSelectedTags([
        ...cachedTagsData.filter((_) => card.tags.includes(_.id))
      ]);
      setInitialTagsFromCardProcessed(true);
    }
  }, [card, cachedTagsData]);

  useEffect(() => {
    if (cachedCardPartials && cachedCardPartials.length > 0) {
      setCardPartials([...cachedCardPartials!]);
    }
  }, [cachedCardPartials]);

  useEffect(() => {
    if (card?.id) {
      if (cachedCardData) {
        if (selectedCardSeries) {
          setCard({
            ...card!,
            card_series: selectedCardSeries.id
          });
      
          fetchCardsFromSeries(selectedCardSeries.id);
        } else {
          setCard({
            ...card!,
            card_series: null
          });
    
          setCardsFromSeries([]);
        }
      }
    }
  }, [selectedCardSeries]);

  const fetchCardsFromSeries = async (seriesId: number) => {
    setIsCardsFromSeriesLoading(true);

    try {
      const response = await api.get<Array<Card>>(
        `api/cards/cards/get_cards_from_series/?series=${seriesId}`,
        {
          headers: {
            Authorization: `JWT ${authTokens.access}`
          },
          withCredentials: true
        }
      );
      if (!response.data.find((_) => _.id === card!.id)) {
        const updatedCard = {
          ...card!,
          card_series: seriesId,
          n_in_series: response.data.length + 1
        }
        const newCardsFromSeries = response.data.concat([updatedCard]);
        setCardsFromSeries(newCardsFromSeries);
        setCard(updatedCard);
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

  useEffect(() => {
    if (card?.id && !selectedCardSeries) {
      setCard({
        ...card!,
        n_in_series: 1
      });
    }
  }, [cardsFromSeries]);

  useEffect(() => {
    if (card?.id) {
      if (selectedTags) {
        setCard({
          ...card!,
          tags: selectedTags.map((_) => _.id)
        });
      } else {
        setCard({
          ...card!,
          tags: []
        });
      }
    }
  }, [selectedTags]);

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
      card: card!.id
    });
    setCardPartials(cardPartials.map((_, i) => (
      {
        ..._,
        position: i + 1
      }
    )));
    setActivePartial(null);
  }

  async function saveChanges() {
    // save card metadata
    updateCardMutation({
      accessToken: authTokens.access,
      cardId: card!.id,
      cardData: card!
    }, {
      onSuccess: async () => {
        if (isCardInSeriesOrderChanged) {
          // save card order in series
          reorderCardsInSeriesMutation({
            accessToken: authTokens.access,
            cardsFromSeries
          });
        }

        if (cardPartials.length === 0) {
          // we are getting redirected to the list section
          // we're gonna need to refetch all cards
          // we don't have any partials -> no need to refetch that
          await queryClient.invalidateQueries({
            queryKey: ['cards']
          });
          navigate('/list');
        } else {
          // save partials
          cardPartials.forEach(async (_, i) => {
            if (!_.id) {
              createNewCardPartialMutation({
                accessToken: authTokens.access,
                cardPartialData: {
                  ..._,
                  position: i + 1
                }
              }, {
                onSuccess: async () => {
                  if (i === cardPartials.length - 1) {
                    // we are getting redirected to the list section
                    // we're gonna need to refetch all cards and partials
                    await queryClient.invalidateQueries({
                      queryKey: ['cards']
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ['card_partials']
                    });
                    navigate('/list');
                  }
                }
              });
            } else {
              updateCardPartialMutation({
                accessToken: authTokens.access,
                cardPartialId: _.id,
                cardPartialData: {
                  ..._,
                  position: i + 1
                }
              }, {
                onSuccess: async () => {
                  partialsToDeleteIds.forEach(async (_) => {
                    deleteCardPartialMutation({
                      accessToken: authTokens.access,
                      cardPartialId: _
                    });
                  });

                  if (i === cardPartials.length - 1) {
                    // we are getting redirected to the list section
                    // we're gonna need to refetch all cards and partials
                    await queryClient.invalidateQueries({
                      queryKey: ['cards']
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ['card_partials']
                    });
                    navigate('/list');
                  }
                }
              });
            }
          });
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
        || isTagsQueryLoading
      ) && <p className="mt-2 ml-8 text-white text-lg">Loading...</p>}
      {isCardSaving
        && <p className="mt-2 ml-8 text-white text-lg">Saving...</p>}
      {(
        isCardQueryLoaded
        && isTagsQueryLoaded
        && !isCardSaving
        && card
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
          <div className="relative mt-2">
            <DialogEditSeries
              onlySelect={false}
              selectedSeries={selectedCardSeries}
              cardSeries={cachedCardSeriesData ?? []}
              disabled={isCardSeriesQueryLoading}
              placeForReorderBtn={
                !!selectedCardSeries
                  && cardsFromSeries.length > 1
                  && !isCardsFromSeriesLoading
              }
              onSave={(cardSeries: CardSeries) => {
                setSelectedCardSeries(cardSeries);
                refetchCardSeries();
              }}
              onClearSeries={() => setSelectedCardSeries(null)}
            />
            {!isCardsFromSeriesLoading && <DialogReorderCardsInSeries
              series={selectedCardSeries!}
              cardsFromSeries={cardsFromSeries}
              onSave={(value) => {
                setCardsFromSeries(value);
                setIsCardInSeriesOrderChanged(true);
              }}
            >
            </DialogReorderCardsInSeries>}
          </div>
          <div className="my-2">
            <DialogEditTags
              onlySelect={true}
              selectedTags={selectedTags}
              tags={cachedTagsData!}
              disabled={isTagsQueryLoading}
              onCreateNewTag={(createdTag: Tag, selectedTags: Array<Tag>) => {
                setSelectedTags([
                  ...selectedTags,
                  createdTag
                ]);
                refetchTags();
              }}
              onSave={(tags: Array<Tag>) => setSelectedTags(tags)}
              onClearTags={() => setSelectedTags([])}
            />
          </div>
          
          <div>
            {isCardPartialsQueryLoading
              && <p className="mt-2 ml-8 text-white text-lg">Loading...</p>}
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