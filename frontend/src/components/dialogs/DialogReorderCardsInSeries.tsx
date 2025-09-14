import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Sortable from 'sortablejs';
import { RxCross2 } from 'react-icons/rx';
import { GoListOrdered } from 'react-icons/go';
import { FaCheck } from 'react-icons/fa';
import useAuth from '../../context/AuthProvider';
import api from '../../api';
import {
  Card,
  CardSeries
} from '../../models';

interface Props {
  series: CardSeries;
  cardsFromSeries: Array<Card>;
  onSave: (value: any) => void;
}

export default function DialogReorderCardsInSeries(props: Props) {
  const { authTokens } = useAuth();
  const [cards, setCards] = useState<Array<Card>>([]);
  const [cardPartialsExcerpts, setCardPartialsExcerpts] = useState({});
  const [dialogOpened, setDialogOpened] = useState(false);
  
  const [isCardPartialsExcerptsLoading, setIsCardPartialsExcerptsLoading]
    = useState(true);

  useEffect(() => {
    setCards(props.cardsFromSeries.sort(
      (a, b) => a.n_in_series - b.n_in_series
    ));
  }, [props])

  useEffect(() => {
    setTimeout(() => {
      const listElement = document.getElementById('items');
      if (listElement) {
        new Sortable(listElement, {
          animation: 0,
          forceFallback: true,
          onEnd: function(event: Event) {
            const htmlElement = event.target as HTMLElement;
            const newCards = Array.from(htmlElement.childNodes).map((_) => {
              const card = cards.find((__) => __.id === +_.id);
              return { ...card };
            }).map((_, i) => (
              {
                ..._,
                n_in_series: i + 1
              }
            ));
            setCards(newCards);
          }
        });
      }
    });
  }, [dialogOpened]);

  useEffect(() => {
    const fetchCardPartials = async (cardId: number) => {
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
        setCardPartialsExcerpts((prevValue) => (
          {
            ...prevValue,
            [cardId]: response.data[0]?.content[0].children[0].text
          }
        ));
      } catch (error: any) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardPartialsExcerptsLoading(false);
      }
    };
    
    cards.forEach((_) => {
      fetchCardPartials(_.id);
    });
  }, [cards]);

  function saveChanges() {
    props.onSave(cards);
  }

  return (
    <Dialog.Root>
      {cards.length > 1
        && (
          <Dialog.Trigger
            asChild
            onClick={() => setDialogOpened(true)}
          >
            <div
              className="relative top-2.5 h-[32px] mr-3 bg-white
                kn-base-btn"
            >
              <GoListOrdered />
            </div>
          </Dialog.Trigger>
        )
      }
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed z-[998] bg-black opacity-80 inset-0"
        />
        <Dialog.Content
          className="fixed z-[999] top-1/2 left-1/2
            max-h-[85vh] w-[90vw] max-w-[450px]
            border-2
            translate-x-[-50%] translate-y-[-50%]
            rounded bg-brown-light
            shadow-md outline-none
            dialog-reorder-card-in-series"
        >
          <Dialog.Title className="w-full py-2 pl-3
            text-white text-lg font-semibold normal-case
            bg-brown border-b-2 border-black">
            Reorder cards in series
          </Dialog.Title>
          <fieldset className="my-3 flex items-center">
            <ul
              className="w-full mt-3"
              id="items"
            >
              {cards.map((item) => (
                <li
                  className="min-h-[29px] px-2 font-semibold text-lg border-b
                    cursor-move
                    first:border-t"
                  key={item.id}
                  id={item.id}
                >{item.title ? item.title : (
                  cardPartialsExcerpts[item.id]?.length > 50
                    ? cardPartialsExcerpts[item.id]?.substr(0, 50) + '...'
                    : cardPartialsExcerpts[item.id]
                )}</li>
              ))}
            </ul>
          </fieldset>
          <div className="flex justify-center w-full pt-3.5 bg-brown
            border-t-2">
            <Dialog.Close
              asChild
              onClick={() => setDialogOpened(false)}
            >
              <div
                className="mb-3.5 w-[140px] bg-green
                  kn-base-btn"
                onClick={saveChanges}
              >
                <FaCheck className="fill-white" />
              </div>
            </Dialog.Close>
            <Dialog.Close
              asChild
              onClick={() => setDialogOpened(false)}
            >
              <button
                className="absolute top-[10px] right-[10px] inline-flex
                  items-center justify-center h-[25px] w-[25px]
                  outline-none hover:opacity-80"
                aria-label="Close"
              >
                <RxCross2 className="stroke-white stroke-[1.5]" />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}