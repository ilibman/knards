import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { RxCross2 } from 'react-icons/rx';
import { FaCheck } from 'react-icons/fa';
import { TbNewSection } from 'react-icons/tb';
import useAuth from '../../context/AuthProvider';
import { createNewTag } from '../../query-client';
import { Tag } from '../../models';

interface Props {
  onlySelect: boolean;
  selectedTags: Array<Tag>;
  tags: Array<Tag>;
  disabled: boolean;
  onCreateNewTag: (createdTag: Tag, selectedTags: Array<Tag>) => void;
  onSave: (tags: Array<Tag>) => void;
  onClearTags: () => void;
}

export default function DialogEditTags(props: Props) {
  const { authTokens } = useAuth();
  const [typedInTag, setTypedInTag] = useState<string>('');
  const [uniqueTypedInTag, setUniqueTypedInTag] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<Array<Tag>>([]);
  const [availableTags, setAvailableTags] = useState<Array<Tag>>([]);
  const [dialogOpened, setDialogOpened] = useState(false);

  useEffect(() => {
    setSelectedTags([...props.selectedTags]);
    const selectedTagsIds = new Set(props.selectedTags.map((_) => _.id));
    setAvailableTags([...props.tags.filter((_) => !selectedTagsIds.has(_.id))]);
  }, [props.tags, props.selectedTags]);

  const createNewTagMutation = useMutation({
    mutationFn: (
      { accessToken, tagName }:
      { accessToken: string; tagName: string; }
    ) => (
      createNewTag(accessToken, tagName)
    )
  });

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedInTag(event.target.value);
  }

  useEffect(() => {
    const selectedTagsIds = new Set(props.selectedTags.map((_) => _.id));
    const newAvailableTags = props.tags
      .filter((_) => !selectedTagsIds.has(_.id))
      .filter((_) => _.name.includes(typedInTag));
    
    if (typedInTag) {
      setAvailableTags(newAvailableTags);
    } else {
      setAvailableTags([
        ...props.tags.filter((_) => !selectedTagsIds.has(_.id))
      ]);
    }

    if (newAvailableTags.some((_) => _.name === typedInTag)
      || !typedInTag) {
      setUniqueTypedInTag(false);
    } else {
      setUniqueTypedInTag(true);
    }
  }, [typedInTag]);

  function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && uniqueTypedInTag) {
      handleCreateNewTag();
    }
  }

  function handleSelectedTagClick(tag: Tag) {
    setAvailableTags([
      ...availableTags,
      tag
    ]);
    setSelectedTags(selectedTags.filter((_) => _.id !== tag.id));
  }

  function handleAvailableTagClick(tag: Tag) {
    setSelectedTags([
      ...selectedTags,
      tag
    ]);
    setAvailableTags(availableTags.filter((_) => _.id !== tag.id));
  }

  function handleCreateNewTag() {
    setTypedInTag('');

    createNewTagMutation.mutate({
      accessToken: authTokens.access,
      tagName: typedInTag
    }, {
      onSuccess(createdTag: Tag) {
        props.onCreateNewTag(createdTag, selectedTags);
      }
    });
  }

  function saveChanges() {
    setTypedInTag('');
    props.onSave(selectedTags);
  }

  function handleClearTags(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    props.onClearTags();
  }

  return (
    <Dialog.Root>
      <label
        className="mx-3 text-white font-base font-semibold text-lg"
      >Tags:</label>
      <Dialog.Trigger
        asChild
        onClick={() => setDialogOpened(true)}
      >
        <div
          className={`relative h-[44px] mx-2.5 !pr-0 flex !justify-between
            text-white text-lg bg-brown-light kn-base-btn
            ${props.disabled ? 'kn-picker-disabled' : ''}`}
        >
          <div className="flex">
            {props.selectedTags?.map((_) => (
              <div
                key={_.id}
                className="mr-1.5 py-0.5 px-2.5
                  text-white bg-blue rounded-lg"
              >{_.name}</div>
            ))}
          </div>
          {props.selectedTags?.length > 0 && <div
            className="flex justify-center items-center h-[44px] w-[40px]
              kn-picker-clear-btn"
            onClick={handleClearTags}
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
            dialog-edit-tags"
        >
          <VisuallyHidden asChild>
            <Dialog.Title>Select tags</Dialog.Title>
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
          <div className="flex h-[46px] w-full bg-white border-b-2">
            <input
              type="text"
              className="h-full py-2 px-3
                text-lg bg-transparent outline-none
                type-in-tag-input"
              spellCheck="false"
              value={typedInTag}
              onChange={handleInput}
              onKeyDown={handleKeyPress}
            />
            {uniqueTypedInTag && <div
              className="
                text-white text-lg font-base font-semibold bg-green
                kn-base-btn"
              onClick={handleCreateNewTag}
            >
              <TbNewSection className="stroke-white" size={28} />
            </div>}
          </div>
          <div
            className="p-2 min-h-[60px]
              border-b-2 overflow-x-hidden overflow-y-auto
              selected-tags-container"
          >
            {selectedTags.map((_) => (
              <span
                key={_.id}
                className="inline-block m-2 py-2 px-3 text-white text-lg
                  bg-blue rounded-lg cursor-pointer
                  opacity-100 hover:opacity-80"
                onClick={() => handleSelectedTagClick(_)}
              >{_.name}</span>
            ))}
          </div>
          <div
            className="p-2 overflow-x-hidden overflow-y-auto
              available-tags-container"
          >
            {availableTags.map((_) => (
              <span
                key={_.id}
                className="inline-block m-2 py-2 px-3 text-white text-lg
                  bg-blue rounded-lg cursor-pointer
                  opacity-100 hover:opacity-80"
                onClick={() => handleAvailableTagClick(_)}
              >{_.name}</span>
            ))}
          </div>
          <div className="absolute bottom-0 flex justify-center w-full pt-3.5
            bg-brown border-t-2">
            <Dialog.Close
              asChild
              onClick={() => setDialogOpened(false)}
            >
              <div
                className="mb-3.5 !px-10
                  text-white text-lg font-base font-semibold bg-green
                  kn-base-btn"
                onClick={saveChanges}
              >
                <FaCheck className="fill-white" />
              </div>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}