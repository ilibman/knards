import { forwardRef, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import AuthContext from '../context/AuthProvider';
import api from '../api';
import {
  CardForRevision
} from '../models';

const ListStatsAndRevise = ({ queryParams }) => {
  const { authTokens } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cardsetStatistics, setCardsetStatistics] = useState<{
    cards_total: number;
    cards_total_by_tags: Record<string, {
      total: number;
      to_revise: number;
    }>;
  }>({
    cards_total: 0,
    cards_total_by_tags: {}
  });
  const [cardset, setCardset] = useState<Array<CardForRevision>>([]);
  const [isCardsetAndStatisticsLoading, setIsCardsetAndStatisticsLoading]
    = useState(false);

  useEffect(() => {
    const getCardsetAndStatistics = async () => {
      setIsCardsetAndStatisticsLoading(true);

      // construct query params string from params object
      let flattenedParams = Object.keys(queryParams).reduce(function (r, k) {
        return r = r + (queryParams[k] ? queryParams[k] + '&' : '');
      }, '');
      flattenedParams = flattenedParams.substring(
        0,
        flattenedParams.length - 1
      );
      
      try {
        const response = await api.get(
          'api/cards/cards/'
            + `get_cardset_and_statistics_by_query_params/?${flattenedParams}`,
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`
            },
            withCredentials: true
          }
        );
        setCardset([...response.data.cardset]);
        setCardsetStatistics({
          cards_total: response.data.cards_total,
          cards_total_by_tags: response.data.cards_total_by_tags,
        });
      } catch (error: any) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardsetAndStatisticsLoading(false);
      }
    }

    getCardsetAndStatistics();
  }, [queryParams]);

  function runRevise() {
    const shuffleArray = (array: Array<any>) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    const filteredCardset = cardset.filter((_) => !_.revised);
    if (!isCardsetAndStatisticsLoading && filteredCardset.length > 0) {
      shuffleArray(filteredCardset);
      filteredCardset.sort((a, b) => b.weight - a.weight);

      localStorage.setItem('cardset', JSON.stringify(filteredCardset));
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
            Total # of cards in the cardset: {cardsetStatistics.cards_total}
          </div>
          <ul className="ml-5">
            {Object.values(cardsetStatistics.cards_total_by_tags).map((_, i) => (
              <li
                className="text-white"
                key={i}
              >
                <span className="inline-flex text-white">
                  {Object.keys(cardsetStatistics.cards_total_by_tags)[i]}
                </span>:
                &nbsp;{_.total}
                &nbsp;({_.to_revise} to revise)</li>
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
