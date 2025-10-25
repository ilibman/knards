import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import { RxCross2 } from 'react-icons/rx';

import useAuth from '../context/AuthProvider';
import {
  queryClient,
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  createNewCard,
  createNewCardPartial
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
import DialogEditSeries from '../components/dialogs/DialogEditSeries';
import DialogEditTags from '../components/dialogs/DialogEditTags';

export default function New() {
  const { authTokens } = useAuth();

  const [card, setCard] = useState<Partial<Card>>({});
  const [selectedCardSeries, setSelectedCardSeries]
    = useState<CardSeries | null>(null);
  const [cardPartials, setCardPartials]
    = useState<Array<Record<string, unknown>>>([]);
  const [selectedTags, setSelectedTags]
    = useState<Array<Tag>>([]);
  const [activePartial, setActivePartial] = useState(null);

  const {
    data: cachedCardSeriesData,
    isLoading: isCardSeriesQueryLoading,
    refetch: refetchCardSeries
  } = useQuery({
    ...getCardSeriesQueryOptions(authTokens.access)
  });

  const {
    data: cachedTagsData,
    isLoading: isTagsQueryLoading,
    isFetched: isTagsQueryLoaded,
    refetch: refetchTags
  } = useQuery({
    ...getTagsQueryOptions(authTokens.access)
  });

  const {
    mutate: createNewCardMutation,
    isPending: isCardSaving
  } = useMutation({
    mutationFn: (
      { accessToken, cardData }:
      { accessToken: string; cardData: Partial<Card>; }
    ) => (
      createNewCard(accessToken, cardData)
    )
  });

  const {
    mutate: createNewCardPartialMutation,
    isPending: isCardPartialSaving
  } = useMutation({
    mutationFn: (
      { accessToken, cardPartialData }:
      { accessToken: string; cardPartialData: Partial<CardPartial>; }
    ) => (
      createNewCardPartial(accessToken, cardPartialData)
    )
  });

  function addPartial(index: number, type: string) {
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
    setCardPartials(cardPartials.map((_) => (
      { ..._ }
    )));
  }

  async function saveCard() {
    const cardToSave = { ...card };
    if (selectedCardSeries) {
      cardToSave.card_series = selectedCardSeries.id;
    }
    selectedTags.map((_) => _.id)
      .forEach((tagId: number) => {
        if (!cardToSave.tags) {
          cardToSave.tags = [];
        }

        cardToSave.tags.push(tagId);
      });

    createNewCardMutation({
      accessToken: authTokens.access,
      cardData: cardToSave
    }, {
      onSuccess: async (responseData: Card) => {
        setCard(responseData);

        if (cardPartials.length === 0) {
          await queryClient.invalidateQueries({
            queryKey: ['cards']
          });
          await queryClient.invalidateQueries({
            queryKey: ['card_partials']
          });
          setCard({});
        }
      }
    });
  }

  useEffect(() => {
    if (card.id) {
      // save partials
      cardPartials.forEach(async (_, i) => {
        createNewCardPartialMutation({
          accessToken: authTokens.access,
          cardPartialData: {
            ..._,
            card: card.id,
            position: i + 1
          }
        }, {
          onSuccess: async () => {
            if (i === cardPartials.length - 1) {
              await queryClient.invalidateQueries({
                queryKey: ['cards']
              });
              await queryClient.invalidateQueries({
                queryKey: ['card_partials']
              });
              setCard({});
              setCardPartials([]);
            }
          }
        });
      });
    }
  }, [card.id]);

  function handlePartialContentChange(value: string, partialIndex: number) {
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

  function handlePartialIsPromptChange(value: string, partialIndex: number) {
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

  function handlePromptInitialContentChange(
    value: string,
    partialIndex: number
  ) {
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

  function renderReadOnlyPartial(content: Array<{
    children: Array<Record<string, unknown>>
  }>) {
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
        isTagsQueryLoading
      ) && <p className="mt-2 ml-8 text-white text-lg">Loading...</p>}
      {(isCardSaving || isCardPartialSaving)
        && <p className="mt-2 ml-8 text-white text-lg">Saving...</p>}
      {(
        !isTagsQueryLoading
      ) && (
        <>
          <div
            className="mt-2"
            onClick={() => setActivePartial(null)}
          >
            <label
              className="mx-3 text-white font-base font-semibold text-lg"
            >Title:</label>
            <div
              className="relative w-[calc(100% - 1.25rem)] h-[44px] mx-2.5"
            >
              <input
                className="w-full h-full pl-3 text-white text-lg bg-brown-light
                  kn-base-input"
                spellCheck={false}
                value={card.title ?? ''} 
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => (
                  setCard({
                    ...card,
                    title: event.target.value
                  })
                )}
              />
              {card.title && <div
                className="absolute top-0 right-0
                  flex justify-center items-center h-[44px] w-[40px] mr-0.5
                  kn-picker-clear-btn"
                onClick={() => setCard({ ...card, title: '' })}
              >
                <RxCross2 className="stroke-black stroke-[1.5]" />
              </div>}
            </div>
          </div>
          <div className="relative mt-2">
            <DialogEditSeries
              onlySelect={false}
              selectedSeries={selectedCardSeries}
              cardSeries={cachedCardSeriesData ?? []}
              disabled={isCardSeriesQueryLoading}
              placeForReorderBtn={false}
              onSave={(cardSeries: CardSeries) => {
                setSelectedCardSeries(cardSeries);
                refetchCardSeries();
              }}
              onClearSeries={() => setSelectedCardSeries(null)}
            />
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
                        (value: string) => handlePartialContentChange(
                          value,
                          partialIndex
                        )
                      }
                      onIsPromptChange={(value: string) =>
                        handlePartialIsPromptChange(
                          value,
                          partialIndex
                        )
                      }
                      onPromptInitialContentChange={(value: string) =>
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
                        (value: string) => handlePartialContentChange(
                          value,
                          partialIndex
                        )
                      }
                      onIsPromptChange={(value: string) =>
                        handlePartialIsPromptChange(
                          value,
                          partialIndex
                        )
                      }
                      onPromptInitialContentChange={(value: string) =>
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
                    className="p-4 flex flex-wrap bg-brown-light shadow-md
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
                  className="mr-2 bg-white kn-base-btn"
                  onClick={() => addPartial(cardPartials.length, 'code')}
                >
                  <FaCode />
                </li>
                <li
                  className="flex items-center w-[36px] h-[36px]
                    bg-white kn-base-btn"
                  onClick={() => addPartial(cardPartials.length, 'vim')}
                >
                  <span className="font-semibold leading-[0.1]">vi</span>
                </li>
              </ul>
              <div
                className="mb-2.5 ml-2.5 h-[72px]
                  bg-green kn-base-btn"
                onClick={() => saveCard()}
              >
                <FaCheck className="fill-white" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}