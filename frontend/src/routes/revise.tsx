import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';

import useAuth from '../context/AuthProvider';
import api from '../api';
import { getNewScore } from '../utils';
import {
  CardForRevision,
  CardPartial
} from '../models';
import RevisePartialEditor
  from '../components/partial-editor/RevisePartialEditor';
import PartialEditorWithVim
  from '../components/partial-editor/PartialEditorWithVim';
import './revise.scss';

export default function Revise() {
  const { authTokens } = useAuth();
  const navigate = useNavigate();

  const [cardset, setCardset] = useState<Array<CardForRevision>>(() => (
    localStorage.getItem('cardset')
      ? JSON.parse(localStorage.getItem('cardset'))
      : null
  ));
  const [activePartial, setActivePartial] = useState([null, null]);
  const [cardPartials, setCardPartials] = useState<Array<CardPartial>>([]);
  const [reviseCardPartials, setReviseCardPartials]
    = useState<Array<CardPartial>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCardSaving, setIsCardSaving] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [arePartialsHidden, setArePartialsHidden] = useState(false);

  async function fetchCardPartials(cardId: number) {
    setIsLoading(true);

    try {
      const response = await api.get(
        `api/cards/card-partials/?card=${cardId}`,
        {
          headers: {
            Authorization: `JWT ${authTokens.access}`
          },
          withCredentials: true
        }
      );
      setCardPartials([...response.data]);
      setReviseCardPartials([
        ...response.data.map((_) => (
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
        ))
      ]);
    } catch (error: any) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      setIsLoading(false);
      setIsRevising(true);
    }
  }

  useEffect(() => {
    if (cardset.length === 0) {
      navigate('/list');
    }

    fetchCardPartials(cardset[0].id);
  }, [cardset]);

  function handleCheckAnswers() {
    setIsRevising(false);
    setIsEvaluating(true);
  }

  async function handleEvaluationClick(newScore: number) {
    setIsCardSaving(true);
    setCardPartials([]);
    setReviseCardPartials([]);

    try {
      if (cardset[0].score_id) {
        await api.patch(
          `api/cards/card-scores/${cardset[0].score_id}/`,
          { score: newScore },
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
      } else {
        await api.post(
          'api/cards/card-scores/',
          {
            card: cardset[0].id,
            score: newScore
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
      }
    } catch (error: any) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      const newCardset = cardset.slice(1);
      setCardset(newCardset);
      localStorage.setItem('cardset', JSON.stringify(newCardset));

      setIsCardSaving(false);

      if (newCardset.length > 0) {
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
  }

  return (
    <>
      {isLoading && <p>Loading...</p>}
      {isCardSaving && <p>Saving...</p>}
      {!isLoading && !isCardSaving && (
        <div className="p-2.5 flex border-b-2 revision">
          <div className="w-1/2 metadata-container">
            {cardset[0].title && (
              <p className="text-white text-lg font-base font-semibold">
                Title: {cardset[0].title}
              </p>
            )}
            {cardset[0].series_name && (
              <p className="text-white text-lg font-base font-semibold">
                Series: {cardset[0].series_name} (
                  {cardset[0].n_in_series}/{cardset[0].total_cards_in_series}
                )
              </p>
            )}
            {cardset[0].tags_names && (
              <p className="text-white text-lg font-base font-semibold">
                Tags: {cardset[0].tags_names.join(', ')}
              </p>
            )}
            {cardset[0].created_at && (
              <p className="text-white text-lg font-base font-semibold">
                Created: {new Date(
                  cardset[0].created_at
                ).toLocaleString(
                  'en-UK',
                  { day: 'numeric', month: 'numeric', year: 'numeric' }
                )}
              </p>
            )}
            {cardset[0].owner_name && (
              <p className="text-white text-lg font-base font-semibold">
                Created by: {cardset[0].owner_name}
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
                    getNewScore(cardset[0].score).upScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I knew this very well (score +{
                      getNewScore(cardset[0].score).upScore
                        - cardset[0].score
                    } ({getNewScore(cardset[0].score).upScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    +{getNewScore(cardset[0].score).upScore
                      - cardset[0].score}
                    &nbsp;({getNewScore(cardset[0].score).upScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px] min-[1440px]:mb-2.5"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[0].score).downScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I've made some minor mistakes (score {
                      getNewScore(cardset[0].score).downScore
                        - cardset[0].score
                    } ({getNewScore(cardset[0].score).downScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[0].score).downScore
                      - cardset[0].score}
                    &nbsp;({getNewScore(cardset[0].score).downScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px] min-[1440px]:mb-2.5"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[0].score).downToOneThirdScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I've made some major mistakes (score {
                      getNewScore(cardset[0].score).downToOneThirdScore
                        - cardset[0].score
                    } ({getNewScore(cardset[0].score).downToOneThirdScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[0].score).downToOneThirdScore
                      - cardset[0].score}
                    &nbsp;({getNewScore(cardset[0].score).downToOneThirdScore})
                  </span>
                </div>
                <div
                  className="
                    text-black text-lg font-base font-semibold bg-yellow
                    kn-base-btn min-[1440px]:w-[450px]"
                  onClick={() => handleEvaluationClick(
                    getNewScore(cardset[0].score).downToZeroScore
                  )}
                >
                  <span className="hidden min-[1440px]:inline">
                    I don't know this at all (score {
                      getNewScore(cardset[0].score).downToZeroScore
                        - cardset[0].score
                    } ({getNewScore(cardset[0].score).downToZeroScore}))
                  </span>
                  <span className="min-[1440px]:hidden">
                    {getNewScore(cardset[0].score).downToZeroScore
                      - cardset[0].score}
                    &nbsp;({getNewScore(cardset[0].score).downToZeroScore})
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {(
        arePartialsHidden || !reviseCardPartials
      ) && <p>Something happening...</p>}
      {(
        !arePartialsHidden && reviseCardPartials
      ) && (
        <div className="flex flex-col w-full pb-[122px] p-2.5">
          {reviseCardPartials.map((_, i) => (
            <div className="flex flex-col mb-2.5 min-[1440px]:flex-row" key={i}>
              <div
                className={`${isEvaluating && (
                  cardPartials[i].content.some(
                    (_) => _.children.some((__) => __.insetQuestion)
                  ) || cardPartials[i].is_prompt
                )
                  ? 'mr-2.5 w-full min-[1440px]:w-1/2'
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
                cardPartials[i].content.some(
                  (_) => _.children.some((__) => __.insetQuestion)
                ) || cardPartials[i].is_prompt
              ) && (
                <div className="w-full mt-3 min-[1440px]:w-1/2 min-[1440px]:mt-0">
                  {_.content[0].type !== 'vim' && (
                    <RevisePartialEditor
                      content={cardPartials[i].content}
                      isActivePartial={
                        i === activePartial[0] && activePartial[1] === 1
                      }
                      readOnly={true}
                      onPartialFocus={() => setActivePartial([i, 1])}
                    ></RevisePartialEditor>
                  )}
                  {_.content[0].type === 'vim' && (
                    <PartialEditorWithVim
                      content={cardPartials[i].content}
                      isActivePartial={
                        i === activePartial[0] && activePartial[1] === 1
                      }
                      readOnly={true}
                      isRevising={true}
                      onPartialFocus={() => setActivePartial([i, 1])}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          <div
            className="w-[124px] h-[72px] bg-green kn-base-btn"
            onClick={() => navigate(`/edit/${cardset[0].id}`)}
          >
            <FaEdit className="h-[28px] w-[28px] fill-white
              translate-x-1 translate-y-[-1px]" />
          </div>
        </div>
      )}
    </>
  );
}