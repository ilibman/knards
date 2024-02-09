import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Input,
  InputGroup,
  SelectPicker,
  TagPicker,
} from 'rsuite';
import { FaCode, FaCheck } from 'react-icons/fa';
import { IoText } from 'react-icons/io5';
import api from '../api';
import './edit.scss';

export default function Edit() {
  const { id } = useParams();
  const [card, setCard] = useState([]);
  const [cardSeries, setCardSeries] = useState({});
  const [tags, setTags] = useState({});
  const [cardPartials, setCardPartials] = useState({});

  const [seriesPickerData, setSeriesPickerData] = useState([]);
  const [tagPickerData, setTagPickerData] = useState([]);

  const [isCardLoading, setIsCardLoading] = useState(true);
  const [isCardSeriesLoading, setIsCardSeriesLoading] = useState(true);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [isCardPartialsLoading, setIsCardPartialsLoading] = useState(true);

  const [activePartial, setActivePartial] = useState(0);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await api.get(
          `api/cards/cards/${id}/`
        );
        setCard(response.data);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  useEffect(() => {
    const fetchCardSeries = async () => {
      try {
        const response = await api.get('api/cards/card-series/');
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
        const response = await api.get('api/cards/tags/');
        const tagsMap = {};
        response.data.map((_) => (
          tagsMap[_.id] = { ..._ }
        ));
        setTagPickerData(
          response.data.map((_) => ({ label: _.name, value: _.name }))
        );
        setTags(tagsMap);
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

  useEffect(() => {
    const fetchCardPartials = async () => {
      try {
        const response = await api.get(`api/cards/card-partials/?card=${id}`);
        setCardPartials(response.data);
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardPartialsLoading(false);
      }
    };

    fetchCardPartials();
  }, [id]);

  useEffect(() => {
    if (card.id && card.tags.every((_) => typeof _ === 'string')) {
      return;
    }

    if (card.id && Object.entries(tags).length > 0) {
      const tagNames = card.tags.map((_) => (
        tags[_].name
      ));
      setCard({
        ...card,
        tags: [...tagNames]
      });
    }
  }, [card, tags]);

  function handleSeriesPickerChange(value) {
    setCard({
      ...card,
      card_series: value
    })
  }

  function handleTagPickerChange(value) {
  }

  function addPartial(index, type) {
    cardPartials.splice(index, 0, {
      'partial_type': type,
      content: '',
      card: card.id
    });
    setCardPartials(cardPartials.map((_, i) => (
      {
        ..._,
        position: ++i
      }
    )));
  }

  function saveChanges() {
    setActivePartial(0);

    const save = async () => {
      try {
        const response = await api.patch(
          `api/cards/cards/${card.id}/`,
          {
            title: card.title
          }
        );

        console.log(response.data)
      } catch (error) {
        if (!error.response) {
          console.error(error.message);
        }
      } finally {
        setIsCardLoading(false);
      }
    };

    save();
  }

  return (
    <>
      <div id="title" className="">
        <label className="mx-3 font-base font-semibold text-lg">Title:</label>
        <InputGroup
          inside
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
        >
          <Input
            value={card.title ?? ''} 
            onChange={e => setCard({
              ...card,
              title: e
            })}
          />
        </InputGroup>
      </div>
      <div id="series-picker" className="">
        <label className="mx-3 font-base font-semibold text-lg">Series:</label>
        <SelectPicker
          data={seriesPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
          value={cardSeries[card.card_series]?.id}
          onChange={handleSeriesPickerChange}
        />
      </div>
      <div id="tag-picker" className="">
        <label className="mx-3 font-base font-semibold text-lg">Tags:</label>
        <TagPicker
          data={tagPickerData}
          style={{ width: 'calc(100% - 20px)', margin: '4px 10px 10px 10px' }}
          value={card.tags}
          onChange={handleTagPickerChange}
        />
      </div>
      
      <div className="">
        {(
          isCardLoading
          || isCardSeriesLoading
          || isTagsLoading
          || isCardPartialsLoading
        ) && <p>Loading...</p>}
        {(
          !isCardLoading
          && !isCardSeriesLoading
          && !isTagsLoading
          && !isCardPartialsLoading
        ) && (
          <div className="flex flex-col border-t">
            {cardPartials.map((_, i) => (
              <div
                className="pt-2.5 pr-2.5 pl-2.5"
                key={i}
              >
                <ul className="flex flex-row mb-2">
                  <li
                    className="mr-2 p-2 bg-white shadow-md cursor-pointer
                      hover:opacity-80"
                    onClick={() => addPartial(i, 'text')}
                  >
                    <IoText />
                  </li>
                  <li
                    className="mr-2 p-2 bg-white shadow-md cursor-pointer
                      hover:opacity-80"
                    onClick={() => addPartial(i, 'code')}
                  >
                    <FaCode />
                  </li>
                </ul>
                <div
                  className={`p-4 bg-brown-light shadow-md outline-none
                    ${activePartial === cardPartials[i].position ? 'active-partial' : 'inactive-partial'}`}
                  contentEditable="true"
                  suppressContentEditableWarning={true}
                  onClick={() => setActivePartial(cardPartials[i].position)}
                >{_.content}</div>
              </div>
            ))}
            <ul className="pt-2.5 pr-2.5 pl-2.5 flex flex-row mb-2">
              <li
                className="mr-2 p-2 bg-white shadow-md cursor-pointer
                  hover:opacity-80"
                onClick={() => addPartial(cardPartials.length, 'text')}
              >
                <IoText />
              </li>
              <li
                className="mr-2 p-2 bg-white shadow-md cursor-pointer
                  hover:opacity-80"
                onClick={() => addPartial(cardPartials.length, 'code')}
              >
                <FaCode />
              </li>
            </ul>
            <div
              className="flex justify-center mb-2.5 ml-2.5 p-2 w-[72px]
                bg-green shadow-md
                cursor-pointer hover:opacity-80"
              onClick={() => saveChanges()}
            >
              <FaCheck className="fill-white" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}