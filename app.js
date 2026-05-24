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

const galerijContainer = document.querySelector('.galerij');
const lightbox = document.getElementById('lightbox');
const lightboxFoto = document.getElementById('lightbox-foto');
const lightboxTitel = document.getElementById('lightbox-titel');
const lightboxFormaat = document.getElementById('lightbox-formaat'); 
const sluitKnop = document.querySelector('.sluit-knop');
const filterKnoppen = document.querySelectorAll('.filter-knop');
const formaatDropdown = document.getElementById('filter-formaat');

const formulierTitel = document.getElementById('formulier-titel');
const invulVelden = document.getElementById('invul-velden');
const koperNaamInput = document.getElementById('koper-naam');
const koperEmailInput = document.getElementById('koper-email');
const koperBerichtInput = document.getElementById('koper-bericht');
const bevestigKnop = document.getElementById('bevestig-reservering');

let huidigSchilderijId = null; 
let huidigeStatus = null;

let huidigeStatusFilter = 'alles';
let huidigeFormaatFilter = 'Alles';

async function laadSchilderijen() {
    galerijContainer.innerHTML = '<p style="text-align: center; width: 100%;">Schilderijen laden... ⏳</p>'; 
    
    try {
        const querySnapshot = await db.collection("schilderijen").get();
        galerijContainer.innerHTML = ''; 
        
        let schilderijenLijst = [];
        querySnapshot.forEach((doc) => {
            schilderijenLijst.push({ id: doc.id, ...doc.data() });
        });

        schilderijenLijst.sort((a, b) => {
            return (a.titel || "").localeCompare(b.titel || "", undefined, { numeric: true });
        });
        
        schilderijenLijst.forEach((data) => {
            const kaart = document.createElement('div');
            
            let f = "Onbekend";
            if (data.formaat) {
                f = String(data.formaat).trim();
            }
            
            const veiligeStatus = data.status || "beschikbaar";
            kaart.className = `schilderij-kaart ${veiligeStatus}`;
            kaart.dataset.formaat = f; 
            
            const typeTekst = data.type || "Onbekend";
            const lijstTekst = data.lijst || "Onbekend";

            let inhoud = `
                <img src="${data.afbeelding_url}" alt="${data.titel}" loading="lazy" style="transition: opacity 0.5s ease-in-out; background-color: #f0f0f0;">
                <h3>${data.titel}</h3>
                <p class="formaat-label">
                    Formaat: ${f}<br>
                    Type: ${typeTekst}<br>
                    Lijst: ${lijstTekst}
                </p> 
            `;

            if (veiligeStatus === 'gereserveerd') {
                inhoud += `<div class="status-label">Gereserveerd</div>`;
            } else if (veiligeStatus === 'niet-beschikbaar') {
                inhoud += `<div class="status-label" style="background-color: #555; color: #fff;">Niet meer beschikbaar</div>`;
            }
            
            kaart.innerHTML = inhoud;

            if (veiligeStatus !== 'niet-beschikbaar') {
                kaart.addEventListener('click', () => {
                    huidigSchilderijId = data.id; 
                    huidigeStatus = veiligeStatus;
                    
                    lightboxFoto.src = data.afbeelding_url;
                    lightboxTitel.innerText = data.titel;
                    lightboxFormaat.innerHTML = `Formaat: ${f} <br> Type: ${typeTekst} <br> Lijst: ${lijstTekst}`; 
                    
                    koperNaamInput.value = '';
                    koperEmailInput.value = '';
                    koperBerichtInput.value = ''; 
                    
                    if (veiligeStatus === 'beschikbaar') {
                        formulierTitel.innerText = "Interesse in dit schilderij?";
                        bevestigKnop.innerText = "Bevestig reservering";
                        invulVelden.style.display = 'flex';
                    } else if (veiligeStatus === 'gereserveerd') {
                        const reservelijst = data.reservelijst || [];
                        if (reservelijst.length < 2) {
                            formulierTitel.innerText = "Schilderij is al gereserveerd. Wil je op de reservelijst?";
                            bevestigKnop.innerText = "Plaats op reservelijst";
                            invulVelden.style.display = 'flex';
                        } else {
                            formulierTitel.innerText = "Dit schilderij is gereserveerd en de reservelijst zit momenteel vol.";
                            invulVelden.style.display = 'none';
                        }
                    }
                    
                    lightbox.style.display = 'block';
                });
            } else {
                kaart.style.cursor = 'default';
                kaart.style.opacity = '0.75';
            }

            galerijContainer.appendChild(kaart);
        });
        
        pasFiltersToe();

    } catch (error) {
        console.error(error);
        galerijContainer.innerHTML = `<p style="color: red; text-align: center; width: 100%; font-weight: bold;">Fout bij inladen: ${error.message}</p>`;
    }
}

bevestigKnop.addEventListener('click', async () => {
    const naam = koperNaamInput.value.trim();
    const email = koperEmailInput.value.trim();
    const bericht = koperBerichtInput.value.trim(); 

    if (naam === '' || email === '') {
        alert('Vul alstublieft uw naam en e-mailadres in.');
        return;
    }

    // Zet de knop tijdelijk uit om dubbelklikken te voorkomen
    bevestigKnop.disabled = true;
    const origineleTekst = bevestigKnop.innerText;
    bevestigKnop.innerText = "Bezig met controleren... ⏳";

    try {
        // --- NIEUW: CHECK OP MAXIMAAL 2 RESERVERINGEN ---
        // Haal alle gereserveerde schilderijen op om te tellen
        const gereserveerdeDocs = await db.collection("schilderijen").where("status", "==", "gereserveerd").get();
        let emailTelling = 0;

        gereserveerdeDocs.forEach(doc => {
            const d = doc.data();
            
            // Controleer of de persoon de hoofdkoper is
            if (d.koper_email && d.koper_email.toLowerCase() === email.toLowerCase()) {
                emailTelling++;
            }
            
            // Controleer of de persoon op een reservelijst staat
            if (d.reservelijst && Array.isArray(d.reservelijst)) {
                d.reservelijst.forEach(res => {
                    if (res.email && res.email.toLowerCase() === email.toLowerCase()) {
                        emailTelling++;
                    }
                });
            }
        });

        // Als ze al 2 of meer (wachtlijst)reserveringen hebben, breek het proces af!
        if (emailTelling >= 2) {
            alert("Let op: Je hebt het maximum van 2 reserveringen voor dit e-mailadres bereikt. Om iedereen een eerlijke kans te geven, is het helaas niet mogelijk om er meer te reserveren.");
            bevestigKnop.disabled = false;
            bevestigKnop.innerText = origineleTekst;
            return; // Stop hier
        }
        // ------------------------------------------------

        // Als ze hier aankomen, is de check geslaagd en gaan we opslaan
        bevestigKnop.innerText = "Bezig met opslaan... ⏳";
        const docRef = db.collection("schilderijen").doc(huidigSchilderijId);
        
        if (huidigeStatus === 'beschikbaar') {
            await docRef.update({
                status: 'gereserveerd',
                koper_naam: naam,
                koper_email: email,
                koper_bericht: bericht,
                reservelijst: [] 
            });
            alert("Bedankt voor je interesse! Het schilderij is voor je gereserveerd. Er wordt z.s.m. contact opgenomen.");
        } else if (huidigeStatus === 'gereserveerd') {
            await docRef.update({
                reservelijst: firebase.firestore.FieldValue.arrayUnion({
                    naam: naam,
                    email: email,
                    bericht: bericht
                })
            });
            alert("Je bent succesvol op de reservelijst geplaatst!");
        }
        
        lightbox.style.display = 'none';
        laadSchilderijen(); 

    } catch (error) {
        console.error("Fout: ", error);
        alert("Er ging iets mis. Probeer het later nog eens.");
    } finally {
        // Herstel de knop altijd na een succesvolle (of mislukte) poging
        bevestigKnop.disabled = false;
        bevestigKnop.innerText = origineleTekst;
    }
});

sluitKnop.addEventListener('click', () => { lightbox.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.style.display = 'none'; });

filterKnoppen.forEach(knop => {
    knop.addEventListener('click', () => {
        filterKnoppen.forEach(k => k.classList.remove('actief'));
        knop.classList.add('actief');

        huidigeStatusFilter = knop.innerText.toLowerCase(); 
        pasFiltersToe();
    });
});

if (formaatDropdown) {
    formaatDropdown.addEventListener('change', (e) => {
        huidigeFormaatFilter = e.target.value; 
        pasFiltersToe();
    });
}

function pasFiltersToe() {
    const alleKaarten = document.querySelectorAll('.schilderij-kaart');

    alleKaarten.forEach(kaart => {
        let magTonenStatus = false;
        
        if (huidigeStatusFilter === 'alles') {
            magTonenStatus = true;
        } else if (huidigeStatusFilter === 'beschikbaar' && kaart.classList.contains('beschikbaar')) {
            magTonenStatus = true;
        } else if (huidigeStatusFilter === 'gereserveerd' && kaart.classList.contains('gereserveerd')) {
            magTonenStatus = true;
        } else if (huidigeStatusFilter === 'niet meer beschikbaar' && kaart.classList.contains('niet-beschikbaar')) {
            magTonenStatus = true;
        }

        let magTonenFormaat = false;
        if (huidigeFormaatFilter === 'Alles') magTonenFormaat = true;
        else if (kaart.dataset.formaat === huidigeFormaatFilter) magTonenFormaat = true;

        if (magTonenStatus && magTonenFormaat) {
            kaart.style.display = '';
        } else {
            kaart.style.display = 'none';
        }
    });
}

laadSchilderijen();
