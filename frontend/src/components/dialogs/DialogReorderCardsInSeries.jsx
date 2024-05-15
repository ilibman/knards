import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Sortable from 'sortablejs';
import { RxCross2 } from 'react-icons/rx';
import { GoListOrdered } from 'react-icons/go';
import { FaCheck } from 'react-icons/fa';

export default function DialogReorderCardsInSeries(props) {
  const [cards, setCards] = useState([]);
  const [dialogOpened, setDialogOpened] = useState(false);

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
          onEnd: function(event) {
            const newCards = Array.from(event.target.childNodes).map((_) => {
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
              {cards.map((item, i) => (
                <li
                  className="min-h-[29px] px-2 font-semibold text-lg border-b
                    cursor-move
                    first:border-t"
                  key={item.id}
                  id={item.id}
                >{item.title}</li>
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