import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { RxCross2 } from 'react-icons/rx';
import useAuth from '../../context/AuthProvider';
import { createNewCardSeries } from '../../query-client';
import { CardSeries } from '../../models';

interface Props {
  onlySelect: boolean;
  selectedSeries: CardSeries | null;
  cardSeries: Array<CardSeries>;
  disabled: boolean;
  placeForReorderBtn: boolean;
  onSave: (cardSeries: CardSeries) => void;
  onClearSeries: () => void;
}

export default function DialogEditSeries(props: Props) {
  const { authTokens } = useAuth();
  const [cardSeriesName, setCardSeriesName] = useState<string>('');
  const [isNewSeries, setIsNewSeries] = useState<boolean>(true);
  const [dialogOpened, setDialogOpened] = useState(false);

  const createNewCardSeriesMutation = useMutation({
    mutationFn: (
      { accessToken, seriesName }:
      { accessToken: string; seriesName: string; }
    ) => (
      createNewCardSeries(accessToken, seriesName)
    )
  });

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    setCardSeriesName(event.target.value);

    if (props.cardSeries.map((_) => _.name).includes(event.target.value)) {
      setIsNewSeries(false);
    } else {
      setIsNewSeries(true);
    }
  }

  function handleSeriesClick(seriesName: string) {
    setCardSeriesName(seriesName);

    if (props.cardSeries.map((_) => _.name).includes(seriesName)) {
      setIsNewSeries(false);
    } else {
      setIsNewSeries(true);
    }
  }

  function saveChanges() {
    if (isNewSeries) {
      createNewCardSeriesMutation.mutate({
        accessToken: authTokens.access,
        seriesName: cardSeriesName
      }, {
        onSuccess(responseData: CardSeries) {
          props.onSave(responseData);
        }
      });
    } else {
      props.onSave(props.cardSeries.find((_) => _.name === cardSeriesName)!);
    }
  }

  function handleClearSeries(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    props.onClearSeries();
  }

  return (
    <Dialog.Root>
      <label
        className="mx-3 text-white font-base font-semibold text-lg"
      >Series:</label>
      <Dialog.Trigger
        asChild
        onClick={() => setDialogOpened(true)}
      >
        <div
          className={`relative h-[44px] mx-2.5 !pr-0 !pl-3 flex !justify-between
            text-white text-lg bg-brown-light kn-base-btn
            ${props.disabled ? 'kn-picker-disabled' : ''}
            ${props.placeForReorderBtn ? 'mr-14' : ''}`}
        >
          {props.selectedSeries?.name}
          {props.selectedSeries?.name && <div
            className="flex justify-center items-center h-[44px] w-[40px]
              kn-picker-clear-btn"
            onClick={handleClearSeries}
          >
            <RxCross2 className="stroke-black stroke-[1.5]" />
          </div>}
        </div>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed z-[998] bg-black opacity-80 inset-0"
        />
        <Dialog.Content
          className="fixed z-[999] top-5 left-5
            border-2 rounded bg-brown-light
            shadow-md outline-none
            dialog-edit-series"
        >
          <VisuallyHidden asChild>
            <Dialog.Title>Select card series</Dialog.Title>
          </VisuallyHidden>
          <Dialog.Close
            asChild
            onClick={() => setDialogOpened(false)}
          >
            <button
              className="absolute top-0 right-0 inline-flex
                items-center justify-center h-[46px] w-[46px]
                bg-brown border-b-2 border-l-2
                outline-none dialog-close-btn"
              aria-label="Close"
            >
              <RxCross2 className="stroke-white stroke-[1.5]" />
            </button>
          </Dialog.Close>
          <div className="h-[46px] w-full bg-white border-b-2">
            <input
              type="text"
              className="h-full w-full py-2 px-3
                text-lg
                bg-transparent outline-none"
              spellCheck="false"
              value={cardSeriesName}
              onChange={handleInput}
            />
          </div>
          <div className="overflow-auto series-container">
            {props.cardSeries.map((_) => (
              <div
                key={_.id}
                className="py-2 px-3 text-white text-lg
                  border-b border-black cursor-pointer
                  opacity-80 hover:opacity-100"
                onClick={() => handleSeriesClick(_.name)}
              >{_.name}</div>
            ))}
          </div>
          <div className="absolute bottom-0 flex justify-center w-full pt-3.5
            bg-brown border-t-2">
            <Dialog.Close
              asChild
              onClick={() => setDialogOpened(false)}
            >
              <div
                className={`mb-3.5 !px-5
                  text-white text-lg font-base font-semibold bg-green
                  kn-base-btn
                  ${isNewSeries && props.onlySelect
                    ? 'kn-btn-disabled' : ''}`}
                onClick={saveChanges}
              >
                {isNewSeries ? 'Create new series' : 'Select series'}
              </div>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}