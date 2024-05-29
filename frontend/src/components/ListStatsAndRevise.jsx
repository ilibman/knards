import { forwardRef, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import AuthContext from '../context/AuthProvider';
import api from '../api';

const ListStatsAndRevise = ({ ...props }) => {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tagStatistics, setTagStatistics] = useState({});
  const [cardset, setCardset] = useState([]);
  const [isCardScoresLoading, setIsCardScoresLoading] = useState(false);

  useEffect(() => {
    const getScoresAndSetCardset = async () => {
      setIsCardScoresLoading(true);
      const today = new Date();
      
      const cards = props.cards.map((_) => (
        {
          id: _.id,
          title: _.title,
          series_id: _.card_series,
          n_in_series: _.n_in_series,
          tags: _.tags,
          created_at: _.created_at,
          owner: _.owner,
          revised: false
        }
      ));
      
      cards.forEach(async (_, i) => {
        try {
          const response = await api.get(
            `api/cards/card-scores/?card=${_.id}`,
            {
              headers: {
                Authorization: `JWT ${authTokens.access}`
              },
              withCredentials: true
            }
          );

          _.score = response.data[0]?.score;
          _.last_revised_at = response.data[0]?.last_revised_at;
          _.card_score_id = response.data[0]?.id;

          // calculate the amount of days passed since the last revision
          const daysPassed = Math.round(Math.abs((
            today - new Date(
              response.data[0]?.last_revised_at
              ? response.data[0]?.last_revised_at
              : _.created_at
            )
          ) / (24 * 60 * 60 * 1000)));

          // remove cards score of which is higher
          // than the amount of days passed since last revision
          if (_.score && _.score > daysPassed) {
            _.revised = true;
          }

          // calculate weight of the card based on its score and last revised date
          _.weight
            = 1000 * Math.exp(-(0.6 * (
              response.data[0]?.score
              ? response.data[0]?.score
              : 0
            )))
            + 18 * Math.pow(daysPassed, 0.7);

        } catch (error) {
          if (!error.response) {
            console.error(error.message);
          }
        } finally {
          if (i === cards.length - 1) {
            setCardset(cards);

            const tagStatistics = {};
  
            cards.forEach((_) => {
              const tagLine
                = _.tags.sort().map((tagId) => props.tags[tagId]?.name).join(', ');
              if (!tagStatistics[tagLine]) {
                tagStatistics[tagLine] = [];
                tagStatistics[tagLine].push(_);
              } else {
                tagStatistics[tagLine].push(_);
              }
            });
        
            setTagStatistics(tagStatistics);
            setIsCardScoresLoading(false);
          }
        }
      });
    }

    getScoresAndSetCardset();
  }, [props.cards, props.tags]);

  function runRevise() {
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    if (!isCardScoresLoading && cardset.length > 0) {
      shuffleArray(cardset);
      cardset.sort((a, b) => b.weight - a.weight);

      localStorage.setItem('cardset', JSON.stringify(cardset.map((_) => (
        {
          id: _.id,
          card_score_id: _.card_score_id,
          title: _.title,
          n_in_series: _.n_in_series,
          series_id: _.series_id,
          tags: _.tags,
          created_at: _.created_at,
          score: _.score ? _.score : 0,
          owner: _.owner,
          revised: _.revised
        }
      ))));
      navigate('/revise');
    }
  }

  return (
    <Accordion.Root
      className="w-full border-t-2"
      type="single"
      collapsible
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Revision & cardset statistics</AccordionTrigger>
        <AccordionContent>
          <div
            className="mb-2.5 w-[180px]
              text-white text-lg font-base font-semibold bg-green kn-base-btn"
            onClick={() => runRevise()}
          >
            Revise cardset
          </div>
          <div className="text-white">
            Total # of cards in the cardset: {props.cards.length}
          </div>
          <ul className="ml-5">
            {Object.values(tagStatistics).map((_, i) => (
              <li
                className="text-white"
                key={i}
              >{Object.keys(tagStatistics)[i]}: {_.length}
                &nbsp;(to revise {_.filter((__) => !__.revised).length})</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion.Root>
  );
}

const AccordionItem = forwardRef(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Item
    className={classNames(
      `mt-px
        overflow-hidden
        first:mt-0 focus-within:relative focus-within:z-10`,
      className
    )}
    {...props}
    ref={forwardedRef}
  >
    {children}
  </Accordion.Item>
));

const AccordionTrigger = forwardRef(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Header className="flex">
    <Accordion.Trigger
      className={classNames(
        `group flex-1 flex items-center justify-center h-[45px] px-5
          text-white font-base font-semibold text-lg
          cursor-default outline-none`,
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
      <ChevronDownIcon
        className="ml-2 stroke-white stroke-2
          ease-[cubic-bezier(0.87,_0,_0.13,_1)] transition-transform
          duration-300 group-data-[state=open]:rotate-180"
        aria-hidden
      />
    </Accordion.Trigger>
  </Accordion.Header>
));

const AccordionContent = forwardRef(({ children, className, ...props }, forwardedRef) => (
  <Accordion.Content
    className={classNames(
      'overflow-hidden',
      className
    )}
    {...props}
    ref={forwardedRef}
  >
    <div className="py-[15px] px-3 text-white border-t border-black">{children}</div>
  </Accordion.Content>
));

export default ListStatsAndRevise;
