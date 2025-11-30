// Wybrane składniki
let wybraneSkładniki = new Set();

// Lista wszystkich składników
const wszystkieSkładniki = [
    'makaron', 'ryż', 'jajka', 'ser żółty', 'chleb',
    'cebula', 'czosnek', 'pomidor', 'ziemniaki', 'masło',
    'oliwa', 'śmietana', 'mleko', 'mąka', 'twaróg',
    'szynka', 'kurczak', 'boczek', 'tofu', 'papryka',
    'ogórek', 'sos sojowy', 'dżem', 'jogurt', 'majonez',
    'pomidory w puszce', 'ser feta', 'pesto', 'tortilla',
    'kasza gryczana', 'płatki owsiane', 'fasola czerwona', 'ciecierzyca w puszce',
    'tuńczyk w puszce', 'kukurydza', 'pieczarki', 'szpinak mrożony'
];

// Inicjalizacja - dodaj składniki do siatki
function initIngredients() {
    const grid = document.getElementById('ingredientsGrid');
    
    wszystkieSkładniki.forEach(składnik => {
        const item = document.createElement('div');
        item.className = 'ingredient-item';
        item.textContent = składnik.charAt(0).toUpperCase() + składnik.slice(1);
        item.onclick = () => toggleIngredient(składnik, item);
        grid.appendChild(item);
    });
}

// Przełącz składnik
function toggleIngredient(składnik, element) {
    if (wybraneSkładniki.has(składnik)) {
        wybraneSkładniki.delete(składnik);
        element.classList.remove('selected');
    } else {
        wybraneSkładniki.add(składnik);
        element.classList.add('selected');
    }
}

// Wyszukaj przepisy
async function searchRecipes() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    // Sprawdź czy wybrano składniki
    if (wybraneSkładniki.size === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-warning">⚠️ Wybierz przynajmniej jeden składnik!</div>';
        resultsSection.style.display = 'block';
        return;
    }
    
    // Pobierz filtry
    const filterVegetarian = document.getElementById('filterVegetarian').checked;
    const filterQuick = document.getElementById('filterQuick').checked;
    const filterLunchbox = document.getElementById('filterLunchbox').checked;
    
    const filters = {
        vegetarian: filterVegetarian,
        quick: filterQuick,
        lunchbox: filterLunchbox
    };
    
    // Jeśli używamy API
    if (currentSource === 'api') {
        resultsDiv.innerHTML = '<div class="loading">Szukam przepisów w API Spoonacular</div>';
        resultsSection.style.display = 'block';
        
        const result = await searchRecipesAPI(wybraneSkładniki, filters);
        
        if (result.error) {
            resultsDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
            return;
        }
        
        if (result.recipes.length === 0) {
            resultsDiv.innerHTML = '<div class="alert alert-error">😔 Nie znaleziono pasujących przepisów. Spróbuj zmienić składniki lub filtry.</div>';
        } else {
            resultsDiv.innerHTML = `<div class="alert alert-success">✅ Znaleziono ${result.recipes.length} przepisów z API!</div>`;
            
            result.recipes.forEach(recipe => {
                const card = createRecipeCard(recipe, recipe.brakujace || [], recipe.procent);
                resultsDiv.appendChild(card);
            });
        }
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Znajdź pasujące przepisy
    let pasujące = [];
    
    przepisy.forEach(przepis => {
        // Sprawdź filtry
        if (filterVegetarian && przepis.dieta !== 'wegetariańska' && przepis.dieta !== 'wegańska') {
            return;
        }
        if (filterQuick && przepis.czas !== 'do 15 min') {
            return;
        }
        if (filterLunchbox && !przepis.lunchbox) {
            return;
        }
        
        // Sprawdź dopasowanie składników (minimum 50%)
        const składnikiPrzepisu = new Set(przepis.skladniki);
        const posiadane = new Set([...wybraneSkładniki].filter(x => składnikiPrzepisu.has(x)));
        const procent = (posiadane.size / składnikiPrzepisu.size) * 100;
        
        if (procent >= 50) {
            const brakujące = [...składnikiPrzepisu].filter(x => !wybraneSkładniki.has(x));
            pasujące.push({
                przepis: przepis,
                brakujące: brakujące,
                procent: procent
            });
        }
    });
    
    // Sortuj według procentu dopasowania
    pasujące.sort((a, b) => b.procent - a.procent);
    
    // Wyświetl wyniki
    if (pasujące.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-error">😔 Nie znaleziono pasujących przepisów. Spróbuj zmienić składniki lub filtry.</div>';
    } else {
        resultsDiv.innerHTML = `<div class="alert alert-success">✅ Znaleziono ${pasujące.length} przepisów!</div>`;
        
        pasujące.forEach(item => {
            const card = createRecipeCard(item.przepis, item.brakujące, item.procent);
            resultsDiv.appendChild(card);
        });
    }
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Utwórz kartę przepisu
function createRecipeCard(przepis, brakujące, procent) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Tytuł
    const title = document.createElement('div');
    title.className = 'recipe-title';
    title.textContent = `🍽️ ${przepis.nazwa}`;
    card.appendChild(title);
    
    // Informacje
    const info = document.createElement('div');
    info.className = 'recipe-info';
    let infoText = `⏱️ ${przepis.czas} | 🍽️ ${przepis.porcje} porcje | 🥗 ${przepis.dieta}`;
    if (przepis.lunchbox) {
        infoText += ' | 📦 Lunchbox';
    }
    info.textContent = infoText;
    card.appendChild(info);
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${procent}%`;
    progressBar.appendChild(progressFill);
    card.appendChild(progressBar);
    
    // Dopasowanie
    const match = document.createElement('div');
    match.className = 'recipe-match';
    match.textContent = `✅ Dopasowanie: ${Math.round(procent)}%`;
    card.appendChild(match);
    
    // Brakujące składniki
    const missing = document.createElement('div');
    missing.className = 'recipe-missing';
    if (brakujące.length > 0) {
        missing.textContent = `❌ Brakuje: ${brakujące.slice(0, 5).join(', ')}`;
        if (brakujące.length > 5) {
            missing.textContent += ` (+${brakujące.length - 5} więcej)`;
        }
    } else {
        missing.textContent = '✨ Masz wszystkie składniki!';
        missing.style.color = '#48bb78';
    }
    card.appendChild(missing);
    
    // Przyciski
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '10px';
    buttonsDiv.style.flexWrap = 'wrap';
    
    const detailsButton = document.createElement('button');
    detailsButton.className = 'recipe-button';
    detailsButton.textContent = '📖 Zobacz przepis';
    detailsButton.style.flex = '1';
    detailsButton.onclick = () => showRecipeDetails(przepis);
    buttonsDiv.appendChild(detailsButton);
    
    const cookButton = document.createElement('button');
    cookButton.className = 'recipe-button';
    cookButton.textContent = '🎉 Robię to!';
    cookButton.style.flex = '1';
    cookButton.style.background = '#48bb78';
    cookButton.onclick = () => showCongratulations(przepis, brakujące);
    buttonsDiv.appendChild(cookButton);
    
    card.appendChild(buttonsDiv);
    
    return card;
}

// Pokaż gratulacje
function showCongratulations(przepis, brakujące) {
    const cena = przepis.cena_restauracja || 30;
    
    let message = `<div class="modal-title">🎉 ${brakujące.length === 0 ? 'Brawo!' : 'Świetny wybór!'}</div>`;
    message += `<div class="modal-text">`;
    message += `<strong>Gotujesz: ${przepis.nazwa}</strong><br><br>`;
    message += `💰 <strong>Zaoszczędziłaś około ${cena} zł</strong><br>`;
    message += `(w porównaniu z restauracją/dostawą)<br><br>`;
    
    if (brakujące.length > 0) {
        message += `📝 Pamiętaj dokupić: ${brakujące.slice(0, 3).join(', ')}<br><br>`;
    }
    
    message += `✨ ${brakujące.length === 0 ? 'Nie zmarnowałaś jedzenia z lodówki!' : 'Wykorzystujesz to, co masz w lodówce!'}<br>`;
    message += `🌍 Pomagasz środowisku!<br>`;
    if (brakujące.length === 0) {
        message += `💪 Rozwijasz swoje umiejętności kulinarne!`;
    }
    message += `</div>`;
    message += `<button class="modal-close" onclick="closeModal()">OK</button>`;
    
    // Pokaż modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'congratsModal';
    modal.innerHTML = `<div class="modal-content">${message}</div>`;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    document.body.appendChild(modal);
}

// Zamknij modal
function closeModal() {
    const modal = document.getElementById('congratsModal');
    if (modal) {
        modal.remove();
    }
}

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', initIngredients);
