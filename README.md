Dokumentacja Backendowa i Struktura Bazy Danych

Ten dokument opisuje architekturę backendową, schemat bazy danych oraz zależności między encjami w projekcie systemu obsługi rozgrywek (Skat/Karty). Projekt oparty jest na SvelteKit z wykorzystaniem Drizzle **ORM** oraz bazy danych MySQL. 🛠️ Stos Technologiczny (Backend)

    Runtime: Node.js (przez SvelteKit Server)

    Baza Danych: MySQL

    **ORM**: Drizzle **ORM** - zarządzanie schematem i zapytaniami.

    Autoryzacja: Implementacja własna (Session-based) z wykorzystaniem plików cookie.

    Bezpieczeństwo:

        @node-rs/argon2: Hashowanie haseł.

        @oslojs/crypto & @oslojs/encoding: Generowanie tokenów sesji i ID.

🗄️ Schemat Bazy Danych i Relacje Shutterstock

Poniżej znajduje się diagram **ERD** (Entity Relationship Diagram) przedstawiający zależności (Klucze Obce) między tabelami w systemie. Fragment kodu

erDiagram
    **ROLE** ||--o{ **USER** : *przypisana do*
    **USER** ||--o{ **SESSION** : *posiada*
    **USER** ||--o{ **GRA** : *uczestniczy (jako gracz 1-3 lub zwycięzca)*
    **USER** ||--o{ **TURNIEJ** : *tworzy / wygrywa*
    **USER** ||--o{ **ZAPROSZENIA** : *otrzymuje*
    **USER** ||--o{ LISTA_UCZESTNIKOW : *jest zapisany*
    
    **MIEJSCA** ||--o{ **GRA** : *miejsce rozgrywki*
    **MIEJSCA** ||--o{ **TURNIEJ** : *miejsce turnieju*
    
    **TURNIEJ** ||--o{ **GRA** : *zawiera gry*
    **TURNIEJ** ||--o{ **ZAPROSZENIA** : *dotyczy*
    **TURNIEJ** ||--o{ LISTA_UCZESTNIKOW : *posiada listę*

    **ROLE** {
    varchar id PK *np. #admin#, #player#*
    varchar uprawnienia *JSON*
    }

    **USER** {
    varchar id PK
    varchar nazwa UK
    varchar email UK
    varchar password_hash
    varchar role_id FK *-> **ROLE**.id*
    int elo *Ranking*
    }

    **SESSION** {
    varchar id PK
    varchar user_id FK *-> **USER**.id*
    datetime expires_at
    }

    **MIEJSCA** {
    varchar miejsca_id PK
    varchar nazwa
    varchar adres
    varchar miasto
    }

    **TURNIEJ** {
    varchar turniej_id PK
    varchar nazwa
    varchar miejsce_id FK *-> **MIEJSCA**.miejsca_id*
    varchar tworca_id FK *-> **USER**.id*
    varchar zwyciezca_id FK *-> **USER**.id*
    datetime data
    }

    **GRA** {
    varchar gra_id PK
    varchar gracz_id_1 FK *-> **USER**.id*
    varchar gracz_id_2 FK *-> **USER**.id*
    varchar gracz_id_3 FK *-> **USER**.id*
    varchar zwyciezca_id FK *-> **USER**.id*
    varchar miejsce_id FK *-> **MIEJSCA**.miejsca_id*
    varchar turniej_id FK *-> **TURNIEJ**.turniej_id*
    boolean is_ranked
    }

Szczegółowy opis zależności (Foreign Keys)

    Użytkownicy (user):

        Zależą od tabeli role (kolumna role_id). Domyślna rola to #player#.

        Relacja jeden-do-wielu z tabelą session. Usunięcie użytkownika kaskadowo unieważnia sesje (logika w kodzie).

    Gry (gra):

        Centralna tabela łącząca wiele encji.

        Gracze: Posiada 4 klucze obce do user (gracz_id_1, gracz_id_2, gracz_id_3, zwyciezca_id).

        Lokalizacja: Klucz obcy do miejsca (miejsce_id).

        Kontekst: Klucz obcy do turniej (turniej_id) - gra może (ale nie musi) być częścią turnieju.

    Turnieje (turniej):

        Powiązane z miejsca (miejsce_id).

        Powiązane z user na dwa sposoby: Twórca (tworca_id) oraz Zwycięzca (zwyciezca_id).

    Tabele łączące:

        zaproszenia: Łączy user i turniej.

        lista_uczestnikow_turniej: Łączy user i turniej, przechowując dodatkowo wynik (miejsce) danego gracza w turnieju.

⚙️ Logika Backendowa (Moduły)

Logika biznesowa została wydzielona do plików w src/lib/server/. ## Autoryzacja i Sesje (src/lib/server/auth.ts)

System nie używa zewnętrznych dostawców (jak Auth0).

    Tworzenie sesji: Generowanie losowego tokena, hashowanie go (**SHA**-**256**) i zapis do bazy.

    Walidacja: Odczyt ciasteczka auth-session, weryfikacja w bazie, odświeżanie sesji (przedłużanie expiresAt) jeśli jest bliska wygaśnięcia.

    Role i Uprawnienia: Podczas walidacji sesji pobierane są dane o roli użytkownika. Uprawnienia są przechowywane w bazie jako **JSON** string i parsowane w locie.

## System Rankingowy ELO (src/lib/server/elo-actions.ts)

Obsługa gier rankingowych (is_ranked = true).

    Wylicza prawdopodobieństwo wygranej na podstawie różnicy punktów **ELO**.

    Aktualizuje punkty **ELO** dla wszystkich 3 graczy po zakończeniu gry (zwycięzca zyskuje, przegrani tracą w zależności od relacji rankingów).

    Funkcje te są wywoływane w akcjach formularzy (+page.server.ts w routes/Pages/Rozgrywki).

## Obsługa Bazy Danych (src/lib/server/db/)

    Konfiguracja: index.ts tworzy pulę połączeń MySQL.

    Schema: schema.ts definiuje modele Drizzle. Wszystkie operacje na bazie są typowane (TypeScript).

🔄 Przepływ Danych (Actions)

Interakcja z backendem odbywa się głównie poprzez SvelteKit Form Actions w plikach +page.server.ts.

    Logowanie/Rejestracja: Weryfikacja hasła (Argon2), utworzenie sesji, ustawienie ciasteczka HttpOnly.

    Zarządzanie Turniejami:

        Tworzenie turnieju (**INSERT**).

        Generowanie drabinki (logika w elo-actions.ts).

        Usuwanie turnieju odbywa się w transakcji: najpierw usuwane są powiązania (gry, zaproszenia), a na końcu sam turniej, aby zachować spójność danych.

    Moderacja:

        Administratorzy mogą masowo usuwać użytkowników lub edytować ich dane (zmieniać role, hasła).

        Dostęp do tych akcji jest chroniony sprawdzeniem event.locals.user.role.

🚀 Uruchomienie deweloperskie

Wymagane zmienne środowiskowe w pliku .env: Fragment kodu

DATABASE_URL=*mysql://użytkownik:hasło@host:port/nazwa_bazy*

Komendy do zarządzania bazą danych (Drizzle Kit): Bash

# Generowanie plików migracyjnych na podstawie schema.ts

npm run db:generate

# Wypchnięcie zmian bezpośrednio do bazy (prototypowanie)

npm run db:push

# Uruchomienie Drizzle Studio (GUI do bazy)

npm run db:studio
