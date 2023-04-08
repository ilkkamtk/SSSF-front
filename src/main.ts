import './style.css';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import L from 'leaflet';
import { doGraphQLFetch } from './graphql/fetch';
import {
  addCategory,
  addSpecies,
  checkToken,
  getAllAnimals,
  getAllCategories,
  getAllSpecies,
  login,
} from './graphql/queries';
import { allAnimalsToMap } from './mapFunctions/animalMap';
import { Species } from './interfaces/Species';
import { allSpeciesToMap } from './mapFunctions/speciesMap';
import createLoginModal from './domFunctions/createLoginModal';
import { Modal } from 'bootstrap';
import { Credentials } from './interfaces/Credentials';
import LoginMessageResponse from './interfaces/LoginMessageResponse';
import createMessageModal from './domFunctions/createMessageModal';
import { User } from './interfaces/User';
import updateUserPanel from './domFunctions/updateUserPanel';

// Global variables
const apiURL = import.meta.env.VITE_API_URL;
const user: User = {};
const myModal = new Modal('#animal-modal');

const map = L.map('map');
let activeForm: HTMLFormElement | null = null;
const targetModal = document.querySelector('.modal-content')!;
const loginButton = document.querySelector(
  '#login-button',
) as HTMLButtonElement;
const logoutButton = document.querySelector(
  '#logout-button',
) as HTMLButtonElement;

// Use the leaflet.js library to show the location on the map (https://leafletjs.com/)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

map.setView([0, 0], 1);

// check token
const token = localStorage.getItem('token');

if (token !== null) {
  const isTokenValid = await doGraphQLFetch(apiURL, checkToken, {}, token);
  if (isTokenValid.checkToken.message === 'Token valid') {
    loginButton.parentElement!.classList.add('d-none');
    logoutButton.parentElement!.classList.remove('d-none');
    user.user_name = isTokenValid.checkToken.user.user_name;
    updateUserPanel(user);
  }
}

// update animals
const updateAnimals = async () => {
  const animalData = await doGraphQLFetch(apiURL, getAllAnimals, {});
  allAnimalsToMap(animalData, map, targetModal);
};

// update species
const updateSpecies = async () => {
  // populate the #species-list datalist
  const speciesData = await doGraphQLFetch(apiURL, getAllSpecies, {});
  const speciesList = document.querySelector(
    '#species-list',
  ) as HTMLDataListElement;
  speciesList.innerHTML = '';
  speciesData.species.forEach((species: Species) => {
    const option = document.createElement('option');
    option.value = species.species_name;
    option.dataset.id = species.id;
    speciesList.appendChild(option);
  });
  allSpeciesToMap(speciesData, map, targetModal);
};

// update categories
const updateCategories = async () => {
  console.log('update categories');
  // populate the #category-list datalist
  const categoryData = await doGraphQLFetch(apiURL, getAllCategories, {});
  const categoryList = document.querySelector(
    '#category-list',
  ) as HTMLDataListElement;
  categoryList.innerHTML = '';
  categoryData.categories.forEach((category: any) => {
    const option = document.createElement('option');
    option.value = category.category_name;
    option.dataset.id = category.id;
    categoryList.appendChild(option);
  });
};

// login handling
loginButton.addEventListener('click', async () => {
  targetModal.innerHTML = createLoginModal();
  myModal.show();
  const loginForm = document.querySelector('#login-form') as HTMLFormElement;
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('#username') as HTMLInputElement;
    const password = loginForm.querySelector('#password') as HTMLInputElement;

    const credentials: Credentials = {
      username: username.value,
      password: password.value,
    };

    const loginData = (await doGraphQLFetch(apiURL, login, {
      credentials,
    })) as LoginMessageResponse;
    targetModal.innerHTML = createMessageModal(loginData.login.message);
    setTimeout(() => {
      myModal.hide();
    }, 2000);
    loginButton.parentElement!.classList.add('d-none');
    logoutButton.parentElement!.classList.remove('d-none');
    localStorage.setItem('token', loginData.login.token!);
    user.user_name = loginData.login.user.user_name!;
    updateUserPanel(user);
  });
});

// logout handling
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token');
  loginButton.parentElement!.classList.remove('d-none');
  logoutButton.parentElement!.classList.add('d-none');
  user.user_name = '';
  updateUserPanel(user);
});

// form handling
// get the active form based on the accordion
const getActiveForm = () => {
  const activeFormId = document
    .querySelector('.accordion-button[aria-expanded="true"]')
    ?.getAttribute('data-bs-target');
  if (activeFormId) {
    activeForm = document.querySelector(`${activeFormId} form`);
  }
  console.log(activeForm);
};

// call getActiveForm when the accordion is clicked
document.querySelector('.accordion')?.addEventListener('click', getActiveForm);

// when map is clicked, get the coordinates and add them to the location field of activeForm
map.on('click', (e) => {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  const locationField = activeForm?.querySelector(
    'input[id$="location"]',
  ) as HTMLInputElement;
  if (locationField) {
    locationField.value = `{"type":"Point","coordinates":[${lng},${lat}]}`;
  }
});

// if checkbox get-from-image is checked disable #animal-location input and hide #location-field
const getFromImage = document.querySelector(
  '#get-from-image',
) as HTMLInputElement;
const locationField = document.querySelector(
  '#location-field',
) as HTMLDivElement;
const animalLocation = document.querySelector(
  '#animal-location',
) as HTMLInputElement;
getFromImage.addEventListener('change', () => {
  if (getFromImage.checked) {
    animalLocation.disabled = true;
    locationField.classList.add('d-none');
  } else {
    animalLocation.disabled = false;
    locationField.classList.remove('d-none');
  }
});

// add category
const addCategoryForm = document.querySelector(
  '#add-category-form',
) as HTMLFormElement;
addCategoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const category = addCategoryForm.querySelector(
    '#category-name',
  ) as HTMLInputElement;
  const categoryData = await doGraphQLFetch(
    apiURL,
    addCategory,
    {
      categoryName: category.value,
    },
    localStorage.getItem('token')!,
  );
  categoryData.addCategory.category_name === category.value &&
    updateCategories();
  targetModal.innerHTML = createMessageModal('Category added');
  myModal.show();
  setTimeout(() => {
    myModal.hide();
  }, 2000);
  // clear form
  addCategoryForm.reset();
});

// add species
const addSpeciesForm = document.querySelector(
  '#add-species-form',
) as HTMLFormElement;
addSpeciesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const species = addSpeciesForm.querySelector(
    '#species-name',
  ) as HTMLInputElement;
  const location = addSpeciesForm.querySelector(
    '#species-location',
  ) as HTMLInputElement;
  const category = addSpeciesForm.querySelector(
    '#category',
  ) as HTMLInputElement;
  const categoryOption = document.querySelector(
    `#category-list option[value="${category.value}"]`,
  ) as HTMLElement;
  const category_id = categoryOption.dataset.id;
  const locationData = JSON.parse(location.value);

  const speciesData = await doGraphQLFetch(
    apiURL,
    addSpecies,
    {
      speciesName: species.value,
      location: locationData,
      category: category_id,
    },
    localStorage.getItem('token')!,
  );
  speciesData.addSpecies.species_name === species.value && updateSpecies();
  targetModal.innerHTML = createMessageModal('Species added');
  myModal.show();
  setTimeout(() => {
    myModal.hide();
  }, 2000);
  // clear form
  addSpeciesForm.reset();
});

// initialize the app
updateAnimals();
updateSpecies();
updateCategories();
