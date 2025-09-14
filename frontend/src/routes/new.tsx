import { useState, useEffect, createRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Input,
  InputGroup,
  InputPicker,
  TagPicker,
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import useAuth from '../context/AuthProvider';
import {
  createNewCard,
  createNewCardSeries,
  createNewTag,
  createNewCardPartial
} from '../query-client';
import api from '../api';
import {
  Card,
  CardSeries,
  Tag,
  CardPartial
} from '../models';
import PartialEditor from '../components/partial-editor/PartialEditor';
import PartialEditorWithVim
  from '../components/partial-editor/PartialEditorWithVim';

export default function New() {
  const { authTokens } = useAuth();

  const [card, setCard] = useState<Partial<Card>>({});
  const [cardSeries, setCardSeries] = useState<Array<CardSeries>>([]);
  const [tags, setTags] = useState<Array<Tag>>([]);
  const [cardPartials, setCardPartials]
    = useState<Array<Record<string, unknown>>>([]);
  
  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);
  
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);

  const [activePartial, setActivePartial] = useState(null);

  const seriesRef = createRef<any>();
  const tagsRef = createRef<any>();

  const createNewCardMutation = useMutation({
    mutationFn: (
      { accessToken, cardData }:
      { accessToken: string; cardData: Partial<Card>; }
    ) => (
      createNewCard(accessToken, cardData)
    )
  });

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

  const createNewCardPartialMutation = useMutation({
    mutationFn: (
      { accessToken, cardPartialData }:
      { accessToken: string; cardPartialData: Partial<CardPartial>; }
    ) => (
      createNewCardPartial(accessToken, cardPartialData)
    )
  });
  
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

  function handleSeriesPickerCreate(seriesName: string) {
    createNewCardSeriesMutation.mutate({
      accessToken: authTokens.access,
      seriesName
    }, {
      onSuccess(responseData: CardSeries) {
        setCard({
          ...card,
          n_in_series: 1,
          card_series: responseData.id
        });
      }
    });
  }

  function handleCreateTag(newTag: { value: string; label: string; }) {
    createNewTagMutation.mutate({
      accessToken: authTokens.access,
      tagName: newTag.label
    }, {
      onSuccess(responseData: Tag) {
        setTags([
          ...tags,
          { ...responseData }
        ]);
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
    const seriesId = Object.values(cardSeries).find(
      (_) => seriesRef.current?.target.textContent === _.name
    )?.id;
    if (seriesId) {
      cardToSave.card_series = seriesId;
    }
    tagsRef.current?.target
      .children[0].children[0].children[0]
      .value.split(',')
      .forEach((_: string) => {
        if (!cardToSave.tags) {
          cardToSave.tags = [];
        }

        const tagId = tags.find((__) => _ === __.name)?.id;
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
                style={{
                  width: 'calc(100% - 20px)',
                  margin: '4px 10px 10px 10px'
                }}
                onCreate={handleSeriesPickerCreate}
                ref={seriesRef}
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