import './styles/main.scss';
import { createCauldron } from './ui/cauldron';

const app = document.createElement('main');
app.appendChild(createCauldron());

document.body.append(app);
