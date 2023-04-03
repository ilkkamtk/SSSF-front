import './style.css';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'bootstrap';
import L from 'leaflet';

import { doGraphQLFetch } from './graphql/fetch';
import createModalHtml from './domFunctions/createModalHtml';
// Use the leaflet.js library to show the location on the map (https://leafletjs.com/)
const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const targetModal = document.querySelector('.modal-content')!;

const options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

const addMarker = (lat: number, lng: number, text: string) => {
  L.marker([lat, lng]).addTo(map).bindPopup(text);
};

// A function that is called when location information is retrieved
const success = async (pos: GeolocationPosition) => {
  const crd = pos.coords;

  map.setView([crd.latitude, crd.longitude], 13);

  addMarker(crd.latitude, crd.longitude, 'I am here.');

  const query = `
  query Animals {
    animals {
      animal_name
      birthdate
      species {
        image
        species_name
        category {
          category_name
        }
      }
      location {
        type
        coordinates
      }
      owner {
        user_name
      }
    }
  }
`;

  const animalData = await doGraphQLFetch(
    'http://localhost:3000/graphql',
    query,
    {},
  );
  console.log(animalData.animals);
  animalData.animals.forEach((animal: any) => {
    const geojsonFeature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        name: animal.animal_name,
        animal,
      },
      geometry: animal.location,
    };

    L.geoJSON(geojsonFeature, {
      onEachFeature: (feature, layer) => {
        const animal = feature.properties.animal;
        const modalContent = createModalHtml(animal);

        layer.on('click', () => {
          targetModal.innerHTML = modalContent;
          const myModal = new Modal('#animal-modal');
          myModal.show();
        });
      },
    }).addTo(map);
  });
};

// Function to be called if an error occurs while retrieving location information
const error = (err: GeolocationPositionError) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

// Starts the location search
navigator.geolocation.getCurrentPosition(success, error, options);
