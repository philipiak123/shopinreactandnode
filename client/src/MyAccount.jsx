import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './MyAccount.css';

const MyAccount = ({ loggedIn, userData }) => {
  const [email, setEmail] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (userData) {
      setEmail(userData.email);
      setUserDetails({
        name: userData.name,
        email: userData.email,
        password: '',
      });
      fetchOrders(userData.id);
    }
  }, [userData]);

  const fetchOrders = (userId) => {
    axios.post('http://localhost:5000/orders', { userId })
      .then(response => {
        setOrders(response.data);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/users/${userData.id}`, userDetails)
      .then(response => {
        setMessage('Dane zostały zaktualizowane');
      })
      .catch(error => {
        setMessage('Błąd podczas aktualizacji danych');
        console.error('Błąd aktualizacji danych: ', error);
      });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentPassword') {
      setCurrentPassword(value);
    } else if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Nowe hasło i potwierdzenie hasła nie są zgodne');
    } else {
      axios.post(`http://localhost:5000/changepass`, {
        userId: userData.id,
        currentPassword,
        newPassword
      })
        .then(response => {
          if (response.status === 200) {
            setMessage('Hasło zostało zmienione');
            handleCloseModal();
          } else {
            setMessage('Nieoczekiwany błąd podczas zmiany hasła');
            console.error('Nieoczekiwany błąd:', response);
          }
        })
        .catch(error => {
          if (error.response && error.response.status === 400) {
            setMessage('Podane obecne hasło jest niepoprawne');
          } else if (error.response && error.response.status === 500) {
            setMessage('Błąd serwera. Spróbuj ponownie później.');
          } else {
            setMessage('Nieoczekiwany błąd podczas zmiany hasła');
            console.error('Nieoczekiwany błąd:', error);
          }
        });
    }
  };

  const formatDateTime = (isoDate) => {
    const dateObj = new Date(isoDate);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return dateObj.toLocaleDateString('pl-PL', options);
  };

  return (
    <div className="my-account">
      <h2>Moje Konto</h2>
      {loggedIn ? (
        <div className="account-details">
          <p><strong>Email:</strong> {email}</p>
          <button onClick={handleOpenModal} className="change-password-button">Zmień hasło</button>
          <h3>Zamówienia:</h3>
          <div className="orders-table-container"> {/* Kontener dla tabeli */}
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Numer zamówienia</th>
                  <th>Nazwa produktu</th>
                  <th>Ilość</th>
                  <th>Suma całkowita</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <ul>
                        {JSON.parse(order.data).map(item => (
                          <li key={item.id}>{item.name}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul>
                        {JSON.parse(order.data).map(item => (
                          <li key={item.id}>{item.quantity}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      {JSON.parse(order.data).reduce((sum, item) => sum + item.cena * item.quantity, 0).toFixed(2)}
                    </td>
                    <td>{order.status}</td>
                    <td>{formatDateTime(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>Proszę się zalogować, aby zobaczyć swoje konto.</p>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        className="password-modal"
        overlayClassName="password-modal-overlay"
      >
        <h2>Zmień hasło</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Obecne hasło:</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Nowe hasło:</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <button type="submit" className="update-password-button">Zmień hasło</button>
          {message && <p className="message">{message}</p>}
        </form>
      </Modal>
    </div>
  );
};

export default MyAccount;
