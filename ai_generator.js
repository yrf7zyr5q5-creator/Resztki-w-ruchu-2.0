// Generator przepisów AI (OpenAI GPT)
let openaiApiKey = '';

// Generuj przepis z AI
async function generateRecipeWithAI(ingredients) {
    openaiApiKey = document.getElementById('openaiKeyInput').value.trim();
    
    if (!openaiApiKey) {
        return {
            error: true,
            message: '⚠️ Wpisz klucz API OpenAI!'
        };
    }
    
    const ingredientsList = Array.from(ingredients).join(', ');
    
    const prompt = `Jesteś ekspertem kulinarnym. Stwórz prosty, studencki przepis używając tych składników: ${ingredientsList}.

Odpowiedz TYLKO w formacie JSON (bez dodatkowego tekstu):
{
    "nazwa": "Nazwa przepisu",
    "skladniki": ["składnik 1 z ilością", "składnik 2 z ilością", ...],
    "czas": "X minut",
    "porcje": 2,
    "dieta": "standard/wegetariańska/wegańska",
    "instrukcje": [
        "Krok 1: szczegółowy opis",
        "Krok 2: szczegółowy opis",
        ...
    ],
    "wskazowki": "Dodatkowe wskazówki dla studenta"
}

Przepis powinien być:
- Prosty i szybki
- Dla studenta (tani, łatwy)
- Z dokładnymi krokami
- Praktyczny`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Jesteś ekspertem kulinarnym tworzącym proste przepisy dla studentów. Odpowiadasz TYLKO w formacie JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                return { error: true, message: '❌ Nieprawidłowy klucz API OpenAI!' };
            } else if (response.status === 429) {
                return { error: true, message: '❌ Przekroczono limit zapytań!' };
            } else {
                return { error: true, message: `❌ Błąd API: ${response.status}` };
            }
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Wyciągnij JSON z odpowiedzi (czasem AI dodaje tekst przed/po)
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { error: true, message: '❌ AI nie zwróciło poprawnego formatu' };
        }
        
        const recipe = JSON.parse(jsonMatch[0]);
        
        // Dodaj dodatkowe pola
        recipe.id = Date.now();
        recipe.fromAI = true;
        recipe.lunchbox = true;
        recipe.cena_restauracja = Math.floor(Math.random() * 15) + 25;
        recipe.posilek = 'obiad';
        
        return { error: false, recipe: recipe };
        
    } catch (error) {
        console.error('AI Error:', error);
        return {
            error: true,
            message: '❌ Błąd połączenia z OpenAI. Sprawdź klucz API i internet.'
        };
    }
}

// Wyświetl przepis wygenerowany przez AI
function displayAIRecipe(recipe) {
    const modal = document.getElementById('recipeModal');
    const detailsDiv = document.getElementById('recipeDetails');
    
    modal.classList.add('show');
    
    let html = '';
    
    // Badge AI
    html += `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">`;
    html += `🤖 Przepis wygenerowany przez AI`;
    html += `</div>`;
    
    // Tytuł
    html += `<h2 class="recipe-detail-title">${recipe.nazwa}</h2>`;
    
    // Meta
    html += `<div class="recipe-detail-meta">`;
    html += `<div class="recipe-detail-meta-item">⏱️ ${recipe.czas}</div>`;
    html += `<div class="recipe-detail-meta-item">🍽️ ${recipe.porcje} porcje</div>`;
    html += `<div class="recipe-detail-meta-item">🥗 ${recipe.dieta}</div>`;
    html += `</div>`;
    
    // Składniki
    html += `<div class="recipe-section">`;
    html += `<h3>📝 Składniki:</h3>`;
    html += `<ul class="ingredients-list">`;
    recipe.skladniki.forEach(ing => {
        html += `<li>${ing}</li>`;
    });
    html += `</ul></div>`;
    
    // Instrukcje
    if (recipe.instrukcje && recipe.instrukcje.length > 0) {
        html += `<div class="recipe-section">`;
        html += `<h3>👨‍🍳 Instrukcje krok po kroku:</h3>`;
        html += `<ol class="instructions-list">`;
        recipe.instrukcje.forEach(krok => {
            html += `<li>${krok}</li>`;
        });
        html += `</ol></div>`;
    }
    
    // Wskazówki
    if (recipe.wskazowki) {
        html += `<div class="recipe-section">`;
        html += `<div class="alert alert-success">`;
        html += `<h3 style="margin-bottom: 10px;">💡 Wskazówki:</h3>`;
        html += `<p>${recipe.wskazowki}</p>`;
        html += `</div></div>`;
    }
    
    // Oszczędności
    html += `<div class="recipe-section">`;
    html += `<div class="savings-box">`;
    html += `<h3 style="margin-bottom: 10px;">💰 Oszczędności</h3>`;
    html += `<p style="font-size: 1.2em; margin: 10px 0;">Gotując w domu zaoszczędzisz około:</p>`;
    html += `<p style="font-size: 2.5em; font-weight: bold; color: #48bb78; margin: 10px 0;">${recipe.cena_restauracja} zł</p>`;
    html += `<p style="font-size: 0.95em; color: #718096;">w porównaniu z restauracją/dostawą</p>`;
    html += `</div></div>`;
    
    // Przyciski
    html += `<div style="display: flex; gap: 10px; margin-top: 20px;">`;
    html += `<button class="recipe-button" style="flex: 1;" onclick='addToFavorites(${JSON.stringify(recipe).replace(/'/g, "&#39;")})'>⭐ Dodaj do ulubionych</button>`;
    html += `<button class="recipe-button" style="flex: 1; background: #48bb78;" onclick='showCongratulationsFromModal(${JSON.stringify({id: recipe.id, nazwa: recipe.nazwa, cena_restauracja: recipe.cena_restauracja, brakujace: []}).replace(/'/g, "&#39;")})'>🎉 Robię to!</button>`;
    html += `</div>`;
    
    detailsDiv.innerHTML = html;
}

// Generuj przepis - główna funkcja
async function generateRecipe() {
    if (wybraneSkładniki.size === 0) {
        alert('⚠️ Wybierz przynajmniej jeden składnik!');
        return;
    }
    
    // Pokaż loading
    const modal = document.getElementById('recipeModal');
    const detailsDiv = document.getElementById('recipeDetails');
    modal.classList.add('show');
    detailsDiv.innerHTML = `
        <div class="loading" style="padding: 60px; text-align: center;">
            <h2>🤖 AI generuje przepis...</h2>
            <p style="margin-top: 20px;">To może potrwać 10-20 sekund</p>
            <div style="margin-top: 30px; font-size: 3em;">🍳</div>
        </div>
    `;
    
    const result = await generateRecipeWithAI(wybraneSkładniki);
    
    if (result.error) {
        detailsDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
        return;
    }
    
    displayAIRecipe(result.recipe);
}
