import './ui.scss';

interface Props {
  classForLabels: string;
  vertical: boolean;
  properties: Array<{
    title: string;
    value: boolean;
  }>;
  onSelected: (newValues: Array<boolean>) => void;
}

export default function RadioboxGroup(props: Props) {
  return (
    <div className={`flex ${props.vertical ? 'flex-col' : 'items-center'}`}>
      {props.properties.map((_, i) => (
        <label
          className={`flex items-center gap-[8px]
            ${props.vertical ? '' : 'mr-5'}
            cursor-pointer select-none
            ${props.classForLabels} kn-radiobox-wrapper`}
          key={i}
        >
          <input
            className="absolute size-[0]
              opacity-0 cursor-pointer
              kn-radiobox-input"
            type="radio"
            name={_.title}
            checked={_.value}
            onChange={() => props.onSelected(
              Array.from({ length: props.properties.length }, (__, j) => i === j)
            )}
          />
          <span
            className="relative inline-block size-[22px]
              kn-radiobox"
          ></span>
          {_.title}
        </label>
      ))}
    </div>
  );
}