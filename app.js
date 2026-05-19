// --- 1. FIREBASE CONFIGURATIE ---
const firebaseConfig = {
    apiKey: "AIzaSyBvA_Jck1PO6CDbI1cngZBpxO2ETAb9_GY",
    authDomain: "paintings-be46b.firebaseapp.com",
    projectId: "paintings-be46b",
    storageBucket: "paintings-be46b.firebasestorage.app",
    messagingSenderId: "176727832277",
    appId: "1:176727832277:web:aa51107213ed9d7a8b945c"
};

// Start Firebase op
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. SELECTEREN VAN HTML ELEMENTEN ---
const galerijContainer = document.querySelector('.galerij');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const lightboxFormaat = document.getElementById('lightbox-formaat'); 
const sluitKnop = document.querySelector('.sluit-knop');
const filterKnoppen = document.querySelectorAll('.filter-knop');

const koperNaamInput = document.getElementById('koper-naam');
const koperEmailInput = document.getElementById('koper-email');
const koperBerichtInput = document.getElementById('koper-bericht');
const bevestigKnop = document.getElementById('bevestig-reservering'); // De typfout is hier netjes weggehaald!

let huidigSchilderijId = null; 

// --- 3. DATA INLADEN EN CHRONOLOGISCH SORTEREN ---
async function laadSchilderijen() {
    galerijContainer.innerHTML = ''; 
    
    // We sorteren hier specifiek op titel (.orderBy), zodat Schilderij 01 bovenaan start!
    const querySnapshot = await db.collection("schilderijen").orderBy("titel", "asc").get();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const kaart = document.createElement('div');
        kaart.className = `schilderij-kaart ${data.status}`;
        
        const formaatTekst = data.formaat ? data.formaat : "Niet opgegeven";

        let inhoud = `
            <img src="${data.afbeelding_url}" alt="${data.titel}">
            <h3>${data.titel}</h3>
            <p class="formaat-label">Formaat: ${formaatTekst}</p> 
        `;

        if (data.status === 'gereserveerd') {
            inhoud += `<div class="status-label">Gereserveerd</div>`;
        }

        kaart.innerHTML = inhoud;

        // Maak de kaart alleen klikbaar als het schilderij nog 'beschikbaar' is
        if (data.status === 'beschikbaar') {
            kaart.addEventListener('click', () => {
                huidigSchilderijId = doc.id; 
                lightboxFoto.src = data.afbeelding_url;
                lightboxTitel.innerText = data.titel;
                lightboxFormaat.innerText = "Formaat: " + formaatTekst; 
                
                // Reset het formulier voor de nieuwe klik
                koperNaamInput.value = '';
                koperEmailInput.value = '';
                koperBerichtInput.value = ''; 
                
                lightbox.style.display = 'block';
            });
        }

        galerijContainer.appendChild(kaart);
    });
}

// --- 4. DE RESERVERING KOPPELEN ---
bevestigKnop.addEventListener('click', async () => {
    const naam = koperNaamInput.value.trim();
    const email = koperEmailInput.value.trim();
    const bericht = koperBerichtInput.value.trim(); 

    if (naam === '' || email === '') {
        alert('Vul alstublieft zowel uw naam als e-mailadres in.');
        return;
    }

    try {
        // Sla de reservering inclusief het optionele bericht op in Firebase
        await db.collection("schilderijen").doc(huidigSchilderijId).update({
            status: 'gereserveerd',
            koper_naam: naam,
            koper_email: email,
            koper_bericht: bericht
        });

        alert("Dankjewel voor het reserveren van dit schilderij. Er wordt z.s.m. even contact met je opgenomen om het schilderij over te dragen!");
        
        lightbox.style.display = 'none';
        laadSchilderijen(); // Ververs direct de pagina zodat hij grijs wordt

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

// --- 6. FILTER LOGICA (ALLES / BESCHIKBAAR / GERESERVEERD) ---
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

// Zet de machine aan!
laadSchilderijen();
