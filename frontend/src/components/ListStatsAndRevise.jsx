import { forwardRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

const ListStatsAndRevise = ({ ...props }) => {
  const [tagStatistics, setTagStatistics] = useState({});

  useEffect(() => {
    const tagStatistics = {};

    props.cards.forEach((_) => {
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
  }, [props.cards, props.tags]);

  return (
    <Accordion.Root
      className="w-full border-t-2"
      type="single"
      defaultValue="item-1"
      collapsible
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Revision & cardset statistics</AccordionTrigger>
        <AccordionContent>
          <div className="text-white">
            Total # of cards in the cardset: {props.cards.length}
          </div>
          <ul className="ml-5">
            {Object.values(tagStatistics).map((_, i) => (
              <li
                className="text-white"
                key={i}
              >{Object.keys(tagStatistics)[i]}: {_.length}</li>
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
    <div className="py-[15px] px-5 text-white">{children}</div>
  </Accordion.Content>
));

export default ListStatsAndRevise;
