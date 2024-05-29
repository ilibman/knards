import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';
import api from '../api';
import { getNewScore } from '../utils';
import RevisePartialEditor
  from '../components/partial-editor/RevisePartialEditor';
import PartialEditorWithVim
  from '../components/partial-editor/PartialEditorWithVim';
import './revise.scss';

export default function Revise() {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cardset, setCardset] = useState(() => (
    localStorage.getItem('cardset')
      ? JSON.parse(localStorage.getItem('cardset'))
      : null
  ));
  const [revisedCardIndex, setRevisedCardIndex] = useState(0);
  const [activePartial, setActivePartial] = useState([null, null]);
  const [cardPartials, setCardPartials] = useState({});
  const [reviseCardPartials, setReviseCardPartials] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isFirstCardPartialsLoading, setIsFirstCardPartialsLoading] = useState(true);
  const [isRestCardPartialsLoading, setIsRestCardPartialsLoading] = useState(false);

  const [isRevising, setIsRevising] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [arePartialsHidden, setArePartialsHidden] = useState(false);

  useEffect(() => {
    if (cardset.filter((_) => !_.revised).length === 0) {
      navigate('/list');
    }

    setIsLoading(false);

    const fetchFirstCardPartials = async () => {
      try {
        const response = await api.get(
          `api/cards/card-partials/?card=${cardset[revisedCardIndex].id}`,
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        setCardPartials({
          [revisedCardIndex]: [...response.data],
        });
        setReviseCardPartials({
          [revisedCardIndex]: [...response.data.map((_) => (
            {
              ..._,
              content: _.is_prompt
                ? _.prompt_initial_content
                : _.content.map((__) => (
                  {
                    ...__,
                    children: __.children.map((___) => {
                      if (___.insetQuestion) {
                        return {
                          ...___,
                          text: ''
                        };
                      } else {
                        return {
                          ...___
                        };
                      }
                    })
                  }
                ))
            }
          ))]
        });
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsRevising(true);
        setIsFirstCardPartialsLoading(false);
        setIsRestCardPartialsLoading(true);
      }
    };

    fetchFirstCardPartials();
  }, [cardset]);

  useEffect(() => {
    const fetchRestCardPartials = async () => {
      cardset.slice(1).forEach(async (_, i) => {
        try {
          const response = await api.get(
            `api/cards/card-partials/?card=${_.id}`,
            {
              headers: {
                Authorization: `JWT ${authTokens.access}`
              },
              withCredentials: true
            }
          );
          setCardPartials((prevState) => {
            return {
              ...prevState,
              [i + 1]: [...response.data]
            }
          });
          setReviseCardPartials((prevState) => {
            return {
              ...prevState,
              [i + 1]: [...response.data.map((_) => (
                {
                  ..._,
                  content: _.is_prompt
                    ? _.prompt_initial_content
                    : _.content.map((__) => (
                      {
                        ...__,
                        children: __.children.map((___) => {
                          if (___.insetQuestion) {
                            return {
                              ...___,
                              text: ''
                            };
                          } else {
                            return {
                              ...___
                            };
                          }
                        })
                      }
                    ))
                }
              ))]
            }
          });
        } catch (error) {
          if (!error.response) {
            console.error(error.message);
          }
        } finally {
          setIsRestCardPartialsLoading(false);
        }
      });
    };

    fetchRestCardPartials();
  }, [isRestCardPartialsLoading]);

  function handleCheckAnswers() {
    setIsRevising(false);
    setIsEvaluating(true);
  }

  function handleEvaluationClick(newScore) {
    const newCardset = cardset.map((_, i) => {
      if (i === revisedCardIndex) {
        return {
          ..._,
          score: newScore,
          revised: true
        }
      } else {
        return {
          ..._
        }
      }
    });

    setCardset(newCardset);
    localStorage.setItem('cardset', JSON.stringify(newCardset));

    if (newCardset.filter((_) => !_.revised).length > 0) {
      setRevisedCardIndex((prevState) => prevState + 1);
      setIsRevising(true);
      setIsEvaluating(false);
      setArePartialsHidden(true);
      setTimeout(() => {
        setArePartialsHidden(false);
      });
    } else {
      navigate('/list');
    }
  }

  return (
    <>
      {isLoading && <p>Loading...</p>}
      {!isLoading && (
        <div className="p-3 flex border-b-2 revision">
          <div className="w-1/2 metadata-container">
            {cardset[revisedCardIndex].title && (
              <p className="text-white text-lg font-base font-semibold">
                Title: {cardset[revisedCardIndex].title}
              </p>
            )}
            {cardset[revisedCardIndex].series_id && (
              <p className="text-white text-lg font-base font-semibold">
                Series: {cardset[revisedCardIndex].series_id}
              </p>
            )}
            {cardset[revisedCardIndex].tags && (
              <p className="text-white text-lg font-base font-semibold">
                Tags: {cardset[revisedCardIndex].tags.join(',')}
              </p>
            )}
            {cardset[revisedCardIndex].created_at && (
              <p className="text-white text-lg font-base font-semibold">
                Created: {new Date(
                  cardset[revisedCardIndex].created_at
                ).toLocaleString(
                  'en-UK',
                  { day: 'numeric', month: 'numeric', year: 'numeric' }
                )}
              </p>
            )}
            {cardset[revisedCardIndex].owner && (
              <p className="text-white text-lg font-base font-semibold">
                Created by: {cardset[revisedCardIndex].owner}
              </p>
            )}
          </div>
          <div className="z-[100] fixed bottom-0 left-0
            grid grid-cols-2 gap-2 justify-items-stretch w-full p-2
            bg-brown border-t-2
            buttons-container min-[1440px]:relative
            min-[1440px]:grid-cols-1 min-[1440px]:justify-items-end
            min-[1440px]:gap-0
            min-[1440px]:w-1/2 min-[1440px]:p-0
            min-[1440px]:border-0">
            {isRevising && (
              <div
                className="col-span-2 max-h-[48px]
                  text-white text-lg font-base font-semibold bg-green
                  kn-base-btn min-[1440px]:w-[180px] min-[1440px]:mb-2.5"
                onClick={handleCheckAnswers}
              >
                Check answers
              </div>
            )}
            {isEvaluating && (
              <>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px] min-[1440px]:mb-2.5"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[revisedCardIndex].score).upScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I knew this very well (score +{
                      getNewScore(cardset[revisedCardIndex].score).upScore
                        - cardset[revisedCardIndex].score
                    } ({getNewScore(cardset[revisedCardIndex].score).upScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    +{getNewScore(cardset[revisedCardIndex].score).upScore
                      - cardset[revisedCardIndex].score}
                    &nbsp;({getNewScore(cardset[revisedCardIndex].score).upScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px] min-[1440px]:mb-2.5"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[revisedCardIndex].score).downScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I've made some minor mistakes (score {
                      getNewScore(cardset[revisedCardIndex].score).downScore
                        - cardset[revisedCardIndex].score
                    } ({getNewScore(cardset[revisedCardIndex].score).downScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[revisedCardIndex].score).downScore
                      - cardset[revisedCardIndex].score}
                    &nbsp;({getNewScore(cardset[revisedCardIndex].score).downScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px] min-[1440px]:mb-2.5"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[revisedCardIndex].score).downToOneThirdScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I've made some major mistakes (score {
                      getNewScore(cardset[revisedCardIndex].score).downToOneThirdScore
                        - cardset[revisedCardIndex].score
                    } ({getNewScore(cardset[revisedCardIndex].score).downToOneThirdScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[revisedCardIndex].score).downToOneThirdScore
                      - cardset[revisedCardIndex].score}
                    &nbsp;({getNewScore(cardset[revisedCardIndex].score).downToOneThirdScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px]"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[revisedCardIndex].score).downToZeroScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I don't know this at all (score {
                      getNewScore(cardset[revisedCardIndex].score).downToZeroScore
                        - cardset[revisedCardIndex].score
                    } ({getNewScore(cardset[revisedCardIndex].score).downToZeroScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[revisedCardIndex].score).downToZeroScore
                      - cardset[revisedCardIndex].score}
                    &nbsp;({getNewScore(cardset[revisedCardIndex].score).downToZeroScore})
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {(isFirstCardPartialsLoading || arePartialsHidden) && <p>Loading...</p>}
      {(!isFirstCardPartialsLoading && !arePartialsHidden) && (
        <div className="flex flex-col w-full pb-[122px] p-3">
          {reviseCardPartials[revisedCardIndex].map((_, i) => (
            <div className="flex flex-col mb-3 min-[1440px]:flex-row" key={i}>
              <div
                className={`${isEvaluating && (
                  cardPartials[revisedCardIndex][i].content.some(
                    (_) => _.children.some((__) => __.insetQuestion)
                  ) || cardPartials[revisedCardIndex][i].is_prompt
                )
                  ? 'mr-3 w-full min-[1440px]:w-1/2'
                  : 'w-full'}`}
              >
                {_.content[0].type !== 'vim' && (
                  <RevisePartialEditor
                    content={_.content}
                    isActivePartial={
                      i === activePartial[0] && activePartial[1] === 0
                    }
                    onPartialFocus={() => setActivePartial([i, 0])}
                  />
                )}
                {_.content[0].type === 'vim' && (
                  <PartialEditorWithVim
                    content={_.content}
                    isActivePartial={
                      i === activePartial[0] && activePartial[1] === 0
                    }
                    isRevising={true}
                    onPartialFocus={() => setActivePartial([i, 0])}
                  />
                )}
              </div>
              {isEvaluating && (
                cardPartials[revisedCardIndex][i].content.some(
                  (_) => _.children.some((__) => __.insetQuestion)
                ) || cardPartials[revisedCardIndex][i].is_prompt
              ) && (
                <div className="w-full mt-3 min-[1440px]:w-1/2 min-[1440px]:mt-0">
                  <RevisePartialEditor
                    content={cardPartials[revisedCardIndex][i].content}
                    isActivePartial={i === activePartial[0] && activePartial[1] === 1}
                    readOnly={true}
                    onPartialFocus={() => setActivePartial([i, 1])}
                  ></RevisePartialEditor>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}