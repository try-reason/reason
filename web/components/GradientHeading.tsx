import gradients from '@/gradients';

interface ColorsProps {
  color1: string;
  color2: string;
  direction?: string;
}

interface GradType {
  type: keyof typeof gradients;
}

type Props = {className?: string; children?: any} & (ColorsProps | GradType);

export default function GradientHeading(prop: Props) {
  if ('type' in prop) {
    const { type, ...props } = prop;

    return (
      <h1
        className={`${prop.className ?? ''} text-transparent`}
        style={{ background: gradients[type], WebkitBackgroundClip: 'text' }}
      >
        {props.children}
      </h1>
    )
  } else {
    const { color1, color2, direction = 'to top', ...props } = prop;
    return (
      <h1
        className={`${prop.className ?? ''} bg-clip-text`}
        style={{ background: `linear-gradient(${direction}, ${color1} 0%, ${color2} 100%)` }}
      >
        {props.children}
      </h1>
    )
  }

}