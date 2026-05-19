// Selecteer de elementen uit onze HTML die we willen gebruiken
const schilderijKaarten = document.querySelectorAll('.schilderij-kaart.beschikbaar');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const sluitKnop = document.querySelector('.sluit-knop');

// Stap 1: Zeg tegen elke beschikbare foto dat er iets moet gebeuren als je erop klikt
schilderijKaarten.forEach(kaart => {
    kaart.addEventListener('click', () => {
        // Zoek de link van de foto en de titel op van de kaart waarop geklikt is
        const fotoBron = kaart.querySelector('img').src;
        const titelTekst = kaart.querySelector('h3').innerText;

        // Plak deze in de lightbox
        lightboxFoto.src = fotoBron;
        lightboxTitel.innerText = titelTekst;

        // Maak de lightbox zichtbaar!
        lightbox.style.display = 'block';
    });
});

// Stap 2: De lightbox sluiten als je op het kruisje klikt
sluitKnop.addEventListener('click', () => {
    lightbox.style.display = 'none';
});

// Stap 3: De lightbox sluiten als je ergens naast de witte doos klikt (op de zwarte achtergrond)
window.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        lightbox.style.display = 'none';
    }
});