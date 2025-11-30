// Spoonacular API
let currentSource = 'local'; // 'local' lub 'api'
let apiKey = '';

// Słownik tłumaczeń PL -> EN
const translationDict = {
    'makaron': 'pasta',
    'ryż': 'rice',
    'jajka': 'eggs',
    'ser żółty': 'cheese',
    'chleb': 'bread',
    'cebula': 'onion',
    'czosnek': 'garlic',
    'pomidor': 'tomato',
    'ziemniaki': 'potatoes',
    'masło': 'butter',
    'oliwa': 'olive oil',
    'śmietana': 'cream',
    'mleko': 'milk',
    'mąka': 'flour',
    'twaróg': 'cottage cheese',
    'szynka': 'ham',
    'kurczak': 'chicken',
    'boczek': 'bacon',
    'tofu': 'tofu',
    'papryka': 'bell pepper',
    'ogórek': 'cucumber',
    'sos sojowy': 'soy sauce',
    'dżem': 'jam',
    'jogurt': 'yogurt',
    'majonez': 'mayonnaise',
    'pomidory w puszce': 'canned tomatoes',
    'ser feta': 'feta cheese',
    'pesto': 'pesto',
    'tortilla': 'tortilla',
    'kasza gryczana': 'buckwheat',
    'płatki owsiane': 'oats',
    'fasola czerwona': 'red beans',
    'ciecierzyca w puszce': 'chickpeas',
    'tuńczyk w puszce': 'canned tuna',
    'kukurydza': 'corn',
    'pieczarki': 'mushrooms',
    'szpinak mrożony': 'frozen spinach'
};

// Przełącz źródło
function switchSource(source) {
    currentSource = source;
    
    const btnLocal = document.getElementById('btnLocal');
    const btnAPI = document.getElementById('btnAPI');
    const apiKeySection = document.getElementById('apiKeySection');
    
    if (source === 'local') {
        btnLocal.classList.add('active');
        btnAPI.classList.remove('active');
        apiKeySection.style.display = 'none';
    } else {
        btnLocal.classList.remove('active');
        btnAPI.classList.add('active');
        apiKeySection.style.display = 'block';
    }
}

// Tłumacz składniki na angielski
function translateIngredients(ingredients) {
    return Array.from(ingredients).map(ing => translationDict[ing] || ing);
}

// Wyszukaj przepisy przez API
async function searchRecipesAPI(ingredients, filters) {
    apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        return {
            error: true,
            message: '⚠️ Wpisz klucz API Spoonacular!'
        };
    }
    
    const ingredientsEN = translateIngredients(ingredients);
    const ingredientsStr = ingredientsEN.join(',');
    
    let url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${ingredientsStr}&number=20&ranking=2&ignorePantry=false`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                return { error: true, message: '❌ Nieprawidłowy klucz API!' };
            } else if (response.status === 402) {
                return { error: true, message: '❌ Przekroczono limit zapytań (150/dzień)!' };
            } else {
                return { error: true, message: '❌ Błąd API: ' + response.status };
            }
        }
        
        const recipes = await response.json();
        
        // Pobierz szczegóły dla każdego przepisu (aby mieć czas, dietę, etc.)
        const recipesWithDetails = await Promise.all(
            recipes.slice(0, 15).map(async recipe => {
                const details = await getRecipeDetails(recipe.id);
                return {
                    ...recipe,
                    details: details
                };
            })
        );
        
        // Filtruj według wybranych filtrów
        let filtered = recipesWithDetails;
        
        if (filters.vegetarian) {
            filtered = filtered.filter(r => r.details && (r.details.vegetarian || r.details.vegan));
        }
        
        if (filters.quick) {
            filtered = filtered.filter(r => r.details && r.details.readyInMinutes <= 15);
        }
        
        // Konwertuj na format lokalny
        const converted = filtered.map(recipe => convertAPIRecipe(recipe, ingredients));
        
        return { error: false, recipes: converted };
        
    } catch (error) {
        console.error('API Error:', error);
        return {
            error: true,
            message: '❌ Błąd połączenia z API. Sprawdź internet i klucz API.'
        };
    }
}

// Pobierz szczegóły przepisu
async function getRecipeDetails(recipeId) {
    if (!apiKey) return null;
    
    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&includeNutrition=false`
        );
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}

// Konwertuj przepis z API na format lokalny
function convertAPIRecipe(apiRecipe, userIngredients) {
    const details = apiRecipe.details || {};
    
    // Oblicz dopasowanie
    const usedIngredients = apiRecipe.usedIngredients || [];
    const missedIngredients = apiRecipe.missedIngredients || [];
    const totalIngredients = usedIngredients.length + missedIngredients.length;
    const matchPercent = totalIngredients > 0 ? (usedIngredients.length / totalIngredients) * 100 : 0;
    
    return {
        id: apiRecipe.id,
        nazwa: apiRecipe.title,
        skladniki: usedIngredients.map(ing => ing.name),
        brakujace: missedIngredients.map(ing => ing.name),
        czas: details.readyInMinutes ? `${details.readyInMinutes} min` : 'nieznany',
        porcje: details.servings || 2,
        lunchbox: true,
        dieta: details.vegan ? 'wegańska' : (details.vegetarian ? 'wegetariańska' : 'standard'),
        cena_restauracja: Math.floor(Math.random() * 15) + 25,
        image: apiRecipe.image,
        sourceUrl: details.sourceUrl,
        procent: matchPercent,
        fromAPI: true,
        details: details
    };
}

// Pokaż szczegóły przepisu
async function showRecipeDetails(recipe) {
    const modal = document.getElementById('recipeModal');
    const detailsDiv = document.getElementById('recipeDetails');
    
    modal.classList.add('show');
    detailsDiv.innerHTML = '<div class="loading">Ładowanie przepisu</div>';
    
    if (recipe.fromAPI) {
        // Pobierz pełne szczegóły z API
        const details = await getRecipeDetails(recipe.id);
        
        if (!details) {
            detailsDiv.innerHTML = '<div class="alert alert-error">❌ Nie udało się pobrać szczegółów przepisu</div>';
            return;
        }
        
        displayRecipeDetails(details, recipe);
    } else {
        // Lokalny przepis - pokaż podstawowe info
        displayLocalRecipe(recipe);
    }
}

// Wyświetl szczegóły przepisu z API
function displayRecipeDetails(details, recipe) {
    const detailsDiv = document.getElementById('recipeDetails');
    
    let html = '';
    
    // Zdjęcie
    if (details.image) {
        html += `<img src="${details.image}" alt="${details.title}" class="recipe-detail-image">`;
    }
    
    // Tytuł
    html += `<h2 class="recipe-detail-title">${details.title}</h2>`;
    
    // Meta informacje
    html += `<div class="recipe-detail-meta">`;
    html += `<div class="recipe-detail-meta-item">⏱️ ${details.readyInMinutes} minut</div>`;
    html += `<div class="recipe-detail-meta-item">🍽️ ${details.servings} porcje</div>`;
    if (details.vegetarian) html += `<div class="recipe-detail-meta-item">🥗 Wegetariańskie</div>`;
    if (details.vegan) html += `<div class="recipe-detail-meta-item">🌱 Wegańskie</div>`;
    html += `</div>`;
    
    // Brakujące składniki (jeśli są)
    if (recipe.brakujace && recipe.brakujace.length > 0) {
        html += `<div class="recipe-section">`;
        html += `<div class="alert alert-warning">`;
        html += `<h3 style="margin-bottom: 10px;">🛒 Musisz dokupić:</h3>`;
        html += `<ul style="margin: 0; padding-left: 20px;">`;
        recipe.brakujace.forEach(ing => {
            html += `<li style="margin: 5px 0;">${ing}</li>`;
        });
        html += `</ul>`;
        html += `</div></div>`;
    } else {
        html += `<div class="recipe-section">`;
        html += `<div class="alert alert-success">`;
        html += `✨ <strong>Masz wszystkie składniki!</strong> Możesz zacząć gotować od razu!`;
        html += `</div></div>`;
    }
    
    // Składniki
    if (details.extendedIngredients && details.extendedIngredients.length > 0) {
        html += `<div class="recipe-section">`;
        html += `<h3>📝 Wszystkie składniki:</h3>`;
        html += `<ul class="ingredients-list">`;
        details.extendedIngredients.forEach(ing => {
            html += `<li>${ing.original}</li>`;
        });
        html += `</ul></div>`;
    }
    
    // Instrukcje
    if (details.analyzedInstructions && details.analyzedInstructions.length > 0) {
        const steps = details.analyzedInstructions[0].steps;
        if (steps && steps.length > 0) {
            html += `<div class="recipe-section">`;
            html += `<h3>👨‍🍳 Instrukcje krok po kroku:</h3>`;
            html += `<ol class="instructions-list">`;
            steps.forEach(step => {
                html += `<li>${step.step}</li>`;
            });
            html += `</ol></div>`;
        }
    } else if (details.instructions) {
        // Jeśli nie ma strukturyzowanych kroków, pokaż tekst
        html += `<div class="recipe-section">`;
        html += `<h3>👨‍🍳 Instrukcje:</h3>`;
        html += `<div style="line-height: 1.8;">${details.instructions}</div>`;
        html += `</div>`;
    }
    
    // Oszczędności
    const cena = recipe.cena_restauracja || 30;
    html += `<div class="recipe-section">`;
    html += `<div class="savings-box">`;
    html += `<h3 style="margin-bottom: 10px;">💰 Oszczędności</h3>`;
    html += `<p style="font-size: 1.2em; margin: 10px 0;">Gotując w domu zaoszczędzisz około:</p>`;
    html += `<p style="font-size: 2.5em; font-weight: bold; color: #48bb78; margin: 10px 0;">${cena} zł</p>`;
    html += `<p style="font-size: 0.95em; color: #718096;">w porównaniu z restauracją/dostawą (Wolt, Uber Eats)</p>`;
    html += `</div></div>`;
    
    // Link do źródła
    if (details.sourceUrl) {
        html += `<a href="${details.sourceUrl}" target="_blank" class="recipe-link">🔗 Zobacz oryginalny przepis</a>`;
    }
    
    // Przycisk "Robię to!"
    html += `<br><br>`;
    const recipeData = {
        id: recipe.id,
        nazwa: details.title,
        cena_restauracja: cena,
        brakujace: recipe.brakujace || []
    };
    html += `<button class="recipe-button" style="width: 100%; padding: 20px; font-size: 1.3em;" onclick='showCongratulationsFromModal(${JSON.stringify(recipeData)})'>🎉 Robię to!</button>`;
    
    detailsDiv.innerHTML = html;
}

// Wyświetl lokalny przepis
function displayLocalRecipe(recipe) {
    const detailsDiv = document.getElementById('recipeDetails');
    
    let html = `<h2 class="recipe-detail-title">${recipe.nazwa}</h2>`;
    
    html += `<div class="recipe-detail-meta">`;
    html += `<div class="recipe-detail-meta-item">⏱️ ${recipe.czas}</div>`;
    html += `<div class="recipe-detail-meta-item">🍽️ ${recipe.porcje} porcje</div>`;
    html += `<div class="recipe-detail-meta-item">🥗 ${recipe.dieta}</div>`;
    if (recipe.lunchbox) html += `<div class="recipe-detail-meta-item">📦 Lunchbox</div>`;
    html += `</div>`;
    
    // Brakujące składniki (oblicz na podstawie wybranych)
    const brakujace = [];
    if (recipe.skladniki) {
        recipe.skladniki.forEach(skladnik => {
            if (!wybraneSkładniki.has(skladnik)) {
                brakujace.push(skladnik);
            }
        });
    }
    
    if (brakujace.length > 0) {
        html += `<div class="recipe-section">`;
        html += `<div class="alert alert-warning">`;
        html += `<h3 style="margin-bottom: 10px;">🛒 Musisz dokupić:</h3>`;
        html += `<ul style="margin: 0; padding-left: 20px;">`;
        brakujace.forEach(ing => {
            html += `<li style="margin: 5px 0;">${ing}</li>`;
        });
        html += `</ul>`;
        html += `</div></div>`;
    } else {
        html += `<div class="recipe-section">`;
        html += `<div class="alert alert-success">`;
        html += `✨ <strong>Masz wszystkie składniki!</strong> Możesz zacząć gotować od razu!`;
        html += `</div></div>`;
    }
    
    html += `<div class="recipe-section">`;
    html += `<h3>📝 Składniki:</h3>`;
    html += `<ul class="ingredients-list">`;
    recipe.skladniki.forEach(ing => {
        html += `<li>${ing}</li>`;
    });
    html += `</ul></div>`;
    
    // Instrukcje krok po kroku (jeśli są)
    if (recipe.instrukcje && recipe.instrukcje.length > 0) {
        html += `<div class="recipe-section">`;
        html += `<h3>👨‍🍳 Instrukcje krok po kroku:</h3>`;
        html += `<ol class="instructions-list">`;
        recipe.instrukcje.forEach(krok => {
            html += `<li>${krok}</li>`;
        });
        html += `</ol></div>`;
    } else {
        html += `<div class="alert alert-warning">`;
        html += `ℹ️ To prosty przepis studencki. Przygotuj składniki i gotuj według własnego doświadczenia!`;
        html += `</div>`;
    }
    
    // Oszczędności
    const cena = recipe.cena_restauracja || 30;
    html += `<div class="recipe-section">`;
    html += `<div class="savings-box">`;
    html += `<h3 style="margin-bottom: 10px;">💰 Oszczędności</h3>`;
    html += `<p style="font-size: 1.2em; margin: 10px 0;">Gotując w domu zaoszczędzisz około:</p>`;
    html += `<p style="font-size: 2.5em; font-weight: bold; color: #48bb78; margin: 10px 0;">${cena} zł</p>`;
    html += `<p style="font-size: 0.95em; color: #718096;">w porównaniu z restauracją/dostawą (Wolt, Uber Eats)</p>`;
    html += `</div></div>`;
    
    const recipeData = {
        id: recipe.id,
        nazwa: recipe.nazwa,
        cena_restauracja: cena,
        brakujace: brakujace
    };
    html += `<button class="recipe-button" style="width: 100%; padding: 20px; font-size: 1.3em;" onclick='showCongratulationsFromModal(${JSON.stringify(recipeData)})'>🎉 Robię to!</button>`;
    
    detailsDiv.innerHTML = html;
}

// Zamknij modal przepisu
function closeRecipeModal() {
    const modal = document.getElementById('recipeModal');
    modal.classList.remove('show');
}

// Zamknij modal po kliknięciu poza nim
document.addEventListener('click', (e) => {
    const modal = document.getElementById('recipeModal');
    if (e.target === modal) {
        closeRecipeModal();
    }
});


// Pokaż gratulacje z modala przepisu
function showCongratulationsFromModal(recipeData) {
    // Zamknij modal przepisu
    closeRecipeModal();
    
    // Poczekaj chwilę na animację
    setTimeout(() => {
        const cena = recipeData.cena_restauracja || 30;
        const brakujace = recipeData.brakujace || [];
        
        let message = `<div class="modal-title">🎉 ${brakujace.length === 0 ? 'Brawo!' : 'Świetny wybór!'}</div>`;
        message += `<div class="modal-text">`;
        message += `<strong>Gotujesz: ${recipeData.nazwa}</strong><br><br>`;
        message += `💰 <strong>Zaoszczędzisz około ${cena} zł</strong><br>`;
        message += `(w porównaniu z restauracją/dostawą)<br><br>`;
        
        if (brakujace.length > 0) {
            message += `📝 Pamiętaj dokupić: ${brakujace.slice(0, 3).join(', ')}<br>`;
            if (brakujace.length > 3) {
                message += `<em>(i ${brakujace.length - 3} więcej)</em><br>`;
            }
            message += `<br>`;
        }
        
        message += `✨ ${brakujace.length === 0 ? 'Nie zmarnowałaś jedzenia z lodówki!' : 'Wykorzystujesz to, co masz w lodówce!'}<br>`;
        message += `🌍 Pomagasz środowisku!<br>`;
        if (brakujace.length === 0) {
            message += `💪 Rozwijasz swoje umiejętności kulinarne!`;
        }
        message += `</div>`;
        message += `<button class="modal-close" onclick="closeCongratsModal()">OK</button>`;
        
        // Pokaż modal gratulacji
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'congratsModal';
        modal.innerHTML = `<div class="modal-content">${message}</div>`;
        modal.onclick = (e) => {
            if (e.target === modal) closeCongratsModal();
        };
        
        document.body.appendChild(modal);
    }, 300);
}

// Zamknij modal gratulacji
function closeCongratsModal() {
    const modal = document.getElementById('congratsModal');
    if (modal) {
        modal.remove();
    }
}
