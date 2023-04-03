export default function createModalHtml(animal: any): string {
  const modalHtml = `
  <div class="modal-header">
    <h5 class="modal-title" id="exampleModalLabel">${animal.animal_name}</h5>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <div class="modal-body">
    <p>Species: ${animal.species.species_name}</p>
    <p>Category: ${animal.species.category.category_name}</p>
    <img src="${animal.species.image}" alt="${
    animal.species.species_name
  }" style="width: 100%;" />
    <p>Owner: ${animal.owner.user_name}</p>
    <p>Age: ${
      new Date().getFullYear() - new Date(animal.birthdate).getFullYear()
    }</p>
  </div>
  <div class="modal-footer">
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
  </div>
`;
  return modalHtml;
}
