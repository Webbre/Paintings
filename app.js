// --- 1. FIREBASE INSTELLEN ---
const firebaseConfig = {
    apiKey: "AIzaSyBvA_Jck1PO6CDbI1cngZBpxO2ETAb9_GY",
    authDomain: "paintings-be46b.firebaseapp.com",
    projectId: "paintings-be46b",
    storageBucket: "paintings-be46b.firebasestorage.app",
    messagingSenderId: "176727832277",
    appId: "1:176727832277:web:aa51107213ed9d7a8b945c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. SELECTEREN VAN HTML ELEMENTEN ---
const galerijContainer = document.querySelector('.galerij');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const sluitKnop = document.querySelector('.sluit-knop');
const filterKnoppen = document.querySelectorAll('.filter-knop');

const koperNaamInput = document.getElementById('koper-naam');
const koperEmailInput = document.getElementById('koper-email');
// NIEUW: Selecteer het berichtvenster
const koperBerichtInput = document.getElementById('koper-bericht');
const bevestigKnop = document.getElementById('bevestig-reservering');

let huidigSchilderijId = null; 

// --- 3. DATA OPHALEN EN OP HET SCHERM ZETTEN ---
async function laadSchilderijen() {
    galerijContainer.innerHTML = ''; 
    const querySnapshot = await db.collection("schilderijen").get();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const kaart = document.createElement('div');
        kaart.className = `schilderij-kaart ${data.status}`;

        let inhoud = `
            <img src="${data.afbeelding_url}" alt="${data.titel}">
            <h3>${data.titel}</h3>
        `;

        if (data.status === 'gereserveerd') {
            inhoud += `<div class="status-label">Gereserveerd</div>`;
        }

        kaart.innerHTML = inhoud;

        if (data.status === 'beschikbaar') {
            kaart.addEventListener('click', () => {
                huidigSchilderijId = doc.id; 
                lightboxFoto.src = data.afbeelding_url;
                lightboxTitel.innerText = data.titel;
                
                koperNaamInput.value = '';
                koperEmailInput.value = '';
                koperBerichtInput.value = ''; // NIEUW: Maak ook het tekstvak weer leeg
                
                lightbox.style.display = 'block';
            });
        }

        galerijContainer.appendChild(kaart);
    });
}

// --- 4. RESERVEREN ---
bevestigKnop.addEventListener('click', async () => {
    const naam = koperNaamInput.value.trim();
    const email = koperEmailInput.value.trim();
    const bericht = koperBerichtInput.value.trim(); // NIEUW: Haal de tekst op

    if (naam === '' || email === '') {
        alert('Vul alstublieft zowel uw naam als e-mailadres in.');
        return;
    }

    try {
        await db.collection("schilderijen").doc(huidigSchilderijId).update({
            status: 'gereserveerd',
            koper_naam: naam,
            koper_email: email,
            koper_bericht: bericht // NIEUW: Stuur het bericht naar de database
        });

        alert("Dankjewel voor het reserveren van dit schilderij. Er wordt z.s.m. even contact met je opgenomen om het schilderij over te dragen!");
        
        lightbox.style.display = 'none';
        laadSchilderijen();

    } catch (error) {
        console.error("Fout bij reserveren: ", error);
        alert("Er ging iets mis bij het reserveren. Probeer het later nog eens.");
    }
});

// --- 5. DE LIGHTBOX SLUITEN ---
sluitKnop.addEventListener('click', () => {
    lightbox.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        lightbox.style.display = 'none';
    }
});

// --- 6. DE FILTERKNOPPEN ---
filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');

        const filterWaarde = knop.innerText.toLowerCase(); 
        const alleKaarten = document.querySelectorAll('.schilderij-kaart');

        alleKaarten.forEach(kaart => {
            if (filterWaarde === 'alles') {
                kaart.style.display = '';
            } else if (filterWaarde === 'beschikbaar') {
                kaart.style.display = kaart.classList.contains('beschikbaar') ? '' : 'none';
            } else if (filterWaarde === 'gereserveerd') {
                kaart.style.display = kaart.classList.contains('gereserveerd') ? '' : 'none';
            }
        });
    });
});

laadSchilderijen();
