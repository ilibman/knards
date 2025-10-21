import './ui.scss';

interface Props {
  classForLabel: string;
  propertyTitle: string;
  propertyValue: boolean;
  onChecked: (newValue: boolean) => void;
}

export default function Checkbox(props: Props) {
  return (
    <label
      className={`flex items-center gap-[8px]
        cursor-pointer select-none
        ${props.classForLabel} kn-checkbox-wrapper`}
    >
      <input
        className="absolute size-[0]
          opacity-0 cursor-pointer
          kn-checkbox-input"
        type="checkbox"
        checked={props.propertyValue}
        onChange={(event) => props.onChecked(event.target.checked)}
      />
      <span
        className="relative inline-block size-[22px]
          kn-checkbox"
      ></span>
      {props.propertyTitle}
    </label>
  );
}