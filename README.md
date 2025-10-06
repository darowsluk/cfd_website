# CFD – Centrum Formacji Duchowej (Dom Słowa)

Strona informacyjna (PL) o Domu Słowa: kalendarz wydarzeń, prowadzący, Słowo na Jutro, oraz pobieranie nagrań z rekolekcji po kodzie.

## Wymagania
- Node.js 18+
- Windows PowerShell (komendy poniżej)

## Szybki start

```powershell
# Instalacja zależności
npm install

# Start serwera (http://localhost:3000)
npm start
```

Try it:
- Wejdź na http://localhost:3000
- Sekcja „Kalendarz wydarzeń” i „Prowadzący” ładuje dane z API.
- „Słowo na Jutro” prowadzi do YouTube.
- Aby przetestować pobieranie nagrań, użyj kodu: `TEST-1234`.

## Jak dodać/edytować treści

- Wydarzenia: `data/events.json`
- Prowadzący: `data/directors.json`
- Kody dostępu → foldery: `data/codes.json`
- Pliki do pobrania umieszczaj w `downloads/<folder>` i zmapuj kod → folder w `codes.json`.

Przykład `codes.json`:
```json
{
  "ADWENT-2025": "adwent-2025",
  "WIELKI-POST": "wielki-post-2026"
}
```

Utwórz odpowiadające foldery w `downloads/` i skopiuj tam pliki audio.

## Ustawienia/bezpieczeństwo

- Endpoint POST `/api/download` pakuje wskazany folder ZIP-em i zwraca jako pobranie. Kod nie jest przechowywany w ciasteczkach.
- Lista kodów jest w pliku `data/codes.json` (dla prostoty). W produkcji rozważ bazę danych oraz kody jednorazowe.
- Serwowane są wyłącznie pliki z katalogu `downloads/`. Chronimy się przed traversal przez `path.normalize` i sprawdzenie `startsWith`.

## Struktura
```
public/        # frontend (index.html, styles.css, app.js)
data/          # events.json, directors.json, codes.json
downloads/     # katalogi z nagraniami
server.js      # serwer Express i API
package.json
```

## Rozwój

```powershell
# Auto-restart przy zmianach
npm run dev
```

Miłej pracy! Jeśli chcesz, mogę dodać panel edycji treści lub integrację z Google Calendar/YouTube API.