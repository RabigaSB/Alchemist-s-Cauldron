import dropletIcon from '../assets/icons/droplet-solid-full.svg';
import featherIcon from '../assets/icons/feather-solid-full.svg';
import glassWaterIcon from '../assets/icons/glass-water-solid-full.svg';
import plantWiltIcon from '../assets/icons/plant-wilt-solid-full.svg';
import spaIcon from '../assets/icons/spa-solid-full.svg';
import vialIcon from '../assets/icons/vial-solid-full.svg';
import wandSparklesIcon from '../assets/icons/wand-sparkles-solid-full.svg';
import wormIcon from '../assets/icons/worm-solid-full.svg';

export interface IIngredient {
  id: string;
  name: string;
  icon: string;
  temperature: number;
  density: number;
  magicPower: number;
}

export const INGREDIENTS: IIngredient[] = [
  {
    id: 'dragon-tears',
    name: 'Dragon Tears',
    icon: dropletIcon,
    temperature: 25,
    density: 8,
    magicPower: 10,
  },
  {
    id: 'fairy-dust',
    name: 'Fairy Dust',
    icon: wandSparklesIcon,
    temperature: 12,
    density: 9,
    magicPower: 12,
  },
  {
    id: 'frost-lotus',
    name: 'Frost Lotus',
    icon: spaIcon,
    temperature: -18,
    density: 4,
    magicPower: 14,
  },
  {
    id: 'mandrake-root',
    name: 'Mandrake Root',
    icon: plantWiltIcon,
    temperature: -5,
    density: 20,
    magicPower: 8,
  },
  {
    id: 'caustic-acid',
    name: 'Caustic Acid',
    icon: vialIcon,
    temperature: 10,
    density: 14,
    magicPower: 22,
  },
  {
    id: 'essence-of-the-void',
    name: 'Essence of the Void',
    icon: glassWaterIcon,
    temperature: -20,
    density: -10,
    magicPower: 40,
  },
  {
    id: 'phoenix-feather',
    name: 'Phoenix Feather',
    icon: featherIcon,
    temperature: 50,
    density: -10,
    magicPower: 30,
  },
  {
    id: 'toad-slime',
    name: 'Toad Slime',
    icon: wormIcon,
    temperature: 5,
    density: 30,
    magicPower: 0,
  },
];
