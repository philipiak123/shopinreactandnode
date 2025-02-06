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
        const response = await axios.post('http://localhost:5000/login', { email, password });
        const { token, user } = response.data; // Odczytaj token i użytkownika z odpowiedzi

        localStorage.setItem('token', token); // Zapisz token w localStorage
        handleLogin(user); // Ustaw zalogowanego użytkownika

        setMessage('Zalogowano pomyślnie');
        navigate('/'); // Przekieruj użytkownika do strony głównej
    } catch (error) {
        console.log('Błąd:', error);
        if (error.request) {
            console.log('Błąd żądania:', error.request);
            setMessage('Brak odpowiedzi z serwera. Spróbuj ponownie później.');
        } else {
            console.log('Błąd konfiguracji:', error.message);
            setMessage('Wystąpił błąd podczas konfiguracji żądania. Spróbuj ponownie.');
        }
    }
};


    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ width: '400px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                <h2 style={{ textAlign: 'center' }}>Logowanie</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ marginBottom: '5px' }}>Email:</label>
                        <input
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ marginBottom: '5px' }}>Hasło:</label>
                        <input
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button style={{ width: '100%', padding: '10px', backgroundColor: 'green', color: 'white', borderRadius: '5px', border: 'none' }} type="submit">Zaloguj</button>
                </form>
                <p style={{ marginTop: '10px', textAlign: 'center' }}>Nie masz jeszcze konta? <Link to="/register">Zarejestruj się</Link></p>
                {message && <p style={{ marginTop: '10px', textAlign: 'center', color: 'red' }}>{message}</p>}
            </div>
        </div>
    );
};

export default LoginForm;
