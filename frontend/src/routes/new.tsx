import { useState, useEffect, createRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Input,
  InputGroup,
  TagPicker,
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import useAuth from '../context/AuthProvider';
import {
  getCardSeriesQueryOptions,
  getTagsQueryOptions,
  createNewCard,
  createNewTag,
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

export default function New() {
  const { authTokens } = useAuth();

  const [card, setCard] = useState<Partial<Card>>({});
  const [selectedCardSeries, setSelectedCardSeries]
    = useState<CardSeries | null>(null);
  const [cardPartials, setCardPartials]
    = useState<Array<Record<string, unknown>>>([]);
  
  const [tagPickerData, setTagPickerData] = useState<Array<{
    label: string;
    value: string;
  }>>([]);
  const [isCardSaving, setIsCardSaving] = useState(false);
  const [activePartial, setActivePartial] = useState(null);
  const tagsRef = createRef<any>();

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

  useEffect(() => {
    setTagPickerData(
      cachedTagsData!.map((_) => ({ label: _.name, value: _.name }))
    );
  }, [cachedTagsData]);

  const createNewCardMutation = useMutation({
    mutationFn: (
      { accessToken, cardData }:
      { accessToken: string; cardData: Partial<Card>; }
    ) => (
      createNewCard(accessToken, cardData)
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

  const createNewCardPartialMutation = useMutation({
    mutationFn: (
      { accessToken, cardPartialData }:
      { accessToken: string; cardPartialData: Partial<CardPartial>; }
    ) => (
      createNewCardPartial(accessToken, cardPartialData)
    )
  });

  function handleCreateTag(newTag: { value: string; label: string; }) {
    createNewTagMutation.mutate({
      accessToken: authTokens.access,
      tagName: newTag.label
    }, {
      onSuccess() {
        refetchTags();
      }
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
    tagsRef.current?.target
      .children[0].children[0].children[0]
      .value.split(',')
      .forEach((_: string) => {
        if (!cardToSave.tags) {
          cardToSave.tags = [];
        }

        const tagId = cachedTagsData!.find((__) => _ === __.name)?.id;
        if (tagId) {
          cardToSave.tags.push(tagId);
        }
      });

    setIsCardSaving(true);

    createNewCardMutation.mutate({
      accessToken: authTokens.access,
      cardData: cardToSave
    }, {
      onSuccess(responseData: Card) {
        setCard(responseData);

        if (cardPartials.length === 0) {
          setIsCardSaving(false);
          setCard({});
        }
      }
    });
  }

  useEffect(() => {
    if (card.id) {
      // save partials
      cardPartials.forEach(async (_, i) => {
        createNewCardPartialMutation.mutate({
          accessToken: authTokens.access,
          cardPartialData: {
            ..._,
            card: card.id,
            position: i + 1
          }
        }, {
          onSuccess() {
            if (i === cardPartials.length - 1) {
              setIsCardSaving(false);
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
      ) && <p>Loading...</p>}
      {(
        !isTagsQueryLoading
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
              onCreate={(selectedTags, newTag) => handleCreateTag(newTag)}
              ref={tagsRef}
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