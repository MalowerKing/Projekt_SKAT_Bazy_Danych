<script>
  // State for the mobile menu
  let isOpen = false;

  // Toggle function
  function toggleMenu() {
    isOpen = !isOpen;
  }

  // Close menu when a link is clicked (UX best practice)
  function closeMenu() {
    isOpen = false;
  }
</script>

<nav>
  <div class="logo">
    <a href="/">MyBrand</a>
  </div>

  <button 
    class="hamburger" 
    on:click={toggleMenu} 
    aria-label="Toggle menu"
    aria-expanded={isOpen}
  >
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </button>

  <div class="nav-links {isOpen ? 'active' : ''}">
    <ul>
      <li><a href="/" on:click={closeMenu}>Home</a></li>
        <li><a href="/Pages/O mnie" on:click={closeMenu}>O mnie</a></li>
        <li><a href="/Pages/Miejsca" on:click={closeMenu}>Miejsca</a></li>
        <li><a href="/Pages/Turnieje" on:click={closeMenu}>Turnieje</a></li>
        <li><a href="/Pages/Rozgrywki" on:click={closeMenu}>Rozgrywki</a></li>
        <li><a href="/Pages/Rankingi" on:click={closeMenu}>Rankingi</a></li>
        <li><a href="/Pages/Role" on:click={closeMenu}>Role i uprawnienia</a></li>
    </ul>

    <a href="/login?" class="btn-register" on:click={closeMenu}>
      Zaloguj się
    </a>
  </div>
</nav>

<style>
  /* --- General Styling --- */
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #333;
    color: white;
    padding: 1rem 2rem;
    position: relative;
  }

  a {
    text-decoration: none;
    color: white;
    font-size: 1.1rem;
    transition: color 0.3s;
  }

  a:hover {
    color: #ff9900; /* Accent color */
  }

  .logo a {
    font-size: 1.5rem;
    font-weight: bold;
  }

  ul {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* --- Mobile Hamburger Button --- */
  .hamburger {
    display: none; /* Hidden on desktop */
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .hamburger .bar {
    width: 25px;
    height: 3px;
    background-color: white;
    border-radius: 2px;
  }

  /* --- Responsive Design (Mobile) --- */
  @media (max-width: 768px) {
    .hamburger {
      display: flex; /* Show button on mobile */
    }

    .nav-links {
      display: none; /* Hide links by default on mobile */
      width: 100%;
      position: absolute;
      top: 100%;
      left: 0;
      background-color: #444;
      flex-direction: column;
    }

    .nav-links.active {
      display: flex; /* Show links when 'active' class is added */
    }

    ul {
      flex-direction: column;
      width: 100%;
      gap: 0;
    }

    li {
      text-align: center;
      padding: 1rem 0;
      border-top: 1px solid #555;
    }

    li:hover {
      background-color: #555;
    }
  }

  /* --- Aktualizacja dla .nav-links --- */
  .nav-links {
    display: flex;
    align-items: center; /* Wyrównuje linki i przycisk w pionie */
    gap: 2rem; /* Odstęp między listą ul a przyciskiem */
  }

  /* --- Stylizacja przycisku Rejestracji --- */
  /* Wzorowane na klasie .btn-primary z Twojego +page.svelte */
  a.btn-register {
    background-color: #2563eb; /* Kolor z +page.svelte */
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    transition: background-color 0.2s;
    white-space: nowrap; /* Zapobiega łamaniu tekstu */
  }

  a.btn-register:hover {
    background-color: #1d4ed8; /* Ciemniejszy odcień przy hover */
    text-decoration: none;     /* Usuwa podkreślenie linku */
    color: white;
  }

  /* --- Aktualizacja dla wersji mobilnej (max-width: 768px) --- */
  @media (max-width: 768px) {
    .nav-links {
      /* Istniejące style... */
      display: none;
      width: 100%;
      position: absolute;
      top: 100%;
      left: 0;
      background-color: #444;
      flex-direction: column;
      align-items: center; /* Wyśrodkowanie elementów w pionie */
      padding-bottom: 1rem; /* Margines na dole dla przycisku */
      gap: 1rem; /* Odstęp wewnątrz menu mobilnego */
    }

    .nav-links.active {
      display: flex;
    }
    
    /* Drobna poprawka, aby przycisk nie był zbyt szeroki na telefonie */
    a.btn-register {
      width: 80%;       /* Szeroki przycisk na mobilkach */
      text-align: center;
      margin-top: 1rem;
    }
  }
</style>