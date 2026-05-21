let dataset = [];
let currentImageIndex = 0;
let score = 0;
let streak = 0;

// UI Elementer
const imageElement = document.getElementById('oct-image');
const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const buttons = document.querySelectorAll('.btn-diagnose');
const feedbackPanel = document.getElementById('feedback-panel');
const feedbackText = document.getElementById('feedback-text');

// En lille medicinsk ordbog til at give pædagogisk feedback
const medicalDescriptions = {
    "NORMAL": "En normal OCT viser en intakt foveal kontur uden væske, druser eller nydannet karvæv. Alle retinale lag er ubrudte.",
    "CNV": "Choroidal Neovaskularisation (Våd AMD). Typisk ses subretinal eller intraretinal væske samt et hyperreflektivt kompleks under retina.",
    "DME": "Diabetisk Makulaødem. Karakteriseret ved intraretinale cystiske rum (væske) og fortykkelse af retina relateret til diabetes.",
    "DRUSEN": "Druser (Tør AMD). Viser sig som bølgende elevationer af RPE-laget (retinalt pigmentepitel) uden tilstedeværelse af væske."
};

// Start appen
initApp();

function initApp() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            dataset = data;
            // Bland arrayet igen i browseren for at være helt sikker på tilfældighed
            dataset.sort(() => Math.random() - 0.5);
            
            setupButtons();
            loadNextImage();
        })
        .catch(error => console.error("Fejl ved indlæsning:", error));
}

function setupButtons() {
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Hent den diagnose knappen repræsenterer
            const selectedDiag = this.getAttribute('data-diag');
            handleGuess(selectedDiag, this);
        });
    });
}

function loadNextImage() {
    if (currentImageIndex >= dataset.length) {
        currentImageIndex = 0; // Start forfra hvis vi løber tør
        dataset.sort(() => Math.random() - 0.5); // Bland igen
    }
    
    // Nulstil UI for det nye billede
    buttons.forEach(btn => {
        btn.classList.remove('correct', 'wrong', 'missed');
        btn.disabled = false;
    });
    feedbackPanel.style.display = 'none';
    
    // Indlæs billede
    const currentData = dataset[currentImageIndex];
    imageElement.src = currentData.image_url;
}

function handleGuess(selectedDiagnosis, clickedButton) {
    const currentData = dataset[currentImageIndex];
    const correctDiagnosis = currentData.correct_answer;

    // Lås knapperne så man ikke kan gætte flere gange
    buttons.forEach(btn => btn.disabled = true);

    if (selectedDiagnosis === correctDiagnosis) {
        // Korrekt gæt
        clickedButton.classList.add('correct');
        score++;
        streak++;
        feedbackText.innerHTML = `<strong>Korrekt!</strong><br><br>${medicalDescriptions[correctDiagnosis]}`;
    } else {
        // Forkert gæt
        clickedButton.classList.add('wrong');
        streak = 0;
        
        // Find den knap der faktisk var rigtig og marker den
        buttons.forEach(btn => {
            if (btn.getAttribute('data-diag') === correctDiagnosis) {
                btn.classList.add('missed');
            }
        });
        
        feedbackText.innerHTML = `<strong>Forkert.</strong> Det korrekte svar var <strong>${correctDiagnosis}</strong>.<br><br>${medicalDescriptions[correctDiagnosis]}`;
    }

    // Opdater stats
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;

    // Vis feedback panelet
    feedbackPanel.style.display = 'block';
    
    // Gør klar til næste index
    currentImageIndex++;
}