// LoginForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginForm = ({ handleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Wysyłanie zapytania logowania z withCredentials
    const response = await axios.post('http://localhost:5000/login', {
      email,
      password
    }, { withCredentials: true });

    setMessage('Zalogowano pomyślnie');

    // Wywołanie handleLogin z danymi użytkownika
    handleLogin(response.data.user);

    // Przekierowanie na stronę główną po zalogowaniu
    navigate('/');
  } catch (error) {
    // Obsługa błędów i wyświetlanie wiadomości o błędzie
    setMessage(error.response ? error.response.data.error : 'Błąd logowania');
  }
};


  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '400px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>Email:</label>
            <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '5px' }}>Hasło:</label>
            <input style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button style={{ width: '100%', padding: '10px', backgroundColor: 'green', color: 'white', borderRadius: '5px', border: 'none' }} type="submit">Zaloguj</button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>Nie masz jeszcze konta? <Link to="/rejestracja">Zarejestruj się</Link></p>
        {message && <p style={{ marginTop: '10px', textAlign: 'center', color: 'red' }}>{message}</p>}
      </div>
    </div>
  );
};

export default LoginForm;
