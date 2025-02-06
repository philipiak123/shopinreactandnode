const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors'); 
const multer = require('multer');
const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');
const fs = require('fs');
require('dotenv').config();  // Załaduj zmienne z .env

const app = express();
const port = 5000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // Użyj hasła z .env
  database: process.env.DB_NAME  // Użyj nazwy bazy danych z .env
});


app.use(bodyParser.json());
const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch: fetch });
const upload = multer({ dest: 'uploads/' });

// Konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:3000',  // URL Twojej aplikacji frontendowej
  credentials: true,  // Pozwól na wysyłanie ciasteczek
}));

// Konfiguracja sesji
app.use(session({
  secret: process.env.SESSION_SECRET,  // Klucz sesji z .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24 godziny
  }
}));


// Middleware do ustawiania nagłówków
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');  // Pozwól tylko na połączenia z tego źródła
  res.setHeader('Access-Control-Allow-Credentials', 'true');  // Pozwól na ciasteczka
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');  // Dozwolone metody
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // Dozwolone nagłówki
  next();
});

const convertToDl1Link = (url) => {
  if (url.includes('?dl=0')) {
    return url.replace('?dl=0', '?dl=1');
  }

  if (url.includes('?dl=1')) {
    return url;
  }

  if (url.includes('?')) {
    return url + '&dl=1';
  }

  return url + '?dl=1';
};
const checkAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next(); // Jeśli użytkownik jest administratorem, kontynuujemy
    } else {
        return res.status(403).json({ message: 'Brak uprawnień do wykonania tej operacji' });
    }
};
app.post('/products', checkAdmin, (req, res) => {
    const { name, producent, opis, cena } = req.body;

    // Tworzymy nowy produkt, ustawiając zdjęcia na pustą tablicę
    const newProduct = { name, producent, opis, cena, photos: JSON.stringify({ photos: [] }) };

    // Dodanie produktu do bazy danych
    db.query('INSERT INTO products SET ?', newProduct, (err, result) => {
        if (err) {
            console.error('Błąd przy dodawaniu produktu:', err);
            return res.status(500).json({ message: 'Błąd serwera' });
        }
        res.status(201).json({ id: result.insertId, ...newProduct });
    });
});

// Endpoint do przesyłania plików na Dropbox i dodawania URL do bazy
app.post('/upload', checkAdmin, upload.array('files'), async (req, res) => {
  const productId = req.body.productId;
  const files = req.files;

  try {
    // Zbieranie linków do plików
    const photoUrls = [];
    for (let file of files) {
      const fileContent = fs.readFileSync(file.path);
      const dropboxPath = `/products/${file.originalname}`;

      // Przesyłanie pliku do Dropbox
      const response = await dbx.filesUpload({
        path: dropboxPath,
        contents: fileContent
      });

      // Tworzenie publicznego linku
      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: response.result.path_display
      });

      // Zmiana linku z dl=0 na dl=1
      const photoUrl = convertToDl1Link(sharedLinkResponse.result.url);
      photoUrls.push(photoUrl);

      // Usuwanie pliku z serwera lokalnego
      fs.unlinkSync(file.path);
    }

    // Pobranie obecnych zdjęć z bazy
    db.query('SELECT photos FROM products WHERE id = ?', [productId], (err, results) => {
      if (err) {
        console.error('Błąd przy pobieraniu danych produktu:', err);
        return res.status(500).json({ message: 'Błąd przy pobieraniu danych produktu.' });
      }

      let photosData = { photos: [] };
      if (results.length > 0) {
        try {
          photosData = JSON.parse(results[0].photos);
        } catch (err) {
          console.error('Błąd przy parsowaniu JSON:', err);
        }
      }

      // Dodawanie nowych zdjęć do istniejących
      photosData.photos = photosData.photos.concat(photoUrls);

      // Zaktualizowanie bazy danych
      db.query('UPDATE products SET photos = ? WHERE id = ?', [JSON.stringify(photosData), productId], (err) => {
        if (err) {
          console.error('Błąd przy aktualizacji bazy:', err);
          return res.status(500).json({ message: 'Błąd przy aktualizacji bazy danych.' });
        }
        res.status(200).json({ message: 'Zdjęcia zostały dodane pomyślnie.' });
      });
    });
  } catch (err) {
    console.error('Błąd:', err);
    res.status(500).json({ message: 'Wystąpił błąd podczas przesyłania plików.' });
  }
});
app.post('/delete-photo/:productId', checkAdmin, (req, res) => {
  const productId = req.params.productId;
  const photoIndex = req.body.photoIndex;

  // Sprawdzamy, czy photoIndex jest dostępny
  if (photoIndex === undefined) {
    return res.status(400).json({ message: 'Brak indeksu zdjęcia do usunięcia.' });
  }

  // Pobranie obecnych zdjęć z bazy
  db.query('SELECT photos FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error('Błąd przy pobieraniu danych produktu:', err);
      return res.status(500).json({ message: 'Błąd przy pobieraniu danych produktu.' });
    }

    let photosData = { photos: [] };
    if (results.length > 0) {
      try {
        photosData = JSON.parse(results[0].photos);
      } catch (err) {
        console.error('Błąd przy parsowaniu JSON:', err);
      }
    }

    // Sprawdzamy, czy photoIndex jest poprawny
    if (photoIndex >= 0 && photoIndex < photosData.photos.length) {
      // Usunięcie zdjęcia z tablicy
      const deletedPhotoUrl = photosData.photos.splice(photoIndex, 1)[0];

      // Zaktualizowanie bazy danych
      db.query('UPDATE products SET photos = ? WHERE id = ?', [JSON.stringify(photosData), productId], (err) => {
        if (err) {
          console.error('Błąd przy aktualizacji bazy:', err);
          return res.status(500).json({ message: 'Błąd przy aktualizacji bazy danych.' });
        }

        // Usuwanie zdjęcia z Dropbox
        dbx.filesDeleteV2({ path: deletedPhotoUrl }).catch((err) => {
          console.error('Błąd przy usuwaniu zdjęcia z Dropbox:', err);
        });

        res.status(200).json({ message: 'Zdjęcie zostało usunięte.' });
      });
    } else {
      res.status(400).json({ message: 'Indeks zdjęcia jest niepoprawny.' });
    }
  });
});
app.get('/orders', checkAdmin, (req, res) => {
  const query = 'SELECT * FROM orders ORDER BY date DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd pobierania zamówień:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    res.json(results);
  });
});
app.put('/orders/:id/status', checkAdmin, (req, res) => {
  const orderId = req.params.id;
  const query = 'UPDATE orders SET status = "zrealizowane" WHERE id = ?';
  
  db.query(query, [orderId], (err) => {
    if (err) {
      console.error('Błąd aktualizacji statusu zamówienia:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    res.json({ message: 'Status zamówienia został zaktualizowany.' });
  });
});

app.post('/orders', (req, res) => {
  const { userId } = req.body;

  // Zapytanie do bazy danych w celu pobrania zamówień dla danego użytkownika
  const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Błąd pobierania zamówień z bazy danych:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    res.json(results);
  });
});
app.post('/changepass', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // Pobranie użytkownika z bazy danych na podstawie userId
    const getUserQuery = 'SELECT * FROM uzytkownicy WHERE id = ?';
    db.query(getUserQuery, [userId], async (err, results) => {
      if (err) {
        console.error('Błąd zapytania do bazy danych:', err);
        return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Użytkownik nie został znaleziony.' });
      }

      const user = results[0];

      // Sprawdzenie czy obecne hasło jest poprawne
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.pass);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Obecne hasło jest niepoprawne.' });
      }

      // Haszowanie nowego hasła przed zapisaniem do bazy danych
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Aktualizacja hasła użytkownika w bazie danych
      const updatePasswordQuery = 'UPDATE uzytkownicy SET pass = ? WHERE id = ?';
      db.query(updatePasswordQuery, [hashedPassword, userId], (updateErr) => {
        if (updateErr) {
          console.error('Błąd aktualizacji hasła w bazie danych:', updateErr);
          return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
        }
        res.json({ message: 'Hasło zostało pomyślnie zaktualizowane.' });
      });

    });
  } catch (error) {
    console.error('Błąd zmiany hasła:', error);
    res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM uzytkownicy WHERE email = ?', [email], async (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Błąd serwera' });
    } else if (result.length === 0) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    } else {
      const user = result[0];
      try {
        if (await bcrypt.compare(password, user.pass)) {
          // Przechowywanie ID użytkownika oraz roli admina w sesji
          req.session.userId = user.id;
          req.session.email = user.email;
          req.session.isAdmin = user.admin === 1; // Sprawdzanie, czy użytkownik jest adminem

          // Wypisanie danych sesji w konsoli
          console.log('Ustawiona sesja:', req.session);

          res.json({ message: 'Zalogowano pomyślnie', user });
        } else {
          res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
      }
    }
  });
});


app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Błąd podczas wylogowywania.' });
    }
    res.clearCookie('connect.sid'); // Usunięcie ciasteczka sesji
    res.json({ message: 'Wylogowano pomyślnie' });
  });
});

// Endpoint zwracający dane użytkownika na podstawie sesji
app.get('/user-data', (req, res) => {

  if (req.session.userId) {
    res.json({
      user: {
        id: req.session.userId,
        email: req.session.email,
        isAdmin: req.session.isAdmin
      }
    });
  } else {
    res.status(401).json({ error: 'Brak zalogowanego użytkownika' });
  }
});

app.put('/products/:id', (req, res) => {
  const productId = req.params.id;  // Pobranie id produktu z URL
  const { name, producent, opis, cena } = req.body;  // Pobranie danych z ciała żądania

  // Dodanie logów, aby zobaczyć co otrzymujemy
  console.log('Dane z formularza:', { name, producent, opis, cena });

  // Sprawdzenie, czy wszystkie wymagane dane zostały przesłane
  if (!name || !producent || !opis || !cena) {
    return res.status(400).json({ error: 'Wszystkie pola muszą być wypełnione.' });
  }

  // Zapytanie do bazy danych w celu zaktualizowania produktu
  const query = `
    UPDATE products 
    SET name = ?, producent = ?, opis = ?, cena = ? 
    WHERE id = ?`;

  db.query(query, [name, producent, opis, cena, productId], (err, result) => {
    if (err) {
      console.error('Błąd aktualizacji produktu w bazie danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkt nie został znaleziony.' });
    }

    res.json({ message: 'Produkt został pomyślnie zaktualizowany.' });
  });
});


app.put('/updatereview', (req, res) => {
  const { id, ocena, tresc } = req.body;

  // Sprawdź, czy ocena mieści się w przedziale od 1 do 5
  if (ocena < 1 || ocena > 5) {
    return res.status(400).json({ error: 'Ocena musi być w przedziale od 1 do 5.' });
  }

  // Aktualizacja opinii w bazie danych
  const query = 'UPDATE opinions SET ocena = ?, tresc = ? WHERE id = ?';
  db.query(query, [ocena, tresc, id], (err, result) => {
    if (err) {
      console.error('Błąd aktualizacji opinii w bazie danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Opinia nie została znaleziona.' });
    }
    res.json({ message: 'Opinia została pomyślnie zaktualizowana.' });
  });
});


app.post('/addreview', (req, res) => {
  const { id_produktu, id_usera, ocena, tresc } = req.body;

  // Sprawdź czy ocena mieści się w przedziale od 1 do 5
  if (ocena < 1 || ocena > 5) {
    return res.status(400).json({ error: 'Ocena musi być w przedziale od 1 do 5.' });
  }

  // Wstawienie opinii do bazy danych
  const query = 'INSERT INTO opinions (id_produktu, id_usera, ocena, tresc, data) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [id_produktu, id_usera, ocena, tresc], (err, result) => {
    if (err) {
      console.error('Błąd zapisu opinii do bazy danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    res.status(201).json({ message: 'Opinia została pomyślnie dodana.' });
  });
});
app.get('/deletereview/:reviewId', (req, res) => {
  const reviewId = req.params.reviewId;

  // Tutaj wykonujemy odpowiednie operacje usuwania opinii na podstawie reviewId
  // Na przykład:
  db.query('DELETE FROM opinions WHERE id = ?', [reviewId], (err, result) => {
    if (err) {
      console.error('Błąd usuwania opinii z bazy danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    res.json({ message: 'Opinia została pomyślnie usunięta.' });
  });
});

app.get('/reviews/:productId', (req, res) => {
  const productId = req.params.productId;
  const { sort } = req.query;
  console.log(sort);

  let orderBy;
  switch (sort) {
    case 'date_asc':
      orderBy = 'data ASC';
      break;
    case 'date_desc':
      orderBy = 'data DESC';
      break;
    case 'rating_asc':
      orderBy = 'ocena ASC';
      break;
    case 'rating_desc':
      orderBy = 'ocena DESC';
      break;
    default:
      orderBy = 'data DESC'; // Default to sorting by date descending
  }

  const query = `SELECT * FROM opinions WHERE id_produktu = ? ORDER BY ${orderBy}`;
  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews from database:', err);
      return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
    res.json(results);
  });
});



app.post('/order', (req, res) => {
  const { userId, cart } = req.body;

  // Wstawienie zamówienia do bazy danych
  const query = 'INSERT INTO orders (user_id, data, status, date) VALUES (?, ?, "niezrealizowane", NOW())';
  const productsJSON = JSON.stringify(cart); // Zamiana tablicy produktów na JSON
  db.query(query, [userId, productsJSON], (err, result) => {
    if (err) {
      console.error('Błąd zapisu zamówienia do bazy danych:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    res.status(201).json({ message: 'Zamówienie zostało pomyślnie złożone.' });
  });
});

// Endpoint do pobierania wszystkich produktów
app.get('/products', (req, res) => {
  const sql = 'SELECT * FROM products';  // Zapytanie do bazy danych o wszystkie produkty

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Błąd wykonania zapytania do bazy danych: ', err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
      return;
    }
    res.json(results);  // Zwracamy wyniki zapytania jako odpowiedź JSON
  });
});


app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Sprawdzamy czy hasło ma przynajmniej 8 znaków
  if (password.length < 8) {
    res.status(400).json({ error: 'Hasło musi zawierać przynajmniej 8 znaków.' });
    return;
  }

  // Sprawdzamy czy użytkownik o podanym emailu już istnieje w bazie danych
  const query = 'SELECT * FROM uzytkownicy WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy danych:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    if (results.length > 0) {
      res.status(400).json({ error: 'Użytkownik o podanym adresie email już istnieje.' });
      return;
    }

    // Haszowanie hasła przed zapisaniem do bazy danych
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Błąd hashowania hasła:', hashErr);
        res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
        return;
      }

      // Zapisanie nowego użytkownika do bazy danych z dodanym typem 'pacjent'
      const insertQuery = 'INSERT INTO uzytkownicy (email, pass) VALUES (?, ?)';
      db.query(insertQuery, [email, hashedPassword], (insertErr) => {
        if (insertErr) {
          console.error('Błąd zapisu nowego użytkownika do bazy danych:', insertErr);
          res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
          return;
        }
        res.status(201).json({ message: 'Użytkownik został pomyślnie zarejestrowany.' });
      });
    });
  });
});


app.get('/shop', (req, res) => {
  let sql = `
    SELECT products.*, 
       AVG(opinions.ocena) AS srednia_ocena 
    FROM products
    LEFT JOIN opinions ON products.id = opinions.id_produktu 
    GROUP BY products.id`;

  // Obsługa filtrów
  let filters = [];

  if (req.query.priceFrom) {
    filters.push(`cena >= ${parseFloat(req.query.priceFrom)}`);
  }

  if (req.query.priceTo) {
    filters.push(`cena <= ${parseFloat(req.query.priceTo)}`);
  }

  if (req.query.searchTerm) {
    filters.push(`name LIKE '%${req.query.searchTerm}%'`);
  }

  if (filters.length > 0) {
    sql += ` HAVING ${filters.join(' AND ')}`;
  }

  // Obsługa sortowania
  if (req.query.sortBy) {
    let sortBy = '';
    switch (req.query.sortBy) {
      case 'cena_asc':
        sortBy = 'cena ASC';
        break;
      case 'cena_desc':
        sortBy = 'cena DESC';
        break;
      case 'nazwa_asc':
        sortBy = 'name ASC';
        break;
      case 'nazwa_desc':
        sortBy = 'name DESC';
        break;
      case 'ocena_asc':
        sortBy = 'srednia_ocena ASC';
        break;
      case 'ocena_desc':
        sortBy = 'srednia_ocena DESC';
        break;
      default:
        sortBy = 'cena ASC';
        break;
    }
    sql += ` ORDER BY ${sortBy}`;
  }

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Błąd wykonania kwerendy SELECT: ', err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
      return;
    }
    res.json(results);
  });
});



// Endpoint do pobierania szczegółów produktu na podstawie ID
app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const sql = `SELECT * FROM products WHERE id = ?`;
  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('Błąd wykonania kwerendy SELECT: ', err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
      return;
    }
    res.json(results[0]);
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
