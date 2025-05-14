import "./Button.css";
type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button = (props: Props) => {
  return (
    <button disabled={props.disabled} onClick={props.onClick} className={props.disabled ? "disabled" : ""} >
      {props.label}
    </button >
  )
}

export default Button
