import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';  // importujemy axios
import './Navbar.css';

const Navbar = ({ loggedIn, handleLogout, onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('searchTerm') || '');
  const [isAdmin, setIsAdmin] = useState(false);  // stan do przechowywania informacji o adminie

  // Pobranie danych o użytkowniku i sprawdzenie, czy jest administratorem
  useEffect(() => {
    const fetchUserData = async () => {
      try {
    const response = await fetch('http://localhost:5000/user-data', {
      method: 'GET',
      credentials: 'include', // Używamy credentials: 'include'
    });
    const data = await response.json();
    
    console.log('Otrzymane dane użytkownika:', data.user);
        // Jeśli zapytanie zakończyło się powodzeniem, ustawiamy isAdmin na wartość z odpowiedzi
        setIsAdmin(data.user.isAdmin);  // załóżmy, że API zwraca { isAdmin: true/false }
      } catch (error) {
        console.error('Błąd przy pobieraniu danych użytkownika', error);
      }
    };

    if (loggedIn) {
      fetchUserData();
    }
  }, [loggedIn]);  // uruchamia się, gdy zmieni się stan loggedIn

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value.trim());
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Strona główna</Link>

        {isAdmin && (
          <Link to="/admin" className="navbar-link">Panel Admina</Link>  
        )}

        {loggedIn ? (
          <>
            <a onClick={handleLogout}>Wyloguj</a>
            <Link to="/konto">Konto</Link>
          </>
        ) : (
          <>
            <Link to="/logowanie">Logowanie</Link>
            <Link to="/rejestracja">Rejestracja</Link>
          </>
        )}
      </div>
      <div className="navbar-right">
        <input
          type="text"
          placeholder="Szukaj produktów"
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        <Link to="/koszyk">Koszyk</Link>
      </div>
    </nav>
  );
};

export default Navbar;
